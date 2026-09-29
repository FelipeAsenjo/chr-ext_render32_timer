# render32_timer

Simple countdown timer for Chrome.

`render32_timer` is a focused Manifest V3 browser extension. It provides a
customizable countdown in the extension popup, keeps one timer running in the
background, and alerts the user when the countdown ends. It does not read or
modify web pages.

Repository: `git@github.com:FelipeAsenjo/chr-ext_render32_timer.git`

The product specification is in [`SPEC.md`](./SPEC.md). The first release
targets Chrome. The project structure keeps browser-specific concerns isolated
so Firefox and Safari can be evaluated later.

## Features

- Countdown display with minutes and seconds.
- Start, pause, and refresh controls.
- Quick-access durations of 5, 10, 15, 30, 45, 60, and 90 minutes.
- Inline custom duration entry from 1 to 1440 minutes.
- Last selected duration remembered between sessions.
- Default duration of 45 minutes.
- Timer continues when the popup is closed or Chrome restarts.
- Independent completion alert with a 30-second alarm sound.
- Restart and cancel actions after completion.
- Badge showing remaining minutes, or seconds when 60 seconds or less remain.

## Requirements

- Node.js 20 or newer.
- npm.
- Google Chrome for local development and browser validation.

Safari packaging requires Xcode and is not part of the initial release. Firefox
and Safari manifests remain future compatibility targets.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the Chrome development build:

```bash
npm run dev
```

The command keeps `dist/chrome/` updated while files change. To load the
extension in Chrome:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose `dist/chrome/`.

Build the Chrome extension once with:

```bash
npm run build:chrome
```

## Commands

| Command                 | Purpose                                               |
| ----------------------- | ----------------------------------------------------- |
| `npm run dev`           | Watch and build the Chrome extension.                 |
| `npm run build:chrome`  | Create `dist/chrome/`.                                |
| `npm run build:firefox` | Create the future Firefox build.                      |
| `npm run build:safari`  | Create the future Safari WebExtension build.          |
| `npm run build:all`     | Build all configured browser targets.                 |
| `npm run test`          | Run browser-independent unit tests.                   |
| `npm run typecheck`     | Run strict TypeScript checks.                         |
| `npm run lint`          | Run ESLint.                                           |
| `npm run format:check`  | Check Prettier formatting.                            |
| `npm run check`         | Run lint, formatting, type checks, tests, and builds. |

Run the complete validation suite before sharing changes:

```bash
npm run check
```

## Architecture

The project follows Ports and Adapters, also known as Hexagonal Architecture:

```text
Chrome APIs / UI
       |
       v
   adapters  --->  ports
                       ^
                       |
                 core / use cases
```

- `src/core/` contains browser-independent timer rules and use cases.
- `src/core/ports/` defines contracts for storage, alarms, badges, and alert
  handling.
- `src/adapters/` implements browser APIs behind those contracts.
- `src/composition/` wires the Chrome runtime and UI clients.
- `src/popup/` contains the main timer interface.
- `src/alert/` contains the independent completion alert interface.
- `src/manifests/` contains browser-specific manifest variants.
- `test/` contains unit tests that do not require a browser.
- `public/icons/` contains extension assets.
- `dist/` contains generated builds and must not be edited manually.

The core must not import `chrome`, `browser`, DOM globals, Vite modules, or
platform-specific code. Browser APIs are accessed through adapters using
`webextension-polyfill` where appropriate.

## Timer Behavior

The timer has four states: `idle`, `running`, `paused`, and `completed`.

- Selecting a quick duration starts it immediately.
- Editing the main countdown stores a custom duration without starting it.
- Pressing `Start` after a custom selection starts that duration.
- Starting uses the current selected duration.
- Pausing preserves the exact remaining seconds.
- Refresh resets and immediately starts the last selected duration.
- Quick-access controls are disabled while running and enabled while paused.
- Only one timer can exist at a time.
- Canceling completion resets the selection to 45 minutes and stops the timer.
- Restarting offers the previous selection before confirmation and allows a
  quick duration to be chosen.

The background runtime stores an absolute end timestamp and uses the Chrome
Alarms API to resolve completion while the popup is closed. This avoids relying
on an in-memory interval that would be lost when Chrome suspends the extension.

## Badge Behavior

The badge is visible only while the timer is running:

- More than 60 seconds remaining: whole minutes, such as `44`.
- 60 seconds or less remaining: seconds with an `s` suffix, such as `15s`.
- Idle, paused, and completed states: no badge.

The timer itself remains exact because it uses persisted timestamps. Badge
refreshes while the popup is closed are best effort because Chrome does not
guarantee a one-second service-worker wake-up cadence. The popup always
calculates and displays the exact remaining time when opened.

## Permissions and Privacy

The extension is designed to use only the permissions needed for its timer:

- `storage` for the selected duration and timer state.
- `alarms` for background completion handling.

It does not need host permissions or content scripts. It does not inspect,
collect, or modify page content. No secrets should be included in the
extension because distributed browser code can be inspected.

The completion alert is an extension-owned page opened as an independent
window. Its alarm uses Web Audio and does not require the `notifications`
permission. A future system-notification fallback would require an explicit
permission and product decision.

## Project Structure

```text
src/
  core/          Browser-independent rules and use cases
    application/ Application services
    ports/       Dependency contracts
  adapters/      Chrome and external API implementations
  composition/  Runtime dependency wiring
  manifests/    Browser-specific manifest variants
  popup/        Main timer popup
  alert/        Completion alert window
public/icons/    Extension icons
test/            Browser-independent unit tests
SPEC.md          Product and technical specification
```

## Development Guidelines

- Use TypeScript for application and test code.
- Keep strict TypeScript checks enabled.
- Add unit tests for timer state transitions and persistence behavior.
- Keep permissions minimal and review every manifest change.
- Use `unknown` for untrusted external values and narrow before use.
- Keep browser-specific behavior in adapters or manifest variants.
- Do not add page host matches or content scripts without a product requirement.
- Keep comments focused on lifecycle, compatibility, security, or architectural
  constraints.

## Future Browser Support

Firefox and Safari are future targets, not release claims for the initial
Chrome version. The build configuration already has browser-specific entry
points, but each target must be tested independently before being described as
supported.

Safari distribution requires an Xcode host application. A successful
WebExtension build alone is not sufficient to claim Safari support.
