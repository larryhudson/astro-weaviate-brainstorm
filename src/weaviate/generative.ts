import { weaviateClient } from "./client";
import { getLastMessageIdInBrainstorm } from "./crud";
import { getBrainstormMessageById } from "./query";

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
    console.log({ contextSource })
    console.log({ coachPrompt })

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

    console.log({ brainstormMessageObj })

    const brainstormId = brainstormMessageObj.properties.hasBrainstorm[0].beacon.split("/").at(-1);

    const messageVector = brainstormMessageObj.vector;

    const queryResponse = await weaviateClient
        .graphql.get()
        .withClassName("Brainstorm")
        .withGenerate({
            groupedTask: "These summaries are from the user's previous brainstorms. Summarize the relevant context to help the coach ask better questions"
        })
        .withWhere({
            path: ["id"],
            operator: "NotEqual",
            valueString: brainstormId
        })
        .withNearVector({
            vector: messageVector
        })
        .withFields("summary")
        .withLimit(5)
        .do()

    const relevantContext = queryResponse.data.Get.Brainstorm[0]._additional.generate.groupedResult;

    return relevantContext;
}

// this gets relevant context for a brainstorm message, by searching for similar brainstorm messages in other 
export async function getRelevantContextFromSimilarBrainstormMessages({
    brainstormMessageId
}: {
    brainstormMessageId: string
}) {

    console.log("Getting relevant context for brainstorm message with ID", brainstormMessageId)

    const brainstormMessageObj = await getBrainstormMessageById({
        brainstormMessageId
    });

    // beacon is in the form of "weaviate://localhost/BrainstormMessage/1234", so the ID is the last part
    const brainstormId = brainstormMessageObj.properties.hasBrainstorm[0].beacon.split("/").at(-1);

    if (!brainstormMessageObj) {
        return null;
    }

    const queryResponse = await weaviateClient
        .graphql.get()
        .withClassName("BrainstormMessage")
        .withGenerate({
            groupedTask: "These messages are from the user's previous brainstorms. Summarize the relevant context to help the coach ask better questions"
        })
        .withNearObject({
            id: brainstormMessageId
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