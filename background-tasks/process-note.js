import { updateRecord } from "../src/utils/db.js";

export async function processNote({ noteId }) {
  updateRecord("notes", noteId, { status: "processing" });

  let currentProgress = 0;

  while (currentProgress < 100) {
    const randomNumberMin = 0;
    const randomNumberMax = 20;

    const randomNumber =
      Math.floor(Math.random() * randomNumberMax) + randomNumberMin;

    currentProgress = Math.min(100, currentProgress + randomNumber);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    updateRecord("notes", noteId, { progress: currentProgress });
  }

  const now = new Date();
  const dateString = now.toISOString();
  updateRecord("notes", noteId, {
    status: "processed",
    processed_at: dateString,
  });
  return true;
}
