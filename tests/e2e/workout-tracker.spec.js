import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const watchConsole = (page) => {
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => {
    errors.push(error.message)
  })
  return errors
}

const resetApp = async (page) => {
  await page.goto('/')
  await page.evaluate(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })
  await page.reload()
}

const mockDateAndReset = async (page, isoDate) => {
  await page.addInitScript((iso) => {
    const fixedTime = new Date(iso).getTime()
    const RealDate = Date
    class MockDate extends RealDate {
      constructor(...args) {
        super(...(args.length ? args : [fixedTime]))
      }

      static now() {
        return fixedTime
      }
    }
    MockDate.UTC = RealDate.UTC
    MockDate.parse = RealDate.parse
    window.Date = MockDate
  }, isoDate)
  await resetApp(page)
}

const skipTourIfPresent = async (page) => {
  const skip = page.getByRole('button', { name: 'Skip for now' })
  if (await skip.isVisible().catch(() => false)) await skip.click()
}

const openMondayWorkout = async (page) => {
  await skipTourIfPresent(page)
  const monday = page.getByRole('button', { name: 'Mon' })
  if (await monday.isVisible().catch(() => false)) await monday.click()
  await expect(page.getByRole('heading', { name: /Monday:/ })).toBeVisible()
}

const openSettings = async (page) => {
  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByRole('heading', { name: 'Utilities' })).toBeVisible()
}

const clickTourNext = async (page) => {
  await page.locator('.tour-anchor-card').getByRole('button', { name: 'Next', exact: true }).click()
}

const startWorkout = async (page) => {
  const start = page.getByRole('button', { name: 'Start Workout', exact: true }).first()
  await start.click()
}

const completeSpotlightTour = async (page) => {
  await page.getByRole('button', { name: 'Start Tour' }).click()
  for (let index = 0; index < 5; index += 1) {
    await clickTourNext(page)
  }
  await page.locator('.tour-anchor-card').getByRole('button', { name: 'Exit tour' }).click()
  await expect(page.locator('.tour-anchor-card')).toHaveCount(0)
}

const exerciseCard = (page, exerciseName) => page.locator('article.exercise-card').filter({
  has: page.getByRole('heading', { name: new RegExp(exerciseName) }),
})

const logStrengthSet = async (page, exerciseName, { load, reps, rir, feel = 'good', note = 'felt clean' }) => {
  const card = exerciseCard(page, exerciseName)
  await page.getByLabel(`${exerciseName} set 1 load`).fill(load)
  await page.getByRole('spinbutton', { name: `${exerciseName} set 1 reps`, exact: true }).fill(reps)
  await page.getByLabel(`${exerciseName} set 1 reps in reserve`).fill(rir)
  await card.locator('label.field:has-text("Overall feel") select').selectOption(feel)
  await card.getByPlaceholder(/right side tilted/).fill(note)
  await card.getByRole('button', { name: /Log Exercise/ }).click()
}

const editBoxSquatMax = async (page, value) => {
  await page.locator('.max-tile').filter({ hasText: 'Box squat' }).click()
  const microHint = page.locator('.micro-spotlight-card')
  if (await microHint.isVisible().catch(() => false)) {
    await microHint.getByRole('button', { name: 'Got it' }).click()
    await page.locator('.max-tile').filter({ hasText: 'Box squat' }).click()
  }
  await expect(page.getByRole('heading', { name: /Box squat Max/ })).toBeVisible()
  await page.getByLabel(/Box squat Max value/).fill(String(value))
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.locator('.max-tile').filter({ hasText: 'Box squat' })).toContainText(String(value))
}

const completeMondayBoxSquatWorkout = async (page) => {
  await startWorkout(page)
  await logStrengthSet(page, 'High-Bar Box Squat', { load: '225', reps: '8', rir: '2', note: 'clean squat sets' })
  await page.getByRole('button', { name: 'Finish Session' }).click()
  await page.getByRole('button', { name: 'Finish Anyway' }).click()
  await expect(page.getByRole('heading', { name: 'Completed Session Summary' })).toBeVisible()
}

