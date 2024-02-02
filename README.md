# Astro starter with SQLite and BullMQ

This is an Astro starter project with a headstart for creating server-rendered web apps. I have been using this pattern for creating fairly simple web apps and deploying them on Ubuntu VPS servers.

- Astro with server-side rendering (with `@astrojs/node` adapter)
- sqlite database using `better-sqlite3` library with script for initialising (`initialise-db.js`) and helper functions for CRUD actions (see `src/utils/db.js`)
- Example routes for CRUD actions:
    - index of notes `src/pages/notes/index.astro`
    - view note `src/pages/notes/[id]/index.astro`
    - edit note `src/pages/notes/[id]/edit.astro`
- asynchronous task processing with `bullmq` library. can add jobs to queue inside Astro routes / API endpoints, and then the queue handles those jobs.
- simple `<Layout>` component with status messages
- simple `<Dump>` component for viewing variables in dev
- import alias `@src` pointing to src folder for simple imports

## Local dev instructions
- `git clone` this repository
- to initialise database, edit the SQL create statements in `initialise-db.js` and then run `node initialise-db.js`
- for asynchronous task processing:
    - install Redis
    - edit tasks in `consume-tasks.js` and run `node consume-tasks.js`
- `npm run dev` to start up Astro dev server

## Work in progress
- Set up example async tasks. File upload and then process?
- Instructions for deploying on a VPS server
    - Setting up pm2
    - Nginx configuration
    - Process for making changes

# From Astro

```
npm create astro@latest -- --template minimal
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/minimal)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/minimal)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/minimal/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:3000`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
