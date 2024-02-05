import type { EmbeddedClient } from "weaviate-ts-embedded";
import { createBrainstorm, createBrainstormMessage } from "./crud";

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
  properties: [
    {
      name: "userId",
      dataType: ["number"],
      description: "User ID",
      moduleConfig: {
        "text2vec-openai": {
          skip: true,
        },
      }
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
      moduleConfig: {
        "text2vec-openai": {
          skip: true,
        },
      }
    },
    {
      name: "createdAt",
      dataType: ["date"],
      description: "Created at",
      moduleConfig: {
        "text2vec-openai": {
          skip: true,
        },
      }
    },
    {
      name: "summary",
      dataType: ["text"],
      description: "Summary",
    }
  ],
}

const SEED_BRAINSTORMS = [
  {
    userId: 1,
    title: "Motivation for learning French",
    messages: [
      {
        role: "assistant",
        content: "What do you want to brainstorm about?",
      },
      {
        role: "user",
        content: "I want to brainstorm about my motivations for learning French. I am moving to Paris in a couple of months and I need to learn as much as I can. I have been procrastinating and I want to reinforce my motivations so I can be more engaged with it."
      },
      {
        role: "assistant",
        content: "What are some benefits of learning French?"
      },
      {
        role: "user",
        content: "Learning more French before I move will make it easier for me to communicate with people in Paris. It will give me a better foundation of knowledge so that I can deal with the shock of moving somewhere where they don't speak English."
      },
      {
        role: "assistant",
        content: "How can you make learning French easier or more fun?"
      }
    ]
  },
  {
    userId: 1,
    title: "Reflecting on the month",
    messages: [
      {
        role: "assistant",
        content: "What do you want to brainstorm about?",
      },
      {
        role: "user",
        content: "It is the end of January. I want to review what I have done this month and think about some highlights",
      },
      {
        role: "assistant",
        content: "What are some highlights from this month?",
      },
      {
        role: "user",
        content: "I have been practicing meditation - I started learning how to meditate and have been doing it every day in the morning. I have also been learning French."
      },
      {
        role: "assistant",
        content: "Are there any projects or tasks that you have completed this month that you are proud of?"
      }
    ]
  },
  {
    userId: 1,
    title: "My goals for this year",
    messages: [
      {
        role: "assistant",
        content: "What do you want to brainstorm about?",
      },
      {
        role: "user",
        content: "I want to brainstorm about my goals for this year. I want to set some goals for the year and think about how I can achieve them."
      },
      {
        role: "assistant",
        content: "What are some goals that you want to achieve this year?"
      },
      {
        role: "user",
        content: "I want to achieve some balance with how I spend my time and my interests. I want to use time blocking to make progress on the different things that I am interested in, rather than getting into one thing and neglecting everything else."
      },
      {
        role: "assistant",
        content: "What are some practical ways you can make sure you're making progress on your goals?"
      },
      {
        role: "user",
        content: "I can use time blocking to make sure that I am making progress on the different things that I am interested in. I can also use a journal to track my progress and reflect on how I am doing."
      }
    ]
  }
]

async function addSeedData() {
  for (const brainstorm of SEED_BRAINSTORMS) {
    const createdBrainstorm = await createBrainstorm({
      userId: brainstorm.userId,
      title: brainstorm.title
    });

    const createdBrainstormId = createdBrainstorm.id as string;

    for (const message of brainstorm.messages) {
      await createBrainstormMessage({
        brainstormId: createdBrainstormId,
        role: message.role,
        content: message.content,
      });
    }

  }
}

export async function initialiseSchema(weaviateClient: EmbeddedClient) {

  const brainstormMessageSchemaExists = await weaviateClient.schema.exists(BRAINSTORM_MESSAGE_CLASS.class);

  if (!brainstormMessageSchemaExists) {
    console.log("Creating brainstorm message class");
    await weaviateClient.schema.classCreator().withClass(BRAINSTORM_MESSAGE_CLASS).do();
  }

  const brainstormSchemaExists = await weaviateClient.schema.exists(BRAINSTORM_CLASS.class);

  if (!brainstormSchemaExists) {
    console.log("Creating brainstorm class");
    await weaviateClient.schema.classCreator().withClass(BRAINSTORM_CLASS).do();

    // add 'hasBrainstorm' reference to BrainstormMessage
    await weaviateClient.schema
      .propertyCreator()
      .withClassName("BrainstormMessage")
      .withProperty({
        name: "hasBrainstorm",
        dataType: ["Brainstorm"],
        description: "Brainstorm",
      })
      .do();

    await addSeedData();
  }

}