const runResetFlow = async (page, mode, { skipFreshTour = true } = {}) => {
  await openSettings(page)
  await page.getByRole('button', { name: 'Reset' }).click()
  if (mode === 'everything') {
    await page.getByRole('button', { name: 'Reset Everything' }).click()
    await expect(page.getByText('Reset everything?')).toBeVisible()
  } else {
    await page.getByRole('button', { name: 'Reset History Only' }).click()
    await expect(page.getByText('Reset workout history only?')).toBeVisible()
  }
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Confirm Reset' }).click()
  if (mode === 'everything') {
    await expect(page.getByRole('heading', { name: 'First time here?' })).toBeVisible()
    if (skipFreshTour) await page.getByRole('button', { name: 'Skip for now' }).click()
  } else {
    await expect(page.getByRole('heading', { name: 'First time here?' })).toHaveCount(0)
  }
}

const waitForStoredState = async (page, predicate) => {
  await page.waitForFunction((predicateText) => {
    const raw = window.localStorage.getItem('leg-growth-tracker:v2')
    if (!raw) return false
    const state = JSON.parse(raw)
    return Function('state', `return (${predicateText})(state)`).call(null, state)
  }, predicate.toString())
}

const assertNoHorizontalOverflow = async (page) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
  expect(overflow).toBe(false)
}

const assertTourCardFullyVisible = async (page) => {
  const card = page.locator('.tour-anchor-card')
  await expect(card).toBeVisible()
  const box = await card.boundingBox()
  const viewport = page.viewportSize()
  expect(box).toBeTruthy()
  expect(viewport).toBeTruthy()
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1)
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1)
}

const swipeLocator = async (locator, { dx, dy = 0, startXRatio = 0.5, startYRatio = 0.28 }) => {
  const box = await locator.boundingBox()
  expect(box).toBeTruthy()
  const startX = box.x + box.width * startXRatio
  const startY = box.y + box.height * startYRatio
  const pointer = { pointerId: 5, pointerType: 'touch', button: 0, buttons: 1, bubbles: true, cancelable: true }
  await locator.dispatchEvent('pointerdown', { ...pointer, clientX: startX, clientY: startY })
  await locator.dispatchEvent('pointermove', { ...pointer, clientX: startX + dx * 0.45, clientY: startY + dy * 0.45 })
  await locator.dispatchEvent('pointermove', { ...pointer, clientX: startX + dx, clientY: startY + dy })
  await locator.dispatchEvent('pointerup', { ...pointer, buttons: 0, clientX: startX + dx, clientY: startY + dy })
}

const expectFocusNavCentered = async (page) => {
  const offset = await page.locator('.focus-nav').evaluate((nav) => {
    const toolbar = nav.closest('.focus-card-toolbar')
    const navRect = nav.getBoundingClientRect()
    const toolbarRect = toolbar.getBoundingClientRect()
    return Math.abs((navRect.left + navRect.width / 2) - (toolbarRect.left + toolbarRect.width / 2))
  })
  expect(offset).toBeLessThanOrEqual(4)
}

