import weaviate, { EmbeddedOptions, type EmbeddedClient } from "weaviate-ts-embedded";
import { initialiseSchema } from "./schema";
import path from "path";

async function initialiseWeaviate(client: EmbeddedClient) {
  await initialiseSchema(client);
}

const WEAVIATE_DATA_PATH = path.join(
  process.cwd(),
  "weaviate-data"
)

export const weaviateClient = weaviate.client(
  new EmbeddedOptions({
    port: 9898,
    env: {
      DEFAULT_VECTORIZER_MODULE: "text2vec-openai",
      OPENAI_APIKEY: import.meta.env.VITE_OPENAI_APIKEY,
      PERSISTENCE_DATA_PATH: WEAVIATE_DATA_PATH,
    },
  }),
  {
    scheme: "http",
    host: "127.0.0.1:9898",
  },
);

await weaviateClient.embedded.start();
await initialiseWeaviate(weaviateClient);