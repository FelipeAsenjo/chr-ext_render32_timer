# render32_timer Specification

## 1. Product

`render32_timer` is a simple countdown timer for Chrome. Its purpose is to
provide a focused timer in the extension popup without modifying web pages.

The initial release targets Chrome and Manifest V3. The project keeps its
browser boundaries flexible so Firefox and Safari can be considered later.

## 2. User Flow

The user opens the extension popup and sees the remaining countdown, the
current selection, and timer controls.

The popup provides:

- A countdown showing minutes and seconds.
- A `Start` or `Pause` control depending on the current state.
- A `Refresh` control.
- Quick-access durations of 5, 10, 15, 30, 45, 60, and 90 minutes.
- An inline custom-duration editor on the main countdown, accepting 1 to 1440
  whole minutes.

Selecting a quick-access duration starts the timer immediately. Editing and
confirming a custom duration only stores the selection; the timer starts when
the user presses `Start`. The selected duration is remembered and becomes the
duration used by `Refresh`. If no duration has previously been selected, the
default is 45 minutes.

## 3. Timer States

The timer has four states:

- `idle`: no countdown is running and no badge is shown.
- `running`: the countdown is active and the badge displays the remaining time.
- `paused`: the countdown is stopped with its exact remaining time preserved;
  quick-access controls are enabled.
- `completed`: the countdown reached zero and the completion alert is open.

Only one timer may exist at a time.

### Start

Starting a timer uses the current selected duration and immediately enters the
`running` state.

### Pause

Pausing stores the exact remaining duration, including seconds, and enters the
`paused` state. The timer does not continue while paused.

### Refresh

Refreshing resets the timer to the last selected duration and starts it
immediately. It does not use the previously remaining duration.

### Quick Access

Selecting a quick-access duration stores that duration and starts the timer
immediately. Quick-access controls are disabled while the timer is running and
enabled while it is paused or idle.

### Custom Duration

While `idle` or `paused`, clicking the main countdown changes it into a numeric
input for whole minutes from 1 to 1440. Pressing `Enter` or clicking outside the
input confirms and stores the value without starting the timer. Pressing
`Escape` cancels the edit and restores the previous selection.

When editing from `paused`, the new duration replaces the paused duration and
the timer remains paused. Pressing `Start` begins the new duration from zero.
The countdown is not editable while the timer is running or completed.

### Completion

When the countdown reaches zero:

1. The timer enters `completed`.
2. The badge is removed.
3. An independent extension alert window opens.
4. An alarm sound plays for 30 seconds and then becomes muted.
5. The alert remains open until the user chooses `Cancel` or `Restart`.

`Cancel` closes the alert, resets the selected duration to the default 45
minutes, and returns to `idle`.

`Restart` presents the last selected duration before confirmation. The user can
edit it inline or choose another quick-access duration. Confirming a duration
starts a new timer immediately.

## 4. Persistence and Lifecycle

The timer must continue counting when the popup is closed and after Chrome is
restarted.

The application stores:

- The last selected duration.
- The timer state.
- The absolute end timestamp while running.
- The exact remaining duration while paused.

The running timer is based on an absolute end timestamp rather than an in-memory
interval. This allows the background context to reconstruct the remaining time
after being suspended or restarted.

The background runtime uses `chrome.alarms` to wake at completion. On startup,
it must compare the stored timestamp with the current time and resolve an
already-completed timer instead of trusting stale in-memory state. An offscreen
document with a dedicated worker provides badge update ticks while the popup is
closed.

## 5. Badge

The badge is shown only while the timer is `running`.

- More than 60 seconds remaining: show whole minutes with an `m` suffix, for
  example `15m`.
- 60 seconds or less remaining: show seconds with an `s` suffix, for example
  `15s`.
- `idle`, `paused`, and `completed`: remove the badge.

When the popup is open, it should display the exact remaining time. When the
popup is closed, the offscreen worker sends one-second update ticks. The
persisted timestamp and completion alarm remain authoritative if Chrome or the
operating system suspends background execution.

## 6. Permissions

The initial implementation should request only:

- `storage`: persist the selected duration and timer state.
- `alarms`: schedule background completion handling.
- `offscreen`: maintain a hidden worker for frequent badge updates while the
  popup is closed.

The extension does not require host permissions or content scripts because it
does not modify web pages.

The completion alert uses an extension-owned page opened as an independent
window. Its alarm uses Web Audio and does not require page access or the
`notifications` permission. A future version may add a system notification
fallback separately.

## 7. Architecture

The project follows Ports and Adapters:

- `src/core/` contains timer rules, state transitions, and use cases without
  browser APIs.
- `src/core/ports/` defines storage, alarm, badge, and alert contracts.
- `src/adapters/` implements Chrome APIs behind those contracts.
- `src/composition/` wires the Chrome runtime and UI clients.
- `src/popup/` renders the main timer interface.
- `src/alert/` renders the independent completion alert.
- `src/offscreen/` contains the hidden document and worker used for badge ticks.
- `src/manifests/` contains the Chrome manifest and future browser variants.

Timer calculations should use integer milliseconds or seconds consistently and
must be covered by browser-independent unit tests.

## 8. Acceptance Criteria

- A first-use timer starts at 45 minutes when selected through the default
  control.
- Quick-access selections start immediately.
- A custom duration between 1 and 1440 minutes can be entered inline, confirmed,
  and started with the `Start` control.
- Pause and resume preserve the exact remaining seconds.
- Refresh immediately restarts the last selected duration.
- Closing and reopening the popup shows the current remaining time.
- Chrome restart does not reset a running timer.
- A running timer shows minutes as `Xm` and seconds as `Xs` in the badge.
- A closed popup receives minute and second badge updates from the offscreen
  worker while the timer is running.
- A paused or completed timer has no badge.
- Completion opens an independent alert and sounds for no more than 30 seconds.
- Cancel returns to an idle 45-minute default.
- Restart allows inline editing of the previous duration or selection of a
  quick duration.
- No page content is read or modified.
- Core timer behavior can be tested without a browser.

The popup and alert pages communicate with the background runtime through
validated messages. The alert page stops its Web Audio alarm after 30 seconds
even when the user does not interact with the window.

## 9. Future Scope

- Firefox and Safari builds.
- Optional system notifications.
- Additional timer presets or user-configurable presets.
