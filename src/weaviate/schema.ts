
const BRAINSTORM_MESSAGE_CLASS = {
  class: "BrainstormMessage",
  description: "Brainstorm messages",
  properties: [
    {
      name: "brainstormId",
      dataType: ["number"],
      description: "Brainstorm ID in SQLite database",
    },
    {
      name: "brainstormMessageId",
      dataType: ["number"],
      description: "Brainstorm message ID in SQLite database",
    },
    {
      name: "role",
      dataType: ["text"],
      description: "Role",
      moduleConfig: {
        "text2vec-openai": {
          skip: true,
        },
      },
    },
    {
      name: "content",
      dataType: ["text"],
      description: "Content",
    }
  ]

}

const BRAINSTORM_CLASS = {
  class: "Brainstorm",
  description: "Brainstorms",
  moduleConfig: {
    "ref2vec-centroid": {
      referenceProperties: ["hasMessages"],
      method: "mean"
    },
  },
  properties: [
    {
      name: "brainstormId",
      dataType: ["number"],
      description: "Brainstorm ID in SQLite database",
    },
    {
      name: "title",
      dataType: ["text"],
      description: "Brainstorm title",
    },
    {
      name: "hasMessages",
      dataType: ["BrainstormMessage"],
      description: "Brainstorm messages",
    },
  ],
  vectorizer: "ref2vec-centroid",
}

export async function initialiseSchema(client) {

  const brainstormMessageSchemaExists = await client.schema.exists(BRAINSTORM_MESSAGE_CLASS.class);

  if (!brainstormMessageSchemaExists) {
    console.log("Creating brainstorm message class");
    await client.schema.classCreator().withClass(BRAINSTORM_MESSAGE_CLASS).do();
  }

  const brainstormSchemaExists = await client.schema.exists(BRAINSTORM_CLASS.class);

  if (!brainstormSchemaExists) {
    console.log("Creating brainstorm class");
    await client.schema.classCreator().withClass(BRAINSTORM_CLASS).do();
  }
}
