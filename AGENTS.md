# Agent Guidelines

## Project Direction

- `render32_timer` is a Chrome-first Manifest V3 countdown timer.
- The product must not read, inject into, or modify web pages.
- Keep the code flexible for future Firefox and Safari targets, but do not claim
  those targets are supported without independent validation.
- Use TypeScript for application and test code. Keep Vite and ESLint
  configuration in JavaScript unless there is a concrete reason to migrate it.
- Use English for source-code comments and project documentation.

## Product Rules

- The timer has exactly one instance and uses the states `idle`, `running`,
  `paused`, and `completed`.
- The default duration is 45 minutes.
- Quick-access durations are 5, 10, 15, 30, 45, 60, and 90 minutes.
- Custom durations are entered inline as whole minutes from 1 to 1440.
- Selecting a quick-access duration starts the timer immediately.
- Confirming a custom duration stores it without starting; `Start` begins it.
- Editing a custom duration while paused replaces the paused duration and keeps
  the timer paused until `Start` is pressed.
- Pause preserves the exact remaining seconds.
- Refresh restarts the last selected duration immediately.
- Quick-access controls are disabled while running and enabled while paused.
- Canceling completion resets the selection to 45 minutes and stops the timer.
- Restarting completion offers the previous selection for inline editing before
  confirmation, along with the quick-access durations.
- Completion opens an independent extension alert and plays the alarm for at
  most 30 seconds.

Read `SPEC.md` before changing timer behavior. Update the specification when a
product decision changes.

## Architecture

- Preserve Ports and Adapters for all new features, including small changes.
- Keep `src/core/` free from browser APIs, DOM globals, Vite imports, and
  platform-specific concerns.
- Put timer calculations and state transitions in browser-independent core code.
- Define dependencies as narrow ports in `src/core/ports/`.
- Provide concrete Chrome implementations in `src/adapters/`.
- Keep dependency wiring in `src/composition/`.
- Use `webextension-polyfill` through the browser adapter instead of importing
  `chrome` or `browser` directly in core code.
- Keep manifests and browser-specific packaging differences in `src/manifests/`
  and build configuration.
- Prefer shared code and browser-specific adapters over platform checks spread
  through the application.

## Timer Lifecycle

- Do not rely on an in-memory interval for timer correctness.
- Store the selected duration and timer state in `chrome.storage.local` through
  a storage port.
- Store an absolute end timestamp while running.
- Store exact remaining duration while paused.
- Use Chrome alarms for background completion handling.
- Use the offscreen document and worker for frequent badge updates while the
  popup is closed.
- Reconcile persisted state when the background context starts or wakes.
- Treat a stored timer that has passed its end timestamp as completed.
- Keep the badge visible only in the running state.
- Show whole minutes with an `m` suffix above 60 seconds and seconds with an
  `s` suffix at 60 seconds or less.
- Keep the persisted timestamp and completion alarm authoritative if background
  execution is suspended.

## Permissions and Security

- Keep permissions minimal. The initial product needs `storage`, `alarms`, and
  `offscreen`.
- Do not add host permissions, content scripts, or URL match patterns without a
  concrete product requirement.
- The extension must not inspect or modify page content.
- Treat browser messages and storage values as untrusted external input.
- Prefer `unknown` and runtime narrowing over `any` or unchecked assertions.
- Keep type assertions at adapter boundaries only.
- Never include secrets in extension code or manifests.
- Review every permission or manifest change in the change description.

## Quality

- Add unit tests for new core behavior, especially state transitions, elapsed
  time, persistence, pause/resume, refresh, and completion.
- Keep strict TypeScript checks enabled and fix type errors instead of weakening
  compiler options.
- Make message unions exhaustive so new messages update all handlers.
- Check DOM queries for `null` before using elements.
- Add comments only when they explain lifecycle, compatibility, security, or
  architectural constraints.
- Update `README.md` and `SPEC.md` when architecture, commands, permissions,
  product behavior, or browser support changes.

## Commands

```bash
npm run dev
npm run test
npm run typecheck
npm run lint
npm run format:check
npm run check
npm run build:all
```

Run `npm run check` before considering a change complete or sharing it.

## Browser Validation

- Validate Chrome first using `dist/chrome/` and `chrome://extensions`.
- The initial release supports Chrome only.
- Validate Firefox using `dist/firefox/` and `about:debugging` before claiming
  Firefox support.
- Validate Safari using `dist/safari/`,
  `xcrun safari-web-extension-converter`, and Xcode before claiming Safari
  support.
- Do not claim Safari support based only on a successful Vite build. The
  generated extension must also run in the appropriate Xcode host application.
