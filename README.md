# Cross-Browser Extension Starter

A small Manifest V3 WebExtension template for Chrome, Firefox, and Safari. It uses TypeScript and Vite, with a Ports and Adapters architecture that keeps the application core independent from browser APIs.

This document is the main reference for the template. It explains what was created, what each part is for, how to use it, and where to find browser-specific API documentation.

## Requirements

- Node.js 20 or newer
- TypeScript strict mode is enabled for application and test code
- Google Chrome for primary local development
- Xcode for Safari packaging and testing

## Getting Started

```bash
npm install
npm run dev
```

`npm run dev` keeps `dist/chrome/` updated while you edit. In Chrome, open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select `dist/chrome/`.

Build all browser targets with:

```bash
npm run build:all
```

Run the complete validation suite before sharing or publishing changes:

```bash
npm run check
```

## Structure

```text
src/
  core/          Business rules and use cases without browser APIs
    application/ Application use cases
    ports/       Contracts required by the core
  adapters/      Implementations of ports for external APIs
  composition/  Composition roots that wire each runtime
  content/       Code that can run in web pages
  manifests/     Browser-specific Manifest V3 variants
  options/       Full settings page
  popup/         Toolbar popup interface
public/icons/    Static extension icons
test/            Browser-independent core tests
tsconfig.json    Strict TypeScript compiler configuration
vitest.config.js Browser-independent test runner configuration
```

## Architecture

The application follows Ports and Adapters, also known as Hexagonal Architecture:

```text
Browser events / UI
        |
        v
   adapters  --->  ports
                       ^
                       |
                 core / use cases
```

- `src/core/` contains pure business rules. It does not import `chrome`, `browser`, DOM globals, or Vite.
- `src/core/` is TypeScript-first and should expose narrow types at every application boundary.
- `src/core/ports/` defines the contracts required by the core, such as storage and messaging.
- `src/adapters/` translates WebExtension APIs into those contracts. `webextension-polyfill` normalizes API names and Promise behavior.
- `src/composition/` wires adapters to use cases. It is the composition root for executable browser code.
- `src/manifests/` changes only the browser-specific manifest details without duplicating application behavior.
- `test/` uses in-memory adapters to test the core without installing a browser.

Polymorphism is achieved by injecting port implementations. Production uses `createWebExtensionStorage`; tests use `createMemoryStorage`. The use case remains the same in both environments.

## File Responsibilities

- `package.json`: development, validation, testing, and browser build commands.
- `package-lock.json`: exact dependency versions for reproducible installs.
- `vite.config.js`: Vite and CRXJS configuration, including target-specific output directories.
- `eslint.config.js`: JavaScript and TypeScript lint rules, including type-aware rules.
- `tsconfig.json`: strict compiler configuration. `allowJs` is intentionally disabled for application code.
- `vitest.config.js`: Node-style test environment and TypeScript test discovery.
- `.prettierrc`: shared formatting rules.
- `src/manifests/base.ts`: common metadata, permissions, entries, scripts, and icons.
- `src/manifests/chrome.ts`: Chrome manifest, including the service worker background.
- `src/manifests/firefox.ts`: Firefox manifest, Gecko ID, and background script configuration.
- `src/manifests/safari.ts`: Safari WebExtension manifest variant.
- `src/core/application/status-service.ts`: browser-independent example use case.
- `src/core/ports/`: message names and storage contracts used by the core.
- `src/adapters/browser/`: the single normalized WebExtension API entry point.
- `src/adapters/storage/`: browser storage and in-memory test implementations.
- `src/adapters/messaging/`: runtime message implementation.
- `src/adapters/lifecycle/`: installation and lifecycle event implementation.
- `src/composition/background.ts`: background runtime composition and message handlers.
- `src/composition/extension-client.ts`: UI-side messaging composition.
- `src/popup/`: toolbar popup markup, styles, and UI event handling.
- `src/options/`: full settings page markup, styles, and UI event handling.
- `src/content/content.ts`: example content script that communicates through the runtime adapter.
- `public/icons/`: static icons referenced by the manifests.
- `test/`: unit tests for core behavior.
- `dist/`: generated output. Load the browser-specific subdirectory into the corresponding browser.

