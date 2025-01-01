# Xahau Hooks Builder

https://builder.xahau.network/

This is the repository for Xahau Hooks Builder. This project is built with Next.JS

## General

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, copy the `.env.example` to `.env.local` file, someone from the team can provide you your enviroment variables.

Then, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Github Login

If you want to use your Github app to provide login, here's the guide to do that.

- First go to https://github.com/settings/profile -> Developer Settings -> OAuth Apps
- Click "New OAuth App" button
- Give application some name eg. Xrpl Hooks Development
- Give some homepage url eg. localhost:3000
- Give some optional description (these values will show up on the popup when you login)
- Authorization callback URL should be http://localhost:3000/api/auth/callback (if you're creating the app for local development)
- Click register application
- Then a page should open up where you can get client id and client secret values. Copy paste those to .env.local to use them:

```
GITHUB_SECRET="client-secret-here"
GITHUB_ID="client-id-here"
```

Login should now work through your own Github OAuth app.

## Styling and Theming

This project uses Stitches (https://stitches.dev) for theming and styling the components. You should be quite familiar with the API if you have used for example styled-components earlier. Stitches should provide better performance, near zero runtime.

For components we try to use Radix-UI (https://www.radix-ui.com/) as much as possible. It may not provide all the necessary components so you're free to use other components/libraries if those makes sense. For colors we're using Radix-UI Colors (https://radix-ui.com/colors).

Theme file can be found under `./stitches.config.ts` file. When you're creating new components remeber to import `styled` from that file and not `@stitches` directly. That way it will provide the correct theme for you automatically.

Example:

```tsx
// Use our stitches.config instead of @stitches/react
import { styled } from "../stitches.config";

const Box = styled("div", {
  boxSizing: "border-box",
});

export default Box;
```

Custom components can be found from `./components` folder.

## Monaco Editor

Project is relying on Monaco editor heavily. Instead of using Monaco editor directly we're using `@monaco-editor/react` which provides little helpers to use Monaco editor.

On the Develop page we're using following loader for Monaco editor:

```js
loader.config({
  paths: {
    vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.30.1/min/vs",
  },
});
```

By default `@monaco-editor/react` was using 0.29.? version of Monaco editor. @codingame/monaco-languageclient library (connects to clangd language server) was using API methods that were introduced in Monaco Editor 0.30 so that's why we're loading certain version of it.

Monaco Languageclient related stuff is found from `./utils/languageClient.ts`. Basically we're connecting the editor to clangd language server which lives on separate backend. That project can be found from https://github.com/eqlabs/xrpl-hooks-compiler/. If you need access to that project ask permissions from @vbar (Vaclav Barta) on GitHub.

### Language server hover messages
If you want to extend hover messages provided by language-server you can add extra docs to `xrpl-hooks-docs/md/` folder. Just make sure the filename is matching with the error code that comes from language server. So lets say you want to add extra documentation for `hooks-func-addr-taken` check create new file called `hooks-func-addr-taken.md` and then remember to import and export it on `docs.ts` file with same logic as the other files.

## Global state management

Global state management is handled with library called Valtio (https://github.com/pmndrs/valtio). Initial state can be found from `./state/index.ts` file. All the actions which updates the state is found under `./state/actions/` folder.

## Special notes

Since we are dealing with greenfield tech and one of the dependencies (ripple-binary-codec) doesn't yet support signing `SetHook` transactions we had to monkey patch the library with patch-package (https://www.npmjs.com/package/patch-package). We modified the definitions.json file of the ripple-binary-codec library and then ran `yarn patch-package ripple-binary-codec` which created `patches/ripple-binary-codec+1.2.0.patch` file to this project. This file contains the modifications to `ripple-binary-codec` library. package.json contains postinstall hook which runs patch-package, and it will add the patch on the file mentioned earlier. This happens automatically after running patch package.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!


