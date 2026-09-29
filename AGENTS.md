# Agent Guidelines

## Project Direction

- Use TypeScript for application and test code. Keep Vite and ESLint configuration in JavaScript unless there is a concrete reason to migrate them.
- Keep the application compatible with Chrome, Firefox, and Safari whenever the browser APIs allow it.
- Treat Chrome as the primary browser for local testing and debugging.
- Support Safari on macOS, iOS, and iPadOS as an objective. Remember that Safari distribution requires an Xcode host application and platform-specific targets.

## Architecture

- Preserve the Ports and Adapters architecture for all new features, including small features.
- Keep `src/core/` free from browser APIs, DOM globals, Vite imports, and platform-specific concerns.
- Define dependencies as ports and provide concrete implementations in `src/adapters/`.
- Keep dependency wiring in `src/composition/`.
- Use `webextension-polyfill` through the browser adapter instead of importing `chrome` or `browser` directly in core code.
- Keep manifests and browser-specific packaging differences isolated in `src/manifests/` and build configuration.
- Prefer shared code and browser-specific adapters over conditional browser checks spread through the application.

## Quality

- Unit tests for new core behavior are strongly recommended.
- Run `npm run check` before considering a change complete. This is required before sharing or publishing changes.
- Keep browser permissions minimal. Changes to permissions or URL match patterns are strongly recommended to include an explicit review in the change description.
- Add or update documentation when architecture, commands, permissions, manifests, or browser support changes.
- Use English for source-code comments and project documentation.
- Prefer explicit types, discriminated unions, and narrow interfaces over `any` or broad type assertions.
- Keep `strict` TypeScript checks enabled and fix type errors instead of weakening compiler options.

## Commands

```bash
npm run dev
npm run test
npm run typecheck
npm run check
npm run build:all
```

## Browser Validation

- Validate Chrome first using `dist/chrome/` and `chrome://extensions`.
- Validate Firefox using `dist/firefox/` and `about:debugging`.
- Validate Safari using `dist/safari/`, `xcrun safari-web-extension-converter`, and Xcode.
- Do not claim Safari support based only on a successful Vite build; the generated extension must also be tested inside the appropriate Xcode host application.
