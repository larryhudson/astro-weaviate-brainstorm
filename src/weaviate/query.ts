import { weaviateClient } from ".";

export async function getRelevantContextForBrainstormMessage({
    brainstormMessageId
}) {
    const brainstormMessageInWeaviate = await getBrainstormMessageFromWeaviateById({
        brainstormMessageId
    });

    const brainstormMessageWeaviateId = brainstormMessageInWeaviate._additional.id;

    const queryResponse = await weaviateClient
        .graphql.get()
        .withClassName("BrainstormMessage")
        .withGenerate({
            groupedTask: "Summarize the relevant context from previous brainstorms"
        })
        .withNearObject({
            id: brainstormMessageWeaviateId
        })
        .withWhere({
            operator: "And",
            operands: [
                {
                    path: ["brainstormId"],
                    operator: "NotEqual",
                    valueNumber: brainstormMessageInWeaviate.brainstormId
                },
                {
                    path: ["role"],
                    operator: "Equal",
                    valueString: "user"
                }
            ]
        })
        .withFields("content")
        .withLimit(5)
        .do()

    const relevantContext = queryResponse.data.Get.BrainstormMessage[0]._additional.generate.groupedResult;

    return relevantContext;
}

export async function getRelevantContextForBrainstorm({
    brainstormId,
}) {
    const brainstormInWeaviate = await getBrainstormFromWeaviateById({
        brainstormId
    });

    const brainstormWeaviateId = brainstormInWeaviate._additional.id;
    const brainstormVector = brainstormInWeaviate._additional.vector;

    console.log({ brainstormWeaviateId })

    const queryResponse = await weaviateClient
        .graphql.get()
        .withClassName("BrainstormMessage")
        .withGenerate({
            groupedTask: "Summarize the relevant context from previous brainstorms"
        })
        .withNearVector({
            vector: brainstormVector
        })
        .withWhere({
            operator: "And",
            operands: [
                {
                    path: ["brainstormId"],
                    operator: "NotEqual",
                    valueNumber: brainstormId
                },
                {
                    path: ["role"],
                    operator: "Equal",
                    valueString: "user"
                }
            ]
        })
        .withFields("content")
        .withLimit(5)
        .do()

    const relevantContext = queryResponse.data.Get.BrainstormMessage[0]._additional.generate.groupedResult;

    return relevantContext;
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

export async function getBrainstormFromWeaviateById({
    brainstormId
}) {
    const queryResponse = await weaviateClient.graphql
        .get()
        .withClassName("Brainstorm")
        .withFields("brainstormId title  _additional { vector id }")
        .withWhere({
            path: ["brainstormId"],
            operator: "Equal",
            valueNumber: brainstormId
        })
        .do();

    if (queryResponse.data.Get.Brainstorm.length === 0) {
        return null;
    }

    const brainstorm = queryResponse.data.Get.Brainstorm[0];

    return brainstorm;
}

export async function getBrainstormMessageFromWeaviateById({
    brainstormMessageId
}) {

    console.log("Looking up brainstorm message with ID", brainstormMessageId)

    const queryResponse = await weaviateClient.graphql
        .get()
        .withClassName("BrainstormMessage")
        .withFields("brainstormId brainstormMessageId content role  _additional { id }")
        .withWhere({
            path: ["brainstormMessageId"],
            operator: "Equal",
            valueNumber: brainstormMessageId
        })
        .do();

    console.log("queryResponse")
    console.log(queryResponse)

    if (queryResponse.data.Get.BrainstormMessage.length === 0) {
        return null;
    }

    const brainstormMessage = queryResponse.data.Get.BrainstormMessage[0];

    return brainstormMessage;
}