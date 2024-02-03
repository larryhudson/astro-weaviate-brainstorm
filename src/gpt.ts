import { getMessagesForBrainstorm } from "./db"
import type { Message } from "./db"
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: import.meta.env.OPENAI_API_KEY
})

type GPTMessage = {
    role: "user" | "assistant" | "system";
    content: string;
}

async function getChatCompletion({
    systemPrompt,
    messages,
    contextString
}: {
    systemPrompt: string;
    messages: Message[];
    contextString?: string | null;
}): Promise<string> {

    const gptMessages: GPTMessage[] = messages.map((message: Message) => {
        return {
            role: message.role,
            content: message.content
        }
    });

    const contextMessages = contextString ? [{
        role: "assistant",
        content: contextString
    }] : [];

    const allMessages = [
        {
            role: "system",
            content: systemPrompt
        },
        ...gptMessages,
        ...contextMessages
    ]

    console.log("allMessages")
    console.log(allMessages)

    const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: allMessages
    });

    const completionContent = completion.choices[0].message.content;

    return completionContent;
}

export async function getNewCoachMessageForBrainstorm({ brainstormId, relevantContext }: { brainstormId: number, relevantContext: string | null }): Promise<string> {

    let coachSystemPrompt = `You are a brainstorming coach. Ask questions that will help the user think through their ideas. Keep your questions short. Do not send long responses - allow the user to do the talking. Only ask one question at a time. In the messages, you may have extra context that you can use to ask better questions, or to make interesting connections.`

    // if (relevantContext) {
    //     coachSystemPrompt += `\n\nExtra context: ${relevantContext}`
    // }

    const messages = getMessagesForBrainstorm(brainstormId);

    const coachMessage = await getChatCompletion({
        systemPrompt: coachSystemPrompt,
        messages,
        contextString: relevantContext
    });

    return coachMessage;
}

export async function generateSummaryForBrainstorm(brainstormId: number): Promise<string> {

    const summarySystemPrompt = `You are summarizing a brainstorming session. Use the user's ideas to write a concise output that is ready to share. Use Markdown for formatting. Use headings if necessary. Do not add your own ideas. Only summarize the user's ideas.`

    const messages = getMessagesForBrainstorm(brainstormId);

    const summary = await getChatCompletion({
        systemPrompt: summarySystemPrompt,
        messages
    });

    return summary;
}
