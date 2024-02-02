import { Worker } from "bullmq";
import { processNote } from "./background-tasks/process-note.js";

const handlers = {
  processNote,
};

function handleJob(job) {
  const handler = handlers[job.name];

  if (!handler) {
    throw new Error(`No handler for job ${job.name}`);
  }

  console.log({ jobData: job.data });

  return handler(job.data);
}

const redisOptions = {
  connection: {
    host: "127.0.0.1",
    port: 6379,
  },
};

const worker = new Worker("taskQueue", handleJob, redisOptions);

worker.on("active", (job) => {
  console.log(`${job.id} has started!`);
});

worker.on("completed", (job) => {
  console.log(`${job.id} has completed!`);
});

worker.on("failed", (job, err) => {
  console.log(`${job.id} has failed with ${err.message}`);
});
