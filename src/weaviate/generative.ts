import { weaviateClient } from ".";
import { getLastMessageInBrainstorm } from "./crud";
import { getBrainstormById, getBrainstormMessageById } from "./query";

export async function generateSummaryForBrainstorm({
    brainstormId,
}: {
    brainstormId: string;
}): Promise<string> {

    const queryResponse = await weaviateClient
        .graphql.get()
        .withClassName("BrainstormMessage")
        .withGenerate({
            groupedTask: "Use the brainstorm messages to write a summary of the brainstorm session. Use Markdown for formatting. Write a clear, standalone document that could be shared to get feedback on the ideas. Write in the first person as the user."
        })
        .withWhere({
            path: ["hasBrainstorm", "Brainstorm", "id"],
            operator: "Equal",
            valueString: brainstormId
        })
        .withFields("content")
        .do()

    const summary = queryResponse.data.Get.BrainstormMessage[0]._additional.generate.groupedResult;

    return summary;
}

export async function getNewCoachMessageForBrainstorm({
    brainstormId,
    shouldUseRelevantContext,
}: {
    brainstormId: string;
    shouldUseRelevantContext: boolean;
}): Promise<string> {

    let coachPrompt = `Use the brainstorm messages to ask a thought-provoking question that will help the user think deeper about their ideas.`;
    if (shouldUseRelevantContext) {
        const lastMessage = await getLastMessageInBrainstorm({
            brainstormId
        })
        const relevantContext = await getRelevantContextForBrainstormMessage({
            brainstormMessageId: lastMessage._additional.id
        });
        coachPrompt += `\n Use this context to ask a better question: ${relevantContext}`
        console.log({ coachPrompt })
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

    return coachMessage;
}

export async function getRelevantContextForBrainstormMessage({
    brainstormMessageId
}) {

    console.log("Getting relevant context for brainstorm message with ID", brainstormMessageId)

    const brainstormMessageObj = await getBrainstormMessageById({
        brainstormMessageId
    });

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

// export async function getRelevantContextForBrainstorm({
//     brainstormId,
// }) {

//     const brainstormObj = await getBrainstormById({
//         brainstormId
//     });

//     if (!brainstormObj) {
//         return null;
//     }

//     const brainstormVector = brainstormObj.vector as number[];

//     const queryResponse = await weaviateClient
//         .graphql.get()
//         .withClassName("BrainstormMessage")
//         .withGenerate({
//             groupedTask: "Summarize the relevant context from previous brainstorms"
//         })
//         .withNearVector({
//             vector: brainstormVector
//         })
//         .withWhere({
//             operator: "And",
//             operands: [
//                 {
//                     path: ["hasBrainstorm", "Brainstorm", "_additional", "id"],
//                     operator: "NotEqual",
//                     valueNumber: brainstormId
//                 },
//                 {
//                     path: ["role"],
//                     operator: "Equal",
//                     valueString: "user"
//                 }
//             ]
//         })
//         .withFields("content")
//         .withLimit(5)
//         .do()

//     const relevantContext = queryResponse.data.Get.BrainstormMessage[0]._additional.generate.groupedResult;

//     return relevantContext;
// }