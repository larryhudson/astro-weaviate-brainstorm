import { getBrainstormById, getMessagesForBrainstorm } from "@src/db";
import { weaviateClient } from ".";
import { getBrainstormFromWeaviateById } from "./query";

export async function addMessageToWeaviate({
    brainstormId,
    brainstormMessageId,
    role,
    content
}) {
    console.log(`Adding message to weaviate: ${content}`)
    const createMessageResult = await weaviateClient.data.creator()
        .withClassName("BrainstormMessage")
        .withProperties({
            brainstormId,
            brainstormMessageId,
            role,
            content
        }).do();

    const messageWeaviateId = createMessageResult.id as string;

    const weaviateBrainstorm = await getBrainstormFromWeaviateById({
        brainstormId
    });

    const brainstormWeaviateId = weaviateBrainstorm._additional.id;

    console.log(`Adding reference from message to brainstorm: ${messageWeaviateId} -> ${brainstormWeaviateId}`)
    await weaviateClient.data.referenceCreator()
        .withClassName("Brainstorm")
        .withId(brainstormWeaviateId)
        .withReferenceProperty("hasMessages")
        .withReference(
            weaviateClient.data
                .referencePayloadBuilder()
                .withClassName("BrainstormMessage")
                .withId(messageWeaviateId)
                .payload()
        )
        .do();

    return createMessageResult.id;
}

export async function addBrainstormToWeaviate({ brainstormId }: { brainstormId: number }) {

    // get the brainstorm from the database
    const brainstorm = getBrainstormById(brainstormId);

    const messages = getMessagesForBrainstorm(brainstormId);

    const messageIds = [];

    for (const message of messages) {
        console.log(`Adding message to weaviate: ${message.content}`);
        // add the message to weaviate
        const createMessageResult = await weaviateClient.data.creator().withClassName("BrainstormMessage").withProperties({
            brainstormId: message.brainstorm_id,
            brainstormMessageId: message.id,
            role: message.role,
            content: message.content
        }).do();
        messageIds.push(createMessageResult.id as string);
    }

    // add the brainstorm to weaviate
    console.log(`Adding brainstorm to weaviate: ${brainstorm.title}`)
    const createBrainstormResult = await weaviateClient.data.creator().withClassName("Brainstorm").withProperties({
        brainstormId: brainstorm.id,
        title: brainstorm.title,
    }).do();

    const brainstormWeaviateId = createBrainstormResult.id as string;

    // add the references between the messages and the brainstorm
    for (const messageId of messageIds) {
        console.log(`Adding reference from message to brainstorm: ${messageId} -> ${brainstormWeaviateId}`)
        await weaviateClient.data.referenceCreator()
            .withClassName("Brainstorm")
            .withId(brainstormWeaviateId)
            .withReferenceProperty("hasMessages")
            .withReference(
                weaviateClient.data
                    .referencePayloadBuilder()
                    .withClassName("BrainstormMessage")
                    .withId(messageId)
                    .payload()
            )
            .do();
    }
}