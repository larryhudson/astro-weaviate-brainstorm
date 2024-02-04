import { weaviateClient } from ".";

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

export async function getLastMessageInBrainstorm({ brainstormId }: { brainstormId: string }): Promise<BrainstormMessage> {
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

    return queryResponse.data.Get.BrainstormMessage[0];

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