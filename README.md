# `astro-weviate-brainstorm`

This is a project for me to play around with some ideas for a brainstorming app using [Astro](https://astro.build) + [Weaviate](https://weaviate.io).

The web app gives you an AI coach that asks you questions to help you think through your idea. It's heavily inspired by [Brainstory](https://brainstory.ai) - a great web app that guides you through a brainstorming session and helps you turn your ideas into something real.

I'm using this project to help me learn more about vector databases, and find out what they could be useful for. If you want a real web app for brainstorming, try out [Brainstory](https://brainstory.ai)!

## 15 min video walkthrough

[![YouTube video - Using Weaviate's generative search for brainstorming](https://img.youtube.com/vi/aUSLy2p5RkE/0.jpg)](https://www.youtube.com/watch?v=aUSLy2p5RkE "Using Weaviate's generative search for brainstorming")

## How does this work?
- This is an Astro web app that uses the `@astrojs/node` adapter to render the web app on the server.
- The database is an [embedded instance of Weaviate](https://weaviate.io/developers/weaviate/installation/embedded) that runs within the same process as the Astro web server. When the Weaviate client is imported within the Astro application code, it sets up a dedicated Weaviate instance and connects to it.
- When the Weaviate instance is initialised, it creates the `Brainstorm` and `BrainstormMessage` classes and adds some example brainstorms to get started.
- The user uses the web app to create new brainstorms. Each brainstorm is a conversation with an AI coach. The coach uses the previous messages from the brainstorm to ask thought-provoking questions to help the user think through their ideas. 

## How to get started
- Clone this Git repository. `cd` into the directory and run `npm install` to install the dependencies.
- Duplicate `.env.sample` to `.env` and edit with your OpenAI API key. 
- Run `npm run dev` to start up the local dev server. 
- Go to [http://localhost:4321](http://localhost:4321) in your web browser.

## Retrieval Augmented Generation (RAG) with Weaviate
- This project uses Weaviate's ['generative search' or RAG](https://weaviate.io/developers/weaviate/search/generative) for a few features:
    - to generate a new thought-provoking question using the previous messages from the brainstorm
    - to find relevant context from preivous brainstorms
    - to generate a summary of the brainstorm.
- You can find the application code for these functions in `./src/weaviate/generative.ts`.