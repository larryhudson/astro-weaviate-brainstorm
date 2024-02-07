import { weaviateClient } from "./client";
import { getBrainstormMessageById } from "./query";

export async function createBrainstorm({ userId, title }: { userId: number, title: string }) {
    const createdBrainstorm = await weaviateClient.data.creator()
        .withClassName("Brainstorm")
        .withProperties({
            userId,
            title
        }).do();

    const defaultCoachMessage = "What do you want to brainstorm?";

    // create a default message for the brainstorm
    await createBrainstormMessage({
        brainstormId: createdBrainstorm.id as string,
        role: "assistant",
        content: defaultCoachMessage
    });

    return createdBrainstorm;
}

type BrainstormMessage = {
    role: string;
    content: string;
    _additional: {
        id: string;
    }
}

export async function getLastMessageIdInBrainstorm({ brainstormId }: { brainstormId: string }): Promise<BrainstormMessage> {
    const queryResponse = await weaviateClient.graphql.get()
        .withClassName("BrainstormMessage")
        .withWhere(
            {
                path: ["hasBrainstorm", "Brainstorm", "id"],
                operator: "Equal",
                valueString: brainstormId
            }
        )
        .withFields("role content _additional { id }")
        .withSort([
            {
                path: ["createdAt"],
                order: "desc"
            }
        ])
        .withLimit(1)
        .do();

    return queryResponse.data.Get.BrainstormMessage[0]._additional.id;
}

export async function createBrainstormMessage({ brainstormId, role, content }: { brainstormId: string, role: string, content: string }) {
    const currentDate = new Date().toISOString();

    const createdMessage = await weaviateClient.data.creator()
        .withClassName("BrainstormMessage")
        .withProperties({
            role,
            content,
            createdAt: currentDate
        }).do();

    // add a reference from the message to the brainstorm
    await weaviateClient.data.referenceCreator()
        .withClassName("Brainstorm")
        .withId(brainstormId)
        .withReferenceProperty("hasMessages")
        .withReference(
            weaviateClient.data
                .referencePayloadBuilder()
                .withClassName("BrainstormMessage")
                .withId(createdMessage.id as string)
                .payload()
        )
        .do();

    // add a reference from the brainstorm to the message
    await weaviateClient.data.referenceCreator()
        .withClassName("BrainstormMessage")
        .withId(createdMessage.id as string)
        .withReferenceProperty("hasBrainstorm")
        .withReference(
            weaviateClient.data
                .referencePayloadBuilder()
                .withClassName("Brainstorm")
                .withId(brainstormId)
                .payload()
        )
        .do();

    return createdMessage;
}

export async function updateBrainstormSummary({ brainstormId, summary }: { brainstormId: string, summary: string }) {
    const updatedBrainstorm = await weaviateClient.data.merger()
        .withClassName("Brainstorm")
        .withId(brainstormId)
        .withProperties({
            summary
        }).do();

    return updatedBrainstorm;
}

export async function deleteBrainstorm({ brainstormId }: { brainstormId: string }) {
    // lookup message IDs
    const messageQueryResponse = await weaviateClient.graphql.get()
        .withClassName("BrainstormMessage")
        .withWhere({
            path: ["hasBrainstorm", "Brainstorm", "id"],
            operator: "Equal",
            valueString: brainstormId
        })
        .withFields("hasBrainstorm { ... on Brainstorm { _additional { id } } } _additional { id }")
        .do();

    const messageIds = messageQueryResponse.data.Get.BrainstormMessage.map((message: { _additional: { id: string } }) => message._additional.id);

    await deleteBrainstormMessages({
        brainstormId,
        messageIds
    });

    await weaviateClient.data.deleter().withClassName("Brainstorm").withId(brainstormId).do();
}

async function deleteReference({ fromClass, fromId, fromProperty, toClass, toId }: { fromClass: string, fromId: string, fromProperty: string, toClass: string, toId: string }) {
    await weaviateClient.data.referenceDeleter()
        .withClassName(fromClass)
        .withId(fromId)
        .withReferenceProperty(fromProperty)
        .withReference(
            weaviateClient.data.referencePayloadBuilder()
                .withClassName(toClass)
                .withId(toId)
                .payload()
        )
        .do();
}

export async function deleteBrainstormMessages({ brainstormId, messageIds }: { brainstormId: string, messageIds: string[] }) {

    // remove the references from the messages to the brainstorm
    for (const messageId of messageIds) {
        // not sure if we need to do this
        await deleteReference({
            fromClass: "BrainstormMessage",
            fromId: messageId,
            fromProperty: "hasBrainstorm",
            toClass: "Brainstorm",
            toId: brainstormId
        });
        await deleteReference({
            fromClass: "Brainstorm",
            fromId: brainstormId,
            fromProperty: "hasMessages",
            toClass: "BrainstormMessage",
            toId: messageId
        });
    }

    if (messageIds.length > 0) {
        await weaviateClient.batch.objectsBatchDeleter()
            .withClassName("BrainstormMessage")
            .withWhere({
                path: ["id"],
                operator: "ContainsAny",
                valueTextArray: messageIds
            })
            .do();
    }
}


export async function deleteMessageAndNewer({ brainstormId, brainstormMessageId }: { brainstormId: string, brainstormMessageId: string }) {
    const brainstormMessage = await getBrainstormMessageById({ brainstormMessageId });
    if (!brainstormMessage) {
        throw new Error("Message not found");
    }

    const thisMessageId = brainstormMessage.id;
    const createdAt = brainstormMessage.properties.createdAt;

    // query to find messages newer than the one to delete
    const newerMessagesResponse = await weaviateClient.graphql.get()
        .withClassName("BrainstormMessage")
        .withWhere({
            operator: "And",
            operands: [
                {
                    path: ["createdAt"],
                    operator: "GreaterThan",
                    valueDate: createdAt
                },
                {
                    path: ["hasBrainstorm", "Brainstorm", "id"],
                    operator: "Equal",
                    valueString: brainstormId
                }
            ]
        })
        .withFields("hasBrainstorm { ... on Brainstorm {  _additional { id } } } _additional { id }")
        .do();

    const newerMessageIds = newerMessagesResponse.data.Get.BrainstormMessage.map((message: { _additional: { id: string } }) => message._additional.id);

    const messageIdsToDelete = [thisMessageId, ...newerMessageIds];

    await deleteBrainstormMessages({
        brainstormId,
        messageIds: messageIdsToDelete
    })
}