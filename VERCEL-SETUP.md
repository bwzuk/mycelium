# Deploy Mycelium on Vercel

The app needs no server, API key, dependency download or bundler. Vercel runs `npm run build` to check the PWA and its core behaviour, then publishes `dist/` over HTTPS. Weather and sightings requests run in the visitor's browser.

## Automatic cloud deployments

1. Put this project in a GitHub, GitLab or Bitbucket repository.
2. In Vercel, choose **Add New → Project** and import that repository.
3. Set the root directory to the folder containing `vercel.json` (the root if the repository contains this folder's contents).
4. Use **Other** as the framework. The included configuration sets the build command and output directory; no environment variables are needed.
5. Deploy. Later pushes to the production branch trigger deployments automatically; other branches can produce preview deployments.

Protect a private repository and choose the project's deployment protection to match your intended audience. The original Sites manifest is not used by Vercel.

## Deploy from a local checkout

If you prefer the Vercel CLI, run these commands from this project's folder:

```sh
npm run build
npx vercel
```

Authenticate with Vercel's browser flow and select your account/project. That first command creates a preview deployment. After checking it, publish with:

```sh
npx vercel --prod
```

Do not paste access tokens into chat or commit them into the repository.

## PWA checks on the deployed URL

- Open the HTTPS URL and load a report. Check weather, local species and reference photos.
- Open a species detail and verify its source links.
- Install the app using the browser's home-screen/install option.
- After a successful visit, check the saved report offline.
- If changing between deployments, reload online to let the service worker update.

The cloud build checks files and fixture-based logic, not live third-party API availability or the biological accuracy of the guide. Expanded ecology notes still need source validation.
