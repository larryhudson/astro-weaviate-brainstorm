import { weaviateClient } from "./client";

export async function getBrainstormsForUser(userId: number) {
    const queryResponse = await weaviateClient.graphql
        .get()
        .withClassName("Brainstorm")
        .withFields("title _additional { id }")
        .withWhere({
            path: ["userId"],
            operator: "Equal",
            valueNumber: userId
        })
        .do();

    const brainstorms = queryResponse.data.Get.Brainstorm.map((brainstorm) => {
        return {
            id: brainstorm._additional.id,
            title: brainstorm.title
        }
    });

    return brainstorms;
}



export async function getSimilarBrainstorms({
    brainstormId
}) {
    const brainstormInWeaviate = await getBrainstormFromWeaviateById({
        brainstormId
    });

    if (!brainstormInWeaviate) {
        return [];
    }

    const brainstormWeaviateId = brainstormInWeaviate._additional.id;

    const queryResponse = await weaviateClient.graphql
        .get()
        .withClassName("Brainstorm")
        .withFields("brainstormId title _additional { distance }")
        .withNearObject({
            id: brainstormWeaviateId
        })
        .withWhere({
            path: ["brainstormId"],
            operator: "NotEqual",
            valueNumber: brainstormId
        })
        .do();

    const similarBrainstorms = queryResponse.data.Get.Brainstorm;

    return similarBrainstorms;
}

export async function getBrainstormById({
    brainstormId
}: {
    brainstormId: string
}) {

    const brainstormObj = await weaviateClient.data
        .getterById()
        .withClassName("Brainstorm")
        .withId(brainstormId)
        .withVector()
        .do();

    if (!brainstormObj) {
        return null;
    }

    return brainstormObj;
}

type BrainstormWithMessages = {
    title: string
    hasMessages: {
        role: string
        content: string
        _additional: {
            id: string
        }
    }[]
    _additional: {
        id: string
    }
}

export async function getBrainstormWithMessagesById({
    brainstormId
}: {
    brainstormId: string
}): Promise<BrainstormWithMessages> {

    const queryResponse = await weaviateClient.graphql
        .get()
        .withClassName("Brainstorm")
        .withFields(`
            title
            summary
            hasMessages {
                ... on BrainstormMessage {
                    _additional { id }
                    role
                    content
                }
            }
            _additional {
                id
            }
        `)
        .withWhere({
            path: ["id"],
            operator: "Equal",
            valueString: brainstormId
        })
        .do();

    if (queryResponse.data.Get.Brainstorm.length === 0) {
        return null;
    }

    const brainstormObj = queryResponse.data.Get.Brainstorm[0];

    return brainstormObj;
}

export async function getBrainstormMessageById({
    brainstormMessageId
}: {
    brainstormMessageId: string
}) {

    console.log("Looking up brainstorm message with ID", brainstormMessageId)

    const brainstormMessageObj = await weaviateClient.data
        .getterById()
        .withClassName("BrainstormMessage")
        .withId(brainstormMessageId)
        .do();

    if (!brainstormMessageObj) {
        return null;
    }

    return brainstormMessageObj;
}

