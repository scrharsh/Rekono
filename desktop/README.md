# Rekono Desktop Surfaces

This folder contains dedicated desktop surfaces for:

- `business-app/` — Business OS desktop workspace
- `ca-app/` — CA OS desktop workspace

Each app is an Electron shell with a dedicated desktop layout and can be evolved to host richer bulk workflows, document-heavy tasks, and reporting experiences.

## Available Scripts

From the repository root:

- `npm run desktop:business:install`
- `npm run desktop:business:start`
- `npm run desktop:business:dist`
- `npm run desktop:business:dist:signed`
- `npm run desktop:ca:install`
- `npm run desktop:ca:start`
- `npm run desktop:ca:dist`
- `npm run desktop:ca:dist:signed`
- `npm run desktop:install` (installs dependencies for both desktop apps)
- `npm run desktop:dist` (builds Windows installers for both desktop apps)
- `npm run desktop:dist:signed` (builds signed installers when cert env vars are provided)

## Run (per app)

1. `cd desktop/business-app` or `cd desktop/ca-app`
2. `npm install`
3. `npm start`

## Build Windows Installers

From repo root:

1. `npm run desktop:install`
2. `npm run desktop:dist`

Installer outputs:

- `desktop/business-app/dist/Rekono-Business-Desktop-1.0.0-Setup.exe`
- `desktop/ca-app/dist/Rekono-CA-Desktop-1.0.0-Setup.exe`

Each installer uses NSIS and supports standard install flow with desktop and start-menu shortcuts.

## Icon Resources

- Business icon: `desktop/business-app/build/icon.ico`
- CA icon: `desktop/ca-app/build/icon.ico`

Electron Builder is configured to use these icons for executable and installer branding.

## Code Signing Placeholders (Windows)

Signed builds are enabled through Electron Builder's standard environment variables:

1. Set `CSC_LINK` to your code signing certificate path or base64 payload.
2. Set `CSC_KEY_PASSWORD` to your certificate password.
3. Run `npm run desktop:dist:signed`.

If certificate variables are not set, use unsigned builds with `npm run desktop:dist`.

## Notes

- The desktop shells are intentionally lightweight entry surfaces.
- They are ready for wiring to the API and renderer bundles when the next desktop iteration starts.
