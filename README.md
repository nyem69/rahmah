# create-svelte

Everything you need to build a Svelte project, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/master/packages/create-svelte).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npm create svelte@latest

# create a new project in my-app
npm create svelte@latest my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.



# Cloudflare D1



# Deploy hook

- https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/2cf6252d-76af-4f4e-b7d2-b1c89df884ff

```
curl -XPOST https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/2cf6252d-76af-4f4e-b7d2-b1c89df884ff
{
  "result": {
    "id": "bf664313-24e4-4a1d-a810-50639800f300"
  },
  "success": true,
  "errors": [],
  "messages": []
}

```
