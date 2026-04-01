# Rekono Desktop Surfaces

This folder contains dedicated desktop surfaces for:

- `business-app/` — Business OS desktop workspace
- `ca-app/` — CA OS desktop workspace

Each app is an Electron shell with a dedicated desktop layout and can be evolved to host richer bulk workflows, document-heavy tasks, and reporting experiences.

## Available Scripts

From the repository root:

- `npm run desktop:business:install`
- `npm run desktop:business:start`
- `npm run desktop:ca:install`
- `npm run desktop:ca:start`

## Run (per app)

1. `cd desktop/business-app` or `cd desktop/ca-app`
2. `npm install`
3. `npm start`

## Notes

- The desktop shells are intentionally lightweight entry surfaces.
- They are ready for wiring to the API and renderer bundles when the next desktop iteration starts.
