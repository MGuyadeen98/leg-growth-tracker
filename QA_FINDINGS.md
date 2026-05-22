# QA Findings

Playwright setup was added and run against desktop Chromium and an iPhone 13 viewport.

## Latest Run Summary

- `npm run lint`: passed
- `npm run build`: passed
- `npm run test:e2e`: 18 passed, 0 failed
- Browser projects: `desktop-chromium`, `iphone-13`
- E2E now runs against production preview by default.

## Resolved Findings

### Resolved P1 - Progress tab lazy-chart loading error

- User flow affected: Complete Workout -> Progress tab
- What happened: Opening Progress after completing a session triggered a console error: `Failed to load resource: the server responded with a status of 504 (Outdated Optimize Dep)`.
- Expected behavior: Progress should open without console errors and load the lazy chart module reliably.
- Resolution: E2E now runs against production preview by default, and the lazy chart is wrapped in a lightweight fallback boundary: `Chart could not load. Try refreshing.`

### Resolved P1 - Recovery-day onboarding Start CTA

- User flow affected: First launch onboarding on Tuesday/Thursday/Sunday recovery state
- What happened: On a recovery day, tapping the final tour card `Start Workout` created an active session banner, but the main screen remained in the Recovery Day state instead of opening the workout controls for the next session.
- Expected behavior: Starting from onboarding should either open the next programmed workout day and show active controls, or the final tour step should not offer a workout-start CTA on recovery days.
- Resolution: Recovery-day tours now end with `Open Next Session`, switch to the next programmed workout, and do not start an active session.

### Resolved P2 - Fresh completion summary

- User flow affected: Complete Workout
- What happened: After completing an incomplete workout, the screen changed to `Today's session is already completed.` with a compact summary and `View Summary`.
- Expected behavior: Since completion is the user's end-of-session moment, the full completed summary may be more satisfying and useful immediately after tapping Complete.
- Resolution: Fresh completions show the full completed-session summary immediately. Later revisits can still show the compact completed-state teaser.

### Resolved P2 - Start Workout pulse click stability

- User flow affected: Start Workout
- What happened: An early exploratory run showed Playwright waiting for the pulsing `Start Workout` button to become stable. The e2e helper now has a force-click fallback so deeper tests can continue.
- Expected behavior: The pulse should remain visually tasteful without making the button's target unstable for automated/user-agent interaction.
- Resolution: The pulse no longer animates transform/layout. Playwright clicks the real Start button without a force-click fallback.

## Visual / UX Notes

- Onboarding cards were fully visible in both desktop and iPhone viewport checks.
- No obvious horizontal overflow was detected in the mobile viewport test.
- Settings, backup/import/export, reset flow, training max editing, rest timer overlay, and tour replay were reachable.
- Rest timer completion overlay opened once and dismissed correctly in both projects.

## Remaining QA Findings

- No open findings from this pass.
