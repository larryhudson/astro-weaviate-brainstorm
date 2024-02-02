import { Queue } from "bullmq";

export const taskQueue = new Queue("taskQueue", {
  connection: {
    host: "127.0.0.1",
    port: 6379,
  },
});
