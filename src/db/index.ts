import { addMessageToWeaviate, addBrainstormToWeaviate } from '@src/weaviate/add';
import Database from 'better-sqlite3';

export const db: Database = new Database('./sqlite.db');

export function getBrainstormsForUser(userId: number): Brainstorm[] {
    const stmt = db.prepare('SELECT * FROM brainstorms WHERE user_id = ?');
    const records = stmt.all(userId);
    return records;
}

type CreateBrainstormParams = {
    userId: number;
    title: string;
}

export async function createBrainstorm({ userId, title, summary }: CreateBrainstormParams) {
    const stmt = db.prepare('INSERT INTO brainstorms (user_id, title, summary) VALUES (?, ?, ?)');
    const result = stmt.run(userId, title, summary);
    const createdBrainstormId = result.lastInsertRowid;

    // create brainstorm in weaviate
    await addBrainstormToWeaviate({
        brainstormId: createdBrainstormId
    })

    const defaultCoachMessage = "What do you want to brainstorm?"

    await addMessageToBrainstorm({
        brainstormId: createdBrainstormId,
        role: "assistant",
        content: defaultCoachMessage
    })

    return createdBrainstormId;
}

type Brainstorm = {
    id: number;
    user_id: number;
    title: string;
    created_at: string;
    summary: string | null;
}

export function getBrainstormById(brainstormId: number): Brainstorm {
    const stmt = db.prepare('SELECT * FROM brainstorms WHERE id = ?');
    const record = stmt.get(brainstormId);
    return record;
}

export function getMessagesForBrainstorm(brainstormId: number): Message[] {
    const stmt = db.prepare('SELECT * FROM brainstorm_messages WHERE brainstorm_id = ?');
    const records = stmt.all(brainstormId);
    return records;
}

type CreateMessage = {
    brainstormId: number;
    role: string;
    content: string;
}

export type Message = {
    id: number;
    brainstorm_id: number;
    role: string;
    content: string;
    created_at: string;
}

export async function addMessageToBrainstorm({ brainstormId, role, content }: CreateMessage): number {
    const stmt = db.prepare('INSERT INTO brainstorm_messages (brainstorm_id, role, content) VALUES (?, ?, ?)');
    const result = stmt.run(brainstormId, role, content);
    const createdMessageId = result.lastInsertRowid;

    await addMessageToWeaviate({
        brainstormId,
        brainstormMessageId: createdMessageId,
        role,
        content
    })

    return createdMessageId;
}

export function updateSummaryForBrainstorm({ brainstormId, summary }: { brainstormId: number, summary: string }) {
    const stmt = db.prepare('UPDATE brainstorms SET summary = ? WHERE id = ?');
    const result = stmt.run(summary, brainstormId);

    return result.changes > 0;
}

export function deleteMessagesAfterId({ brainstormId, messageId }: { brainstormId: number, messageId: number }) {
    const stmt = db.prepare('DELETE FROM brainstorm_messages WHERE brainstorm_id = ? AND id > ?');
    const result = stmt.run(brainstormId, messageId);

    return result.changes > 0;
}