## Important Decisions

- The background runtime must not assume that it stays alive. Persistent state belongs in browser storage.
- Permissions are minimal (`storage`) and `host_permissions` starts empty. Add only permissions required by a feature.
- Content scripts communicate through messages instead of page globals, reducing collisions with visited pages.
- The base manifest is shared, while browser variants express only platform differences.
- Safari reuses the WebExtension build, but distribution requires an Xcode host application.
- Never include secrets in an extension. Distributed browser code can be inspected.
- Keep type assertions at external boundaries only. Prefer runtime validation when data comes from a browser API or message.
- Use `unknown` for untrusted values and narrow it before use; do not replace uncertainty with `any`.
- Make message unions exhaustive so adding a message forces all handlers to be updated.
- Keep DOM queries checked for `null` before registering listeners or reading values.
- Add comments when they explain a lifecycle, browser compatibility, security, or architectural constraint.

## Customization

1. Change `name`, `description`, and `version` in `src/manifests/base.ts`.
2. Replace the example `enabled` state in `src/core/` with the extension's domain behavior and types.
3. Define new messages in `src/core/ports/message-port.ts` and handle them in `src/composition/background.ts`.
4. Replace the SVG icons in `public/icons/`.
5. Replace `https://example.com/*` with specific patterns in `content_scripts.matches`, and add justified `host_permissions` only when necessary.
6. Add browser-specific behavior as an adapter or manifest variant instead of adding platform checks to the core.

## Builds and Distribution

- `npm run build:chrome`: creates `dist/chrome/`, loadable from `chrome://extensions`.
- `npm run build:firefox`: creates `dist/firefox/`, loadable from `about:debugging`.
- `npm run build:safari`: creates `dist/safari/`, used as input for Xcode conversion.
- `npm run build:all`: creates all three builds.
- `npm run test`: runs browser-independent core tests with Node.js.
- `npm run typecheck`: validates all application and test types without emitting files.
- `npm run check`: runs lint, formatting checks, tests, and all three builds.

For Safari on macOS:

```bash
xcrun safari-web-extension-converter dist/safari --app-name "Cross Browser Extension"
```

Open the generated project in Xcode to configure the Bundle Identifier, signing, permissions, and distribution. Safari on iOS and iPadOS also requires an application target for those platforms.

Firefox requires a stable identifier in `src/manifests/firefox.js` before publishing to AMO. Replace `extension@example.com` with the real extension ID.

## Browser API Documentation

Use the common WebExtensions documentation first. Consult browser-specific documentation only when an API or manifest behavior differs:

- [Chrome Extensions documentation](https://developer.chrome.com/docs/extensions/)
- [Chrome Extensions API reference](https://developer.chrome.com/docs/extensions/reference/api)
- [Chrome Manifest file format](https://developer.chrome.com/docs/extensions/reference/manifest)
- [Firefox WebExtensions documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Firefox WebExtensions API reference](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API)
- [Firefox manifest.json reference](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json)
- [Safari Web Extensions documentation](https://developer.apple.com/documentation/safariservices/safari_web_extensions)
- [Safari Web Extension Converter](https://developer.apple.com/documentation/safariservices/safari_web_extensions/converting_a_web_extension_for_safari)
- [Safari Extensions development overview](https://developer.apple.com/documentation/safariservices)
- [WebExtension Polyfill API](https://github.com/mozilla/webextension-polyfill)

## Validation Status

The template is validated with ESLint, Prettier, core unit tests, and production builds for Chrome, Firefox, and Safari through `npm run check`. Browser installation and Safari Xcode packaging still need to be exercised on the target machines before claiming release readiness.
