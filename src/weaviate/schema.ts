import type { EmbeddedClient } from "weaviate-ts-embedded";

const BRAINSTORM_MESSAGE_CLASS = {
  class: "BrainstormMessage",
  description: "Brainstorm messages",
  properties: [
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
    },
    {
      name: "createdAt",
      dataType: ["date"],
      description: "Created at",
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
      name: "userId",
      dataType: ["number"],
      description: "User ID",
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
    {
      name: "createdAt",
      dataType: ["date"],
      description: "Created at",
    },
    {
      name: "summary",
      dataType: ["text"],
      description: "Summary",
    }
  ],
  vectorizer: "ref2vec-centroid",
}

const SEED_BRAINSTORMS = [
  {
    userId: 1,
    title: "App for tracking sleep",
    createdAt: "2022-01-01T00:00:00Z",
    messages: [
      {
        role: "assistant",
        content: "What do you want to brainstorm about?",
        createdAt: "2022-01-01T00:00:00Z"
      },
      {
        role: "user",
        content: "I am thinking about a new app idea for tracking sleep",
        createdAt: "2022-01-01T00:01:00Z"
      },
      {
        role: "assistant",
        content: "Why do you want to track sleep?",
        createdAt: "2022-01-01T00:02:00Z",
      },
      {
        role: "user",
        content: "I want to track my sleep to see if I can improve my sleep quality",
        createdAt: "2022-01-01T00:03:00Z",
      }
    ]
  },
  {
    userId: 1,
    title: "Reflecting on the month",
    createdAt: "2022-01-31T00:00:00Z",
    messages: [
      {
        role: "assistant",
        content: "What do you want to brainstorm about?",
        createdAt: "2022-01-31T00:00:00Z",
      },
      {
        role: "user",
        content: "It is the end of January. I want to review what I have done this month and think about some highlights",
        createdAt: "2022-01-31T00:01:00Z",
      },
      {
        role: "assistant",
        content: "What are some highlights from this month?",
        createdAt: "2022-01-31T00:02:00Z",
      }
    ]
  }
]

async function addSeedData(client: EmbeddedClient) {
  console.log("Adding seed data")
  for (const brainstorm of SEED_BRAINSTORMS) {
    const createdBrainstorm = await client.data.creator()
      .withClassName(BRAINSTORM_CLASS.class)
      .withProperties({
        userId: brainstorm.userId,
        title: brainstorm.title,
        createdAt: brainstorm.createdAt
      })
      .do();

    const createdBrainstormId = createdBrainstorm.id as string;

    const createdMessageIds = [];

    for (const message of brainstorm.messages) {
      const createdMessage = await client.data.creator()
        .withClassName(BRAINSTORM_MESSAGE_CLASS.class)
        .withProperties({
          role: message.role,
          content: message.content,
          createdAt: message.createdAt
        })
        .do();

      createdMessageIds.push(createdMessage.id as string);
    }

    for (const createdMessageId of createdMessageIds) {
      console.log("Adding reference from message to brainstorm")
      await client.data.referenceCreator()
        .withClassName(BRAINSTORM_CLASS.class)
        .withId(createdBrainstormId)
        .withReferenceProperty("hasMessages")
        .withReference(
          client.data
            .referencePayloadBuilder()
            .withClassName(BRAINSTORM_MESSAGE_CLASS.class)
            .withId(createdMessageId)
            .payload()
        )
        .do();

      console.log("Adding reference from brainstorm to message")
      await client.data.referenceCreator()
        .withClassName(BRAINSTORM_MESSAGE_CLASS.class)
        .withId(createdMessageId)
        .withReferenceProperty("hasBrainstorm")
        .withReference(
          client.data
            .referencePayloadBuilder()
            .withClassName(BRAINSTORM_CLASS.class)
            .withId(createdBrainstormId)
            .payload()
        )
        .do();
    }

  }
}

export async function initialiseSchema(client: EmbeddedClient) {

  const brainstormMessageSchemaExists = await client.schema.exists(BRAINSTORM_MESSAGE_CLASS.class);

  if (!brainstormMessageSchemaExists) {
    console.log("Creating brainstorm message class");
    await client.schema.classCreator().withClass(BRAINSTORM_MESSAGE_CLASS).do();
  }

  const brainstormSchemaExists = await client.schema.exists(BRAINSTORM_CLASS.class);

  if (!brainstormSchemaExists) {
    console.log("Creating brainstorm class");
    await client.schema.classCreator().withClass(BRAINSTORM_CLASS).do();

    // add 'hasBrainstorm' reference to BrainstormMessage
    await client.schema
      .propertyCreator()
      .withClassName("BrainstormMessage")
      .withProperty({
        name: "hasBrainstorm",
        dataType: ["Brainstorm"],
        description: "Brainstorm",
      })
      .do();

    await addSeedData(client);
  }

}
