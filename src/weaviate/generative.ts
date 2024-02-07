import { weaviateClient } from "./client";
import { getLastMessageIdInBrainstorm } from "./crud";
import { getBrainstormById, getBrainstormMessageById } from "./query";

export async function generateSummaryForBrainstorm({
    brainstormId,
}: {
    brainstormId: string;
}): Promise<{
    summary: string;
    summaryPrompt: string;
}> {
    const summaryPrompt = "Use the brainstorm messages to write a summary of the brainstorm session. Use Markdown for formatting. Write a clear, standalone document that could be shared to get feedback on the ideas. Write in the first person as the user."

    const queryResponse = await weaviateClient
        .graphql.get()
        .withClassName("BrainstormMessage")
        .withGenerate({
            groupedTask: summaryPrompt
        })
        .withWhere({
            path: ["hasBrainstorm", "Brainstorm", "id"],
            operator: "Equal",
            valueString: brainstormId
        })
        .withFields("content")
        .do()

    const summary = queryResponse.data.Get.BrainstormMessage[0]._additional.generate.groupedResult;

    return {
        summary,
        summaryPrompt
    };
}

export async function getNewCoachMessageForBrainstorm({
    brainstormId,
    contextSource,
}: {
    brainstormId: string;
    contextSource: "brainstorm" | "brainstormMessage" | null;
}): Promise<{
    coachMessage: string;
    coachPrompt: string;
    contextSource: "brainstorm" | "brainstormMessage" | null;
}> {

    let coachPrompt = `Use the brainstorm messages to ask a thought-provoking question that will help the user think deeper about their ideas.`;
    if (contextSource === "brainstormMessage") {
        const lastMessageId = await getLastMessageIdInBrainstorm({
            brainstormId
        })
        const relevantContext = await getRelevantContextFromSimilarBrainstormMessages({
            brainstormMessageId: lastMessageId
        });
        coachPrompt += `\n Use this context: ${relevantContext}`
    } else if (contextSource === "brainstorm") {
        const lastMessageId = await getLastMessageIdInBrainstorm({
            brainstormId
        })
        const relevantContext = await getRelevantContextFromSimilarBrainstormSummaries({
            brainstormMessageId: lastMessageId
        });
        coachPrompt += `\n Use this context: ${relevantContext}`
    }

    const queryResponse = await weaviateClient
        .graphql.get()
        .withClassName("BrainstormMessage")
        .withGenerate({
            groupedTask: coachPrompt
        })
        .withWhere(
            {
                operator: "And",
                operands: [
                    {
                        path: ["hasBrainstorm", "Brainstorm", "id"],
                        operator: "Equal",
                        valueString: brainstormId
                    },
                ]
            }
        )
        .withFields("content")
        .withSort([{
            path: ["createdAt"],
            order: "asc"
        }])
        .do()

    const coachMessage = queryResponse.data.Get.BrainstormMessage[0]._additional.generate.groupedResult;

    return {
        coachMessage,
        coachPrompt,
        contextSource
    };
}

export async function getRelevantContextFromSimilarBrainstormSummaries({
    brainstormMessageId
}: {
    brainstormMessageId: string
}) {

    const brainstormMessageObj = await getBrainstormMessageById({
        brainstormMessageId
    });

    const brainstormId = brainstormMessageObj.properties.hasBrainstorm[0].beacon.split("/").at(-1);

    const messageVector = brainstormMessageObj.vector;

    const messageContent = brainstormMessageObj.properties.content;

    const queryResponse = await weaviateClient
        .graphql.get()
        .withClassName("Brainstorm")
        .withGenerate({
            groupedTask: `These summaries are from the user's previous brainstorms. Write a succinct paragraph of context related to this message: ${messageContent}`
        })
        .withWhere({
            path: ["id"],
            operator: "NotEqual",
            valueString: brainstormId
        })
        .withNearVector({
            vector: messageVector,
            distance: 0.2
        })
        .withFields("summary")
        .withLimit(3)
        .do()

    // TODO: I want to filter the results to only include the ones where the vector distance is less than a certain threshold
    // but adding _additional { distance } to the 'fields' seems to break the query
    // and I'm not sure how to add a 'where' filter for the vector distance.

    const relevantContext = queryResponse.data.Get.Brainstorm[0]._additional.generate.groupedResult;

    return relevantContext;
}

// this gets relevant context for a brainstorm message, by searching for similar brainstorm messages in other 
export async function getRelevantContextFromSimilarBrainstormMessages({
    brainstormMessageId
}: {
    brainstormMessageId: string
}) {

    const brainstormMessageObj = await getBrainstormMessageById({
        brainstormMessageId
    });

    if (!brainstormMessageObj) {
        return null;
    }

    // beacon is in the form of "weaviate://localhost/BrainstormMessage/1234", so the ID is the last part
    const brainstormId = brainstormMessageObj.properties.hasBrainstorm[0].beacon.split("/").at(-1);

    const messageContent = brainstormMessageObj.properties.content;

    const queryResponse = await weaviateClient
        .graphql.get()
        .withClassName("BrainstormMessage")
        .withGenerate({
            groupedTask: `These messages are from the user's previous brainstorms. Write a succinct paragraph of context related to this message: ${messageContent}`
        })
        .withNearObject({
            id: brainstormMessageId,
            distance: 0.2
        })
        .withWhere({
            operator: "And",
            operands: [
                {
                    path: ["hasBrainstorm", "Brainstorm", "id"],
                    operator: "NotEqual",
                    valueString: brainstormId
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

export async function findConnectionsWithOtherBrainstorms({
    brainstormId
}: {
    brainstormId: string
}) {

    const thisBrainstormObj = await getBrainstormById({
        brainstormId
    })

    const thisBrainstormTitle = thisBrainstormObj.properties.title;
    const thisBrainstormSummary = thisBrainstormObj.properties.summary;

    if (!thisBrainstormSummary) {
        throw new Error("This brainstorm does not have a summary yet")
    }

    const queryResponse = await weaviateClient
        .graphql.get()
        .withClassName("Brainstorm")
        .withGenerate({
            singlePrompt: `Make connections between this brainstorm and the other brainstorm titled {title}. Return a Markdown bullet list of maximum 5 items.
            
            This brainstorm with title ${thisBrainstormTitle}:
            ${thisBrainstormSummary}
            
            The other brainstorm with title {title}:
            {summary}`
        })
        .withWhere({
            operator: "And",
            operands: [
                {
                    path: ["id"],
                    operator: "NotEqual",
                    valueString: brainstormId
                },
                {
                    path: ["summary"],
                    operator: "IsNull",
                    valueBoolean: false,
                }
            ]
        })
        .withNearObject({
            id: brainstormId
        })
        .withFields("title summary")
        .withLimit(5)
        .do()

    const brainstormsWithConnections = queryResponse.data.Get.Brainstorm.map((brainstorm: any) => {
        return {
            title: brainstorm.title,
            summary: brainstorm.summary,
            // TODO: can't seem to get the ID from the other brainstorm.
            connections: brainstorm._additional.generate.singleResult
        }
    })

    return brainstormsWithConnections;
}