test.describe('Performance Tracker critical flows', () => {
  test.beforeEach(async ({ page }) => {
    page.consoleErrors = watchConsole(page)
    await resetApp(page)
  })

  test.afterEach(async ({ page }, testInfo) => {
    if (page.consoleErrors.length) {
      await testInfo.attach('console-errors', {
        body: page.consoleErrors.join('\n'),
        contentType: 'text/plain',
      })
    }
    expect(page.consoleErrors).toEqual([])
  })

  test('recovery-day onboarding opens next session without starting workout', async ({ page }) => {
    await mockDateAndReset(page, '2026-05-19T12:00:00-05:00')
    await expect(page.getByRole('heading', { name: 'First time here?' })).toBeVisible()
    await page.getByRole('button', { name: 'Start Tour' }).click()

    await expect(page.getByRole('heading', { name: 'Nothing forced today.' })).toBeVisible()
    await assertTourCardFullyVisible(page)
    await expect(page.locator('.tour-anchor-card').getByRole('button', { name: 'Open Next Session' })).toHaveCount(0)

    await page.getByRole('button', { name: 'Open Next Session' }).click()
    await expect(page.getByRole('region', { name: 'Active session' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: /Wednesday:/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start Workout', exact: true })).toBeVisible()
  })

  test('workout-day onboarding uses the real Start Workout button', async ({ page }) => {
    await mockDateAndReset(page, '2026-05-18T12:00:00-05:00')
    await expect(page.getByRole('heading', { name: 'First time here?' })).toBeVisible()
    await page.getByRole('button', { name: 'Start Tour' }).click()
    await expect(page.getByRole('heading', { name: 'Start with pace.' })).toBeVisible()
    await assertTourCardFullyVisible(page)
    await expect(page.locator('.tour-anchor-card').getByRole('button', { name: 'Start Workout' })).toHaveCount(0)

    for (const heading of ['Start with pace.', 'Meet the day.', 'Set your baseline.', 'Save the work.', 'Close the loop.', 'Let’s get to work.']) {
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
      if (heading !== 'Let’s get to work.') await clickTourNext(page)
    }

    await page.getByRole('button', { name: 'Start Workout', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Let’s get to work.' })).toHaveCount(0)
  })

  test('workout-day onboarding progresses through timer, readiness, maxes, logging, finish, and start spotlights', async ({ page }) => {
    await mockDateAndReset(page, '2026-05-18T12:00:00-05:00')
    await page.getByRole('button', { name: 'Start Tour' }).click()

    for (const heading of ['Start with pace.', 'Meet the day.', 'Set your baseline.', 'Save the work.', 'Close the loop.', 'Let’s get to work.']) {
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
      await assertTourCardFullyVisible(page)
      await expect(page.locator('.tour-highlight')).toBeVisible()
      if (heading !== 'Let’s get to work.') await clickTourNext(page)
    }
  })

  test('skip tour persists and replay app tour works from Settings', async ({ page }) => {
    await page.getByRole('button', { name: 'Skip for now' }).click()
    await page.reload()
    await expect(page.getByRole('heading', { name: 'First time here?' })).toHaveCount(0)

    await openSettings(page)
    await page.getByRole('button', { name: 'Replay' }).click()
    await expect(page.getByRole('heading', { name: 'Start with pace.' })).toBeVisible()
    await assertTourCardFullyVisible(page)
  })

  test('workout start, focus navigation, log exercise, and auto-advance', async ({ page }) => {
    await openMondayWorkout(page)
    await expect(page.getByText('Current exercise')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: /1\. High-Bar Box Squat/ })).toHaveCount(1)

    await startWorkout(page)
    await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Focus' }).click()
    await expect(page.getByRole('heading', { name: /1\. High-Bar Box Squat/ })).toBeVisible()

    await page.getByLabel('High-Bar Box Squat set 1 load').fill('225')
    await page.getByRole('spinbutton', { name: 'High-Bar Box Squat set 1 reps', exact: true }).fill('8')
    await page.getByLabel('High-Bar Box Squat set 1 reps in reserve').fill('2')
    await page.locator('label.field:has-text("Overall feel") select').first().selectOption('good')
    await page.getByPlaceholder(/right side tilted/).fill('felt clean')
    await page.getByRole('button', { name: /Log Exercise/ }).click()

    await expect(page.getByRole('heading', { name: /2\. Heel-Elevated Bulgarian Split Squat/ })).toBeVisible()
    await expect(page.getByText("Today's Logged Work")).toBeVisible()
    await expect(page.getByText('High-Bar Box Squat').last()).toBeVisible()
  })

  test('focus mode header and swipe navigation stay guarded', async ({ page }) => {
    await openMondayWorkout(page)
    await startWorkout(page)

    const firstCard = exerciseCard(page, 'High-Bar Box Squat')
    await swipeLocator(firstCard, { dx: -170 })
    await expect(page.getByRole('heading', { name: /1\. High-Bar Box Squat/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: /2\. Heel-Elevated Bulgarian Split Squat/ })).toBeVisible()

    await page.getByRole('button', { name: 'Focus' }).click()
    await expect(page.getByRole('heading', { name: /1\. High-Bar Box Squat/ })).toBeVisible()
    await expect(page.getByText('Focus Mode', { exact: true })).toBeVisible()
    await expect(page.getByText('Focus Mode On')).toHaveCount(0)
    await expect(page.getByText('Focus Mode Off')).toHaveCount(0)
    await expect(page.locator('.focus-nav em')).toHaveText('1/6')
    await expectFocusNavCentered(page)

    const focusedCard = () => page.locator('article.focused-exercise-card')

    await swipeLocator(focusedCard(), { dx: 170 })
    await expect(page.getByRole('heading', { name: /1\. High-Bar Box Squat/ })).toBeVisible()
    await expect(page.locator('.focus-nav em')).toHaveText('1/6')
    await expectFocusNavCentered(page)

    await swipeLocator(focusedCard(), { dx: -170 })
    await expect(page.getByRole('heading', { name: /2\. Heel-Elevated Bulgarian Split Squat/ })).toBeVisible()
    await expect(page.locator('.focus-nav em')).toHaveText('2/6')
    await expectFocusNavCentered(page)

    await swipeLocator(focusedCard(), { dx: 170 })
    await expect(page.getByRole('heading', { name: /1\. High-Bar Box Squat/ })).toBeVisible()

    await focusedCard().getByRole('button', { name: 'Next exercise' }).click()
    await expect(page.getByRole('heading', { name: /2\. Heel-Elevated Bulgarian Split Squat/ })).toBeVisible()
    await focusedCard().getByRole('button', { name: 'Previous exercise' }).click()
    await expect(page.getByRole('heading', { name: /1\. High-Bar Box Squat/ })).toBeVisible()

    await swipeLocator(page.getByLabel('High-Bar Box Squat set 1 load'), { dx: -170 })
    await expect(page.getByRole('heading', { name: /1\. High-Bar Box Squat/ })).toBeVisible()

    await swipeLocator(focusedCard().getByRole('button', { name: /Log Exercise/ }), { dx: -170 })
    await expect(page.getByRole('heading', { name: /1\. High-Bar Box Squat/ })).toBeVisible()

    await swipeLocator(focusedCard(), { dx: -55 })
    await expect(page.getByRole('heading', { name: /1\. High-Bar Box Squat/ })).toBeVisible()

    await swipeLocator(focusedCard(), { dx: -140, dy: 150 })
    await expect(page.getByRole('heading', { name: /1\. High-Bar Box Squat/ })).toBeVisible()

    for (let index = 0; index < 5; index += 1) {
      await swipeLocator(focusedCard(), { dx: -170 })
    }
    await expect(page.getByRole('heading', { name: /6\. Leg Extension/ })).toBeVisible()
    await expect(page.locator('.focus-nav em')).toHaveText('6/6')

    await swipeLocator(focusedCard(), { dx: -170 })
    await expect(page.getByRole('heading', { name: /6\. Leg Extension/ })).toBeVisible()

    await focusedCard().getByRole('button', { name: 'Exit' }).click()
    await expect(page.locator('article.exercise-card')).toHaveCount(6)
  })

  test('first-session micro-spotlights replace each other through logging flow', async ({ page }) => {
    await mockDateAndReset(page, '2026-05-18T12:00:00-05:00')
    await completeSpotlightTour(page)
    await startWorkout(page)

    const repsInput = page.getByRole('spinbutton', { name: 'High-Bar Box Squat set 1 reps', exact: true })
    const rirInput = page.getByLabel('High-Bar Box Squat set 1 reps in reserve')

    await repsInput.click()
    await expect(page.locator('.micro-spotlight-card')).toContainText('Actual reps help shape progression.')
    await expect(page.locator('.micro-spotlight-card')).toHaveCount(1)
    await expect(repsInput).toHaveValue('')

    await rirInput.click()
    await expect(page.locator('.micro-spotlight-card')).toContainText('RIR tells us how much you had left.')
    await expect(page.locator('.micro-spotlight-card')).toHaveCount(1)
    await expect(rirInput).toHaveValue('')

    await page.locator('.micro-spotlight-card').getByRole('button', { name: 'Got it' }).click()
    await repsInput.fill('8')
    await rirInput.fill('2')

    const noteInput = exerciseCard(page, 'High-Bar Box Squat').getByPlaceholder(/right side tilted/)
    await noteInput.click()
    await expect(page.locator('.micro-spotlight-card')).toContainText('Small notes help the coach spot patterns.')
    await expect(page.locator('.micro-spotlight-card')).toHaveCount(1)
    await expect(noteInput).toHaveValue('')

    await page.locator('.micro-spotlight-card').getByRole('button', { name: 'Got it' }).click()
    await noteInput.fill('felt clean')
    await page.getByLabel('High-Bar Box Squat set 1 load').fill('225')
    await page.locator('label.field:has-text("Overall feel") select').first().selectOption('good')
    await exerciseCard(page, 'High-Bar Box Squat').getByRole('button', { name: /Log Exercise/ }).click()
    await expect(page.locator('.micro-spotlight-card')).toContainText('This is where your work turns into feedback.')
    await expect(page.locator('.micro-spotlight-card')).toHaveCount(1)

    await page.locator('.micro-spotlight-card').getByRole('button', { name: 'Got it' }).click()
    await expect(page.locator('.micro-spotlight-card')).toHaveCount(0)
    await page.getByRole('spinbutton', { name: 'Heel-Elevated Bulgarian Split Squat set 1 reps', exact: true }).fill('10')
    await expect(page.locator('.micro-spotlight-card')).toHaveCount(0)
  })

  test('rest timer completion opens calm rest-complete overlay once', async ({ page }) => {
    await page.clock.install()
    await openMondayWorkout(page)
    await startWorkout(page)
    await page.getByLabel('Start High-Bar Box Squat rest timer').click()
    await page.locator('.timer-box').first().scrollIntoViewIfNeeded()
    await expect(page.locator('.floating-timer-widget')).toBeVisible()
    await expect(page.locator('.floating-timer-widget')).not.toContainText('Rest')
    await page.clock.fastForward(121_000)

    await expect(page.getByRole('heading', { name: 'Back in.' })).toBeVisible()
    await expect(page.getByText('REST COMPLETE')).toBeVisible()
    await expect(page.getByText('High-Bar Box Squat • Set 1/4')).toBeVisible()
    await page.getByRole('button', { name: 'Dismiss' }).click()
    await expect(page.getByRole('heading', { name: 'Back in.' })).toHaveCount(0)
    await page.clock.fastForward(2_000)
    await expect(page.getByRole('heading', { name: 'Back in.' })).toHaveCount(0)
  })

  test('complete workout, progress tab, and day switching are reachable', async ({ page }) => {
    await openMondayWorkout(page)
    await startWorkout(page)
    await page.getByRole('button', { name: 'Finish Session' }).click()
    await page.getByRole('button', { name: 'Finish Anyway' }).click()
    await expect(page.getByRole('heading', { name: 'Completed Session Summary' })).toBeVisible()

    await page.getByRole('button', { name: 'Progress', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Progress' })).toBeVisible()
    await expect(page.getByText('Completed Sessions')).toBeVisible()

    await page.getByRole('button', { name: 'Workout' }).click()
    await page.reload()
    await skipTourIfPresent(page)
    await page.getByRole('button', { name: 'Mon' }).click()
    await expect(page.getByRole('heading', { name: "Today's session is already completed." })).toBeVisible()
    await page.getByRole('button', { name: 'Sat' }).click()
    await expect(page.getByRole('heading', { name: /Saturday:/ })).toBeVisible()
  })

  test('training max edit updates the day-specific max tile', async ({ page }) => {
    await openMondayWorkout(page)
    await page.locator('.max-tile').filter({ hasText: 'Box squat' }).click()
    const microHint = page.locator('.micro-spotlight-card')
    if (await microHint.isVisible().catch(() => false)) {
      await expect(microHint).toContainText('Adjust your max lifts to shape the exercise targets to you.')
      await expect(page.getByRole('heading', { name: /Box squat Max/ })).toHaveCount(0)
      await microHint.getByRole('button', { name: 'Got it' }).click()
      await page.locator('.max-tile').filter({ hasText: 'Box squat' }).click()
    }
    await expect(page.getByRole('heading', { name: /Box squat Max/ })).toBeVisible()
    const input = page.getByLabel(/Box squat Max value/)
    await input.fill('335')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('.max-tile').filter({ hasText: 'Box squat' })).toContainText('335')
  })

  test('active training max chip strip remains editable after workout start', async ({ page }) => {
    await openMondayWorkout(page)
    await startWorkout(page)
    await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible()
    await expect(page.locator('.training-maxes-strip')).toBeVisible()
    await expect(page.locator('.max-tile')).toHaveCount(0)

    await page.getByRole('button', { name: /Box squat 315/i }).click()
    const microHint = page.locator('.micro-spotlight-card')
    if (await microHint.isVisible().catch(() => false)) {
      await microHint.getByRole('button', { name: 'Got it' }).click()
      await page.getByRole('button', { name: /Box squat 315/i }).click()
    }
    await expect(page.getByRole('heading', { name: /Box squat Max/ })).toBeVisible()
    const input = page.getByLabel(/Box squat Max value/)
    await input.fill('340')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('button', { name: /Box squat 340/i })).toBeVisible()
    await assertNoHorizontalOverflow(page)
  })

  test('normal mode logging two exercises preserves both entries in completion summary', async ({ page }) => {
    await openMondayWorkout(page)
    await startWorkout(page)

    await logStrengthSet(page, 'High-Bar Box Squat', { load: '225', reps: '8', rir: '2', note: 'clean squat sets' })
    await logStrengthSet(page, 'Romanian Deadlift', { load: '195', reps: '8', rir: '2', note: 'hamstrings clean' })

    await expect(page.getByText("Today's Logged Work")).toBeVisible()
    await expect(page.locator('.log-entry').filter({ hasText: 'High-Bar Box Squat' })).toBeVisible()
    await expect(page.locator('.log-entry').filter({ hasText: 'Romanian Deadlift' })).toBeVisible()
    await expect(page.locator('.done-icon')).toHaveCount(2)

    await page.getByRole('button', { name: 'Finish Session' }).click()
    await page.getByRole('button', { name: 'Finish Anyway' }).click()
    await expect(page.getByRole('heading', { name: 'Completed Session Summary' })).toBeVisible()
    await expect(page.locator('.summary-grid')).toContainText('2')
    await expect(page.getByText('Top performance:')).toBeVisible()
    const completedExercises = await page.evaluate(() => {
      const stored = JSON.parse(window.localStorage.getItem('leg-growth-tracker:v2'))
      return stored.completedSessions[0].completedExercises
    })
    expect(completedExercises).toEqual(expect.arrayContaining(['High-Bar Box Squat', 'Romanian Deadlift']))
  })

  test('Saturday sprint day uses sprint logging without max chips or load/RIR fields', async ({ page }) => {
    await skipTourIfPresent(page)
    await page.getByRole('button', { name: 'Sat' }).click()
    await expect(page.getByRole('heading', { name: /Saturday:/ })).toBeVisible()
    await expect(page.getByText('No lifting maxes needed for track work.')).toBeVisible()

    await startWorkout(page)
    await expect(page.locator('.training-maxes-strip')).toBeVisible()
    await expect(page.locator('.max-chip-button')).toHaveCount(0)
    await expect(page.getByText('No maxes needed for track work.')).toBeVisible()

    const sprintCard = exerciseCard(page, 'Acceleration or Speed Work')
    await expect(sprintCard.getByText('Speed quality')).toBeVisible()
    await expect(page.getByLabel(/Acceleration or Speed Work set 1 load/)).toHaveCount(0)
    await expect(page.getByLabel(/Acceleration or Speed Work set 1 reps in reserve/)).toHaveCount(0)

    await sprintCard.getByLabel('Distance').fill('40m')
    await sprintCard.getByLabel('Reps').fill('4')
    await sprintCard.getByRole('textbox', { name: 'Rest' }).fill('4 min')
    await sprintCard.getByLabel('Speed quality').selectOption('sharp')
    await sprintCard.getByLabel('Fatigue').selectOption('low')
    await sprintCard.getByPlaceholder(/speed drop after rep 3/).fill('mechanics stayed sharp')
    await sprintCard.getByRole('button', { name: /Log Exercise/ }).click()

    await expect(page.locator('.log-entry').filter({ hasText: 'Acceleration or Speed Work' })).toContainText('speed sharp')
    await assertNoHorizontalOverflow(page)
  })

  test('settings utilities expose backup and reset flow', async ({ page }) => {
    await page.getByRole('button', { name: 'Skip for now' }).click()
    await openSettings(page)
    await expect(page.getByRole('button', { name: 'Export Backup' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Import Backup' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Replay' })).toBeVisible()

    await page.getByRole('button', { name: 'Reset' }).click()
    await expect(page.getByText('Reset workout history only?')).toBeVisible()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Confirm Reset' }).click()
    await expect(page.getByRole('heading', { name: 'First time here?' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Utilities' })).toHaveCount(0)
  })

  test('export backup downloads valid persisted app state', async ({ page }) => {
    await openMondayWorkout(page)
    await editBoxSquatMax(page, 340)
    await completeMondayBoxSquatWorkout(page)

    await openSettings(page)
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export Backup' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/leg-growth-tracker-backup-.*\.json/)

    const downloadPath = await download.path()
    expect(downloadPath).toBeTruthy()
    const backup = JSON.parse(await readFile(downloadPath, 'utf8'))

    expect(backup.version).toBe(2)
    expect(backup.data.prs.boxSquat).toBe(340)
    expect(backup.data.completedSessions.length).toBeGreaterThan(0)
    expect(backup.data.sessionLog.some((entry) => entry.exercise === 'High-Bar Box Squat')).toBe(true)
  })

  test('reset history only clears training history and preserves maxes', async ({ page }) => {
    await openMondayWorkout(page)
    await editBoxSquatMax(page, 340)
    await completeMondayBoxSquatWorkout(page)

    await runResetFlow(page, 'history')
    await waitForStoredState(page, (state) => (
      state.prs.boxSquat === 340
      && state.completedSessions.length === 0
      && state.sessionLog.length === 0
    ))

    await page.getByRole('button', { name: 'Progress', exact: true }).click()
    await expect(page.getByText('No completed sessions yet.')).toBeVisible()

    await page.getByRole('button', { name: 'Workout' }).click()
    await openMondayWorkout(page)
    await expect(page.locator('.max-tile').filter({ hasText: 'Box squat' })).toContainText('340')
  })

  test('reset everything clears history, restores default maxes, and returns to first-run onboarding', async ({ page }) => {
    await openMondayWorkout(page)
    await editBoxSquatMax(page, 340)
    await completeMondayBoxSquatWorkout(page)

    await runResetFlow(page, 'everything', { skipFreshTour: false })
    await page.getByRole('button', { name: 'Start Tour' }).click()
    await expect(page.getByRole('heading', { name: 'Start with pace.' })).toBeVisible()
    await assertTourCardFullyVisible(page)
    await page.locator('.tour-anchor-card').getByRole('button', { name: 'Skip' }).click()

    await page.getByRole('button', { name: 'Progress', exact: true }).click()
    await expect(page.getByText('No completed sessions yet.')).toBeVisible()

    await page.getByRole('button', { name: 'Workout' }).click()
    await openMondayWorkout(page)
    await expect(page.locator('.max-tile').filter({ hasText: 'Box squat' })).toContainText('315')
    await expect(page.getByRole('button', { name: 'Start Workout', exact: true })).toBeVisible()
  })

  test('import backup restores maxes, logs, and completed session history', async ({ page }) => {
    await openMondayWorkout(page)
    await editBoxSquatMax(page, 340)
    await completeMondayBoxSquatWorkout(page)

    await openSettings(page)
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export Backup' }).click()
    const backupPath = await (await downloadPromise).path()
    expect(backupPath).toBeTruthy()

    await resetApp(page)
    await skipTourIfPresent(page)
    await openSettings(page)
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: 'Import Backup' }).click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(backupPath)
    await waitForStoredState(page, (state) => (
      state.prs.boxSquat === 340
      && state.completedSessions.length > 0
      && state.sessionLog.some((entry) => entry.exercise === 'High-Bar Box Squat')
    ))
    await page.getByRole('button', { name: 'Close' }).click()

    await page.getByRole('navigation', { name: 'Choose another workout day' }).getByRole('button', { name: 'Mon' }).click()
    await expect(page.getByRole('heading', { name: "Today's session is already completed." })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start New Session Anyway' })).toBeVisible()
    await page.getByRole('button', { name: 'Start New Session Anyway' }).click()
    await expect(page.getByRole('heading', { name: /Monday:/ })).toBeVisible()
    await expect(page.locator('.max-tile').filter({ hasText: 'Box squat' })).toContainText('340')
    await page.getByRole('button', { name: 'Start Session' }).click()

    await page.getByRole('button', { name: 'Progress', exact: true }).click()
    await expect(page.getByText('Completed Sessions')).toBeVisible()
    await expect(page.getByText(/1 saved/)).toBeVisible()
    await expect(page.getByText('High-Bar Box Squat').first()).toBeVisible()
  })

  test('mobile layout has no obvious horizontal overflow or clipped tour cards', async ({ page }) => {
    await mockDateAndReset(page, '2026-05-19T12:00:00-05:00')
    await expect(page.getByRole('heading', { name: 'First time here?' })).toBeVisible()
    await assertNoHorizontalOverflow(page)
    await page.getByRole('button', { name: 'Start Tour' }).click()

    for (const heading of ['Nothing forced today.']) {
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
      await assertTourCardFullyVisible(page)
      await assertNoHorizontalOverflow(page)
      if (await page.locator('.tour-anchor-card').getByRole('button', { name: 'Next', exact: true }).isVisible().catch(() => false)) {
        await clickTourNext(page)
      }
    }
  })
})
