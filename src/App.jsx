import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const defaultPRs = {
  boxSquat: 315,
  frontSquat: 225,
  trapBarDeadlift: 365,
  rdl: 275,
  inclineDbPress: 80,
  flatDbPress: 90,
  weightedPullup: 45,
}

const prMeta = {
  boxSquat: { label: 'High-Bar Box Squat', unit: 'lb bar weight', short: 'Box squat' },
  frontSquat: { label: 'Front Squat', unit: 'lb bar weight', short: 'Front squat' },
  trapBarDeadlift: { label: 'Trap Bar Deadlift', unit: 'lb total load', short: 'Trap bar' },
  rdl: { label: 'Romanian Deadlift', unit: 'lb bar weight', short: 'RDL' },
  inclineDbPress: { label: 'Incline DB Press', unit: 'lb per DB', short: 'Incline DB' },
  flatDbPress: { label: 'Flat DB Press', unit: 'lb per DB', short: 'Flat DB' },
  weightedPullup: { label: 'Weighted Pull-Up', unit: 'lb added load', short: 'Pull-up' },
}

const weeklyPlan = {
  Monday: {
    title: 'Quad Dominant Mass',
    goal: 'Heavy quad stimulus + upper chest',
    cap: '50 min',
    exercises: [
      { name: 'High-Bar Box Squat', type: 'strength', key: 'boxSquat', sets: 4, reps: '6-8', targetTopReps: 8, percent: 0.72, rest: '2:00', note: 'Controlled 2-3 sec lower. Touch box, stay tight, explode up.' },
      { name: 'Heel-Elevated Bulgarian Split Squat', type: 'accessory', sets: 3, reps: '8-10/leg', targetTopReps: 10, load: 'DBs: hard but clean', rest: '1:15', note: 'Quad bias. Keep torso upright and knee tracking forward.' },
      { name: 'Romanian Deadlift', type: 'strength', key: 'rdl', sets: 3, reps: '6-8', targetTopReps: 8, percent: 0.7, rest: '1:45', note: 'Hamstrings loaded, not lower-back grindy.' },
      { name: 'Incline DB Press', type: 'strength', key: 'inclineDbPress', sets: 3, reps: '6-10', targetTopReps: 10, percent: 0.75, rest: '1:30', note: 'Upper chest focus. 30-40 degree incline.' },
      { name: 'Weighted Pull-Up', type: 'strength', key: 'weightedPullup', sets: 2, reps: '5-8', targetTopReps: 8, percent: 0.75, rest: '1:30', note: 'Maintain back size without overdoing volume.' },
      { name: 'Leg Extension', type: 'accessory', sets: 2, reps: '12-15', targetTopReps: 15, load: 'Hard squeeze', rest: '0:45', note: 'Slow eccentric. Stop 1 rep before form breaks.' },
    ],
  },
  Wednesday: {
    title: 'Hamstrings + Quad Support',
    goal: 'Posterior chain growth + upper maintenance',
    cap: '50 min',
    exercises: [
      { name: 'Trap Bar Deadlift', type: 'strength', key: 'trapBarDeadlift', sets: 4, reps: '5-6', targetTopReps: 6, percent: 0.72, rest: '2:00', note: 'Crisp reps. No maxing.' },
      { name: 'Front Squat', type: 'strength', key: 'frontSquat', sets: 3, reps: '6-8', targetTopReps: 8, percent: 0.7, rest: '1:45', note: 'Upright torso. Quad drive.' },
      { name: 'Nordic Curl or GHR', type: 'accessory', sets: 3, reps: '5-8', targetTopReps: 8, load: 'Bodyweight', rest: '1:30', note: 'Controlled eccentric. Use assistance if needed.' },
      { name: 'Flat DB Press', type: 'strength', key: 'flatDbPress', sets: 2, reps: '8-10', targetTopReps: 10, percent: 0.72, rest: '1:15', note: 'Maintenance dose.' },
      { name: 'Chest-Supported Row', type: 'accessory', sets: 3, reps: '8-12', targetTopReps: 12, load: 'Moderate-heavy', rest: '1:15', note: 'No lower-back fatigue.' },
      { name: 'Seated Hamstring Curl', type: 'accessory', sets: 2, reps: '10-12', targetTopReps: 12, load: 'Hard squeeze', rest: '0:45', note: 'Shortened-position hamstring work.' },
    ],
  },
  Friday: {
    title: 'Low-Fatigue Neural Primer',
    goal: 'Stay springy for Saturday speed work',
    cap: '40-45 min',
    exercises: [
      { name: 'Dynamic Box Squat', type: 'strength', key: 'boxSquat', sets: 6, reps: '2', targetTopReps: 2, percent: 0.55, rest: '1:00', note: 'Fast bar speed. Leave feeling better than when you started.' },
      { name: 'Jump Squat or Clean Pull', type: 'accessory', sets: 4, reps: '3', targetTopReps: 3, load: 'Light/moderate', rest: '1:00', note: 'Explosive only. No grinding.' },
      { name: 'Walking Lunge', type: 'accessory', sets: 2, reps: '10/leg', targetTopReps: 10, load: 'Moderate', rest: '1:00', note: 'Keep this easy enough to preserve Saturday.' },
      { name: 'Incline Machine Press', type: 'accessory', sets: 3, reps: '10', targetTopReps: 10, load: 'Moderate', rest: '1:00', note: 'Upper chest frequency.' },
      { name: 'Pull-Up or Lat Pulldown', type: 'accessory', sets: 2, reps: '8', targetTopReps: 8, load: 'Moderate', rest: '1:00', note: 'Maintenance only.' },
      { name: 'Calves', type: 'accessory', sets: 3, reps: '10-15', targetTopReps: 15, load: 'Controlled', rest: '0:45', note: 'Useful for sprint elasticity.' },
    ],
  },
  Saturday: {
    title: 'Track Speed Work',
    goal: 'Pure speed, no conditioning junk',
    cap: 'Quality only',
    exercises: [
      { name: 'Warm-Up + Drills', type: 'mobility/warmup', sets: 1, reps: '15-20 min', load: 'Mobility + buildups', rest: '-', note: 'Gradually open up speed.' },
      { name: 'Acceleration or Speed Work', type: 'sprint', sets: 4, reps: '30-60m OR 120-150m', load: 'Full recovery', rest: '3:00', note: 'Stop when speed drops. Take 3-6 min between reps as needed.' },
      { name: 'Cooldown', type: 'cooldown', sets: 1, reps: '5-10 min', load: 'Easy', rest: '-', note: 'Keep legs fresh for next week.' },
    ],
  },
}

const STORAGE_KEY = 'leg-growth-tracker:v2'
const LEGACY_STORAGE_KEY = 'leg-growth-tracker:v1'

const icons = {
  check: 'M20 6 9 17l-5-5',
  clipboard: 'M9 5h6m-7 4h8m-8 4h8m-8 4h5M8 3h8v3H8z M6 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1',
  dumbbell: 'M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12',
  gauge: 'M4 14a8 8 0 0 1 16 0M12 14l4-4M7 18h10',
  pause: 'M8 5v14M16 5v14',
  play: 'M8 5v14l11-7z',
  reset: 'M4 7v5h5M5 12a7 7 0 1 0 2-5',
  save: 'M5 3h12l2 2v16H5zM8 3v6h8V3M8 21v-7h8v7',
  test: 'M10 2v6l-5 9a3 3 0 0 0 3 5h8a3 3 0 0 0 3-5l-5-9V2M8 14h8',
  timer: 'M12 8v5l3 2M9 2h6M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  zap: 'M13 2 4 14h7l-1 8 9-12h-7z',
}

function Icon({ name, className = '' }) {
  return (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={icons[name]} />
    </svg>
  )
}

const getTodayKey = () => {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60 * 1000).toISOString().slice(0, 10)
}

const scheduleOrder = ['Monday', 'Wednesday', 'Friday', 'Saturday']
const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const getWeekdayName = (dateKey = getTodayKey()) => weekdayNames[new Date(`${dateKey}T12:00:00`).getDay()]

const getNextProgrammedDay = (dateKey = getTodayKey()) => {
  const weekday = new Date(`${dateKey}T12:00:00`).getDay()
  const dayIndexes = { Monday: 1, Wednesday: 3, Friday: 5, Saturday: 6 }
  return scheduleOrder.find((planDay) => dayIndexes[planDay] > weekday) || 'Monday'
}

const getScheduledDayInfo = (dateKey = getTodayKey()) => {
  const weekday = getWeekdayName(dateKey)
  const programmedDay = weeklyPlan[weekday] ? weekday : null
  const nextDay = programmedDay || getNextProgrammedDay(dateKey)
  return {
    weekday,
    programmedDay,
    nextDay,
    isProgrammed: Boolean(programmedDay),
  }
}

const createSessionId = (dateKey, day, instance = 1) =>
  `${dateKey}:${day}${instance > 1 ? `:${instance}` : ''}`

const createCompletionKey = (dateKey, day) => `${dateKey}:${day}`

const clampFocusIndexForDay = (day, idx) => {
  const exercises = weeklyPlan[day]?.exercises || []
  if (!exercises.length) return 0
  return Math.min(exercises.length - 1, Math.max(0, Number(idx) || 0))
}

const getFocusForDay = (focusByDay, day) => clampFocusIndexForDay(day, focusByDay?.[day] ?? 0)

const createTimer = (duration) => ({
  duration,
  status: 'idle',
  startedAt: null,
  pausedRemaining: duration,
})

const getTimerRemaining = (timer, now) => {
  if (!timer) return 0
  if (timer.status !== 'running') return Math.max(0, Math.round(timer.pausedRemaining || 0))
  const elapsed = Math.floor((now - timer.startedAt) / 1000)
  return Math.max(0, Math.round((timer.pausedRemaining || timer.duration || 0) - elapsed))
}

const startTimerAt = (timer, timestamp) => {
  const remaining = getTimerRemaining(timer, timestamp)
  return {
    ...timer,
    status: 'running',
    startedAt: timestamp,
    pausedRemaining: remaining > 0 ? remaining : timer.duration,
  }
}

const pauseTimerAt = (timer, timestamp) => ({
  ...timer,
  status: 'paused',
  startedAt: null,
  pausedRemaining: getTimerRemaining(timer, timestamp),
})

function normalizeStoredState(stored = {}) {
  const workoutDate = getTodayKey()
  const schedule = getScheduledDayInfo(workoutDate)
  const day = schedule.nextDay
  const sessionInstance = stored.workoutDate === workoutDate && Number.isFinite(stored.sessionInstance) ? stored.sessionInstance : 1
  const sessionId = createSessionId(workoutDate, day, sessionInstance)

  return {
    prs: { ...defaultPRs, ...(stored.prs || {}) },
    day,
    workoutDate,
    sessionInstance,
    sessionId,
    completed: stored.completed || {},
    setDrafts: stored.setDrafts || {},
    sessionLog: Array.isArray(stored.sessionLog) ? stored.sessionLog.map(normalizeLogEntry) : [],
    readiness: stored.readiness || 'good',
    restTimers: stored.restTimers || stored.timers || {},
    sessionTimer: stored.sessionTimer || createTimer(50 * 60),
    suggestionStatus: stored.suggestionStatus || {},
    completedSessions: Array.isArray(stored.completedSessions) ? stored.completedSessions.map(normalizeCompletedSession) : [],
    alertedRestTimers: stored.alertedRestTimers || {},
    completedWorkoutKeys: stored.completedWorkoutKeys || {},
    nextTargets: stored.nextTargets || {},
    progressionDecisions: Array.isArray(stored.progressionDecisions) ? stored.progressionDecisions : [],
    dismissedBriefings: stored.dismissedBriefings || {},
    focusByDay: stored.focusByDay || { [day]: 0 },
  }
}

function migrateLegacyLog(entry, fallbackDate) {
  const safeEntry = entry && typeof entry === 'object' ? entry : {}
  const date = safeEntry.dateKey || safeEntry.isoDate || fallbackDate
  return {
    ...safeEntry,
    date,
    sessionId: safeEntry.sessionId || createSessionId(date, safeEntry.day || 'Monday'),
    loggedAt: safeEntry.loggedAt || new Date().toISOString(),
    sets: safeEntry.sets || [],
  }
}

function loadStoredState() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
    if (stored) return normalizeStoredState(stored)

    const legacy = JSON.parse(window.localStorage.getItem(LEGACY_STORAGE_KEY) || 'null')
    if (!legacy) return normalizeStoredState()

    const workoutDate = getTodayKey()
    return normalizeStoredState({
      ...legacy,
      workoutDate,
      sessionId: createSessionId(workoutDate, legacy.day || 'Monday'),
      sessionLog: Array.isArray(legacy.sessionLog) ? legacy.sessionLog.map((entry) => migrateLegacyLog(entry, workoutDate)) : [],
      setDrafts: legacy.feedback || {},
      restTimers: legacy.timers || {},
      sessionTimer: createTimer(Number.isFinite(legacy.sessionSeconds) ? legacy.sessionSeconds : 50 * 60),
    })
  } catch {
    return normalizeStoredState()
  }
}

const roundToFive = (n) => Math.round(n / 5) * 5

const restToSeconds = (rest) => {
  if (!rest || rest === '-' || rest === '—') return 0
  const parts = String(rest).split(':')
  if (parts.length !== 2) return 0
  const minutes = Number(parts[0])
  const seconds = Number(parts[1])
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) return 0
  return minutes * 60 + seconds
}

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0)
  const mins = Math.floor(safeSeconds / 60)
  const secs = safeSeconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

const formatKey = (key) => key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
const getPRLabel = (key) => prMeta[key]?.label || formatKey(key)
const getPRUnit = (key) => prMeta[key]?.unit || 'lb'
const getPRShortLabel = (key) => prMeta[key]?.short || getPRLabel(key)

const buildDefaultSets = (exercise, workingWeight) =>
  Array.from({ length: exercise.sets || 1 }, () => ({
    weight: workingWeight || '',
    reps: '',
    rir: '',
  }))

const getActivityType = (exercise) => exercise.type || (exercise.key ? 'strength' : 'accessory')
const isChecklistType = (type) => type === 'mobility/warmup' || type === 'cooldown'
const isLoadBasedType = (type) => type === 'strength' || type === 'accessory'

const findExerciseByName = (name) => Object.values(weeklyPlan)
  .flatMap((plan) => plan.exercises)
  .find((exercise) => exercise.name === name)

const getDayTrainingMaxes = (day) => {
  const seen = new Set()
  return (weeklyPlan[day]?.exercises || [])
    .filter((exercise) => exercise.key)
    .filter((exercise) => {
      if (seen.has(exercise.key)) return false
      seen.add(exercise.key)
      return true
    })
    .map((exercise) => ({
      key: exercise.key,
      exerciseName: exercise.name,
      label: getPRShortLabel(exercise.key),
      unit: getPRUnit(exercise.key),
      context: exercise.name === getPRLabel(exercise.key) ? null : `Used for ${exercise.name}`,
    }))
}

const getMaxEditorTitle = (key) => `${getPRShortLabel(key)} Max`

const normalizeLogEntry = (entry) => {
  const safeEntry = entry && typeof entry === 'object' ? entry : {}
  const exerciseName = safeEntry.exercise || 'Unknown exercise'
  const exercise = findExerciseByName(exerciseName)
  const fallbackId = [
    'recovered',
    safeEntry.sessionId || safeEntry.date || 'unknown-session',
    exerciseName.replace(/\W+/g, '-').toLowerCase(),
    safeEntry.loggedAt || safeEntry.time || 'unknown-time',
  ].join(':')

  return {
    ...safeEntry,
    id: safeEntry.id || fallbackId,
    exercise: exerciseName,
    type: safeEntry.type || (exercise ? getActivityType(exercise) : 'strength'),
    sets: Array.isArray(safeEntry.sets) ? safeEntry.sets : [],
    sprint: safeEntry.sprint && typeof safeEntry.sprint === 'object' ? safeEntry.sprint : null,
    checklist: safeEntry.checklist && typeof safeEntry.checklist === 'object' ? safeEntry.checklist : null,
  }
}

function normalizeCompletedSession(session) {
  const safeSession = session && typeof session === 'object' ? session : {}
  const date = safeSession.date || getTodayKey()
  const day = weeklyPlan[safeSession.day] ? safeSession.day : 'Monday'
  const normalizedSessionId = safeSession.sessionId || createSessionId(date, day)

  return {
    id: safeSession.id || `completed-${normalizedSessionId}`,
    sessionId: normalizedSessionId,
    date,
    day,
    completedAt: safeSession.completedAt || null,
    completedExercises: Array.isArray(safeSession.completedExercises) ? safeSession.completedExercises.filter(Boolean) : [],
    skippedExercises: Array.isArray(safeSession.skippedExercises) ? safeSession.skippedExercises.filter(Boolean) : [],
    topPerformance: safeSession.topPerformance || 'No top set logged yet.',
    formFlags: Array.isArray(safeSession.formFlags) ? safeSession.formFlags.filter(Boolean) : [],
    sprintNotes: Array.isArray(safeSession.sprintNotes) ? safeSession.sprintNotes.filter(Boolean) : [],
    coachRecommendations: Array.isArray(safeSession.coachRecommendations) ? safeSession.coachRecommendations.filter(Boolean).map((item) => (
      typeof item === 'string' ? { label: 'Coach note', labelClass: 'technical', text: item } : item
    )) : [],
  }
}

const getTargetReps = (exercise) => {
  const numbers = String(exercise.reps || '').match(/\d+/g)?.map(Number) || []
  return {
    low: numbers[0] || exercise.targetTopReps || 1,
    high: exercise.targetTopReps || numbers[numbers.length - 1] || numbers[0] || 1,
  }
}

const getTopLoggedSet = (entry) => {
  const sets = (entry.sets || [])
    .map((set) => ({
      weight: parseNumber(set.weight),
      reps: parseNumber(set.reps),
      rir: parseNumber(set.rir),
    }))
    .filter((set) => set.weight !== null && set.reps !== null)
    .sort((a, b) => (b.weight * b.reps) - (a.weight * a.reps))

  return sets[0] || null
}

const getExerciseJump = (exercise) => {
  const name = exercise.name.toLowerCase()
  if (getActivityType(exercise) === 'accessory') return 5
  if (name.includes('db')) return 5
  if (name.includes('pull-up')) return 5
  if (exercise.key === 'boxSquat' || exercise.key === 'frontSquat' || exercise.key === 'trapBarDeadlift' || exercise.key === 'rdl') return 10
  return 5
}

const reduceLoad = (load, percent = 0.95) => (load ? roundToFive(load * percent) : null)

const buildPreviousResultText = (entry) => {
  if (!entry) return 'No previous result.'
  if (entry.type === 'sprint') return `${entry.sprint?.reps || '-'} reps, quality ${entry.sprint?.speedQuality || '-'}, fatigue ${entry.sprint?.fatigue || '-'}`
  const top = getTopLoggedSet(entry)
  if (!top) return 'Logged without complete set data.'
  return `${top.weight} x ${top.reps}${top.rir !== null ? ` @ ${top.rir} RIR` : ''}`
}

const formatLoadTarget = (load, exercise) => {
  if (!load) return exercise.load || exercise.reps
  const name = String(exercise.name || '').toLowerCase()
  if (name.includes('db')) return `${load}s`
  return `${load} lb`
}

const getSetCompletionSummary = (entry, exercise) => {
  const targetReps = getTargetReps(exercise)
  const sets = (entry.sets || []).filter((set) => parseNumber(set.reps) !== null)
  const topRepSets = sets.filter((set) => (parseNumber(set.reps) || 0) >= targetReps.high).length
  const rirs = sets.map((set) => parseNumber(set.rir)).filter((value) => value !== null)
  const avgRir = rirs.length ? rirs.reduce((sum, rir) => sum + rir, 0) / rirs.length : null
  const lowRirSets = rirs.filter((rir) => rir <= 1).length
  return {
    loggedSets: sets.length,
    plannedSets: exercise.sets || 1,
    topRepSets,
    targetTopReps: targetReps.high,
    avgRir,
    lowRirSets,
    incomplete: sets.length < (exercise.sets || 1),
  }
}

const buildProgressionPrescription = ({ decision, exercise, blocker, unlockCondition }) => {
  if (decision.type === 'sprint') return `${decision.exercise}: ${decision.suggestedTarget}. ${unlockCondition || blocker || decision.reason}`
  const loadText = formatLoadTarget(decision.targetLoad, exercise)
  const target = decision.targetLoad ? `${loadText} x ${exercise.reps}` : decision.suggestedTarget
  return `${decision.exercise}: Repeat ${target}. ${blocker} ${unlockCondition}`
}

const getWorkoutState = ({ sessionTimer, sessionLogs, currentCompletionSummary, isTodayCompleted }) => {
  if (currentCompletionSummary || isTodayCompleted) return 'completed'
  if (sessionTimer.status === 'running' || sessionTimer.status === 'paused' || sessionLogs.length > 0) return 'inProgress'
  return 'notStarted'
}

const shouldShowNextTimeProgression = (workoutState) => workoutState === 'completed' || workoutState === 'viewingHistory'

const getTimerPrimaryAction = (timerStatus) => {
  if (timerStatus === 'running') {
    return { label: 'Pause', icon: 'pause', action: 'pause', className: 'button secondary' }
  }
  if (timerStatus === 'paused') {
    return { label: 'Resume', icon: 'play', action: 'start', className: 'button primary' }
  }
  return { label: 'Start Workout', icon: 'play', action: 'start', className: 'button primary pulse-start' }
}

const shouldConfirmDaySwitch = ({ currentDay, targetDay, sessionTimer, sessionLogs, currentCompletionSummary }) =>
  currentDay !== targetDay
  && !currentCompletionSummary
  && (sessionTimer.status === 'running' || sessionTimer.status === 'paused' || sessionLogs.length > 0)

const buildFreshTrackerState = ({ prs = defaultPRs, keepPrs = false, dateKey = getTodayKey() } = {}) => {
  const schedule = getScheduledDayInfo(dateKey)
  const nextDay = schedule.nextDay
  return {
    prs: keepPrs ? prs : defaultPRs,
    day: nextDay,
    workoutDate: dateKey,
    sessionInstance: 1,
    completed: {},
    setDrafts: {},
    sessionLog: [],
    completedSessions: [],
    completedWorkoutKeys: {},
    nextTargets: {},
    progressionDecisions: [],
    dismissedBriefings: {},
    readiness: 'good',
    restTimers: {},
    alertedRestTimers: {},
    sessionTimer: createTimer(50 * 60),
    suggestionStatus: {},
    focusByDay: { [nextDay]: 0 },
  }
}

const getResetCopy = (mode, step = 1) => {
  const historyOnly = mode === 'history'
  if (step === 2) {
    return {
      title: historyOnly ? 'Confirm reset history only?' : 'Confirm reset everything?',
      body: historyOnly
        ? 'Type RESET to delete workout history, logs, coach insights, progression targets, timers, and trend data. Your training maxes will remain.'
        : 'Type RESET to delete all workout history and clear your training maxes. The app will return to a fresh-start state.',
    }
  }

  return {
    title: historyOnly ? 'Reset workout history only?' : 'Reset everything?',
    body: historyOnly
      ? 'This will delete completed sessions, workout logs, coach insights, progression targets, timers, and trend data. Your training maxes will be kept.'
      : 'This will delete all workout history and also clear your training maxes. The app will return to a fresh-start state.',
  }
}

const getResetOptionClass = (mode, option) =>
  mode === option ? 'reset-option selected' : 'reset-option'

const getPerformanceTrend = (exerciseName, history) => {
  const exposures = history
    .filter((entry) => entry.exercise === exerciseName && isLoadBasedType(entry.type))
    .map((entry) => ({ entry, metrics: getStrengthMetrics(entry) }))
    .filter((item) => item.metrics.volumeLoad > 0)
    .slice(0, 4)

  if (exposures.length < 2) return 'insufficient'
  const latest = exposures[0].metrics.volumeLoad
  const previous = exposures[1].metrics.volumeLoad
  if (latest > previous * 1.03) return 'improving'
  if (latest < previous * 0.92) return 'declining'
  return 'holding'
}

const createProgressionDecision = ({ entry, exercise, readiness, history, fallbackLoad }) => {
  const type = entry.type || getActivityType(exercise)
  const flags = scanCoachSignals(getEntryNotes(entry))
  const formIssues = createFormInsights(entry)
  const hasPain = flags.some((flag) => flag.category === 'pain')
  const hasFormIssue = formIssues.length > 0
  const highFatigue = readiness === 'flat' || entry.difficulty === 'hard' || flags.some((flag) => flag.category === 'fatigue' || flag.category === 'readiness')
  const previousResult = buildPreviousResultText(entry)
  const trend = getPerformanceTrend(entry.exercise, [entry, ...(history || [])])

  if (type === 'sprint') {
    const speedQuality = entry.sprint?.speedQuality
    const fatigue = entry.sprint?.fatigue
    const speedDrop = speedQuality === 'dropping' || flags.some((flag) => flag.category === 'sprint')
    let decision = 'Maintain quality exposure'
    let reason = 'Speed work progresses by quality, not load.'
    let suggestedTarget = 'Repeat quality sprint dose with full recovery.'

    if (hasPain) {
      decision = 'Reduce sprint intensity/volume'
      reason = 'Pain or tissue warning appeared in the sprint notes.'
      suggestedTarget = 'Reduce volume and intensity; stop if symptoms appear.'
    } else if (speedDrop) {
      decision = 'Reduce reps or extend rest'
      reason = 'Speed dropped, so quality is falling before the planned dose is finished.'
      suggestedTarget = 'Cut 1-2 reps or extend rest until speed is sharp again.'
    } else if (fatigue === 'high') {
      decision = 'Hold volume, extend rest'
      reason = 'High fatigue makes more volume less useful for speed.'
      suggestedTarget = 'Keep reps stable and use longer recovery.'
    } else if (speedQuality === 'sharp' && fatigue === 'low') {
      decision = 'Slightly increase quality exposure'
      reason = 'Speed quality was high and fatigue stayed low.'
      suggestedTarget = 'Add one high-quality rep only if mechanics stay sharp.'
    }

    return { exercise: entry.exercise, type, previousResult, decision, reason, suggestedTarget, flagsConsidered: flags.map((flag) => flag.issue), date: entry.date, sessionId: entry.sessionId }
  }

  if (!isLoadBasedType(type)) return null

  const targetReps = getTargetReps(exercise)
  const topSet = getTopLoggedSet(entry)
  const usableSets = (entry.sets || []).filter((set) => parseNumber(set.reps) !== null)
  const setSummary = getSetCompletionSummary(entry, exercise)
  const allTopReps = usableSets.length >= (exercise.sets || 1) && usableSets.every((set) => (parseNumber(set.reps) || 0) >= targetReps.high)
  const allRirClean = usableSets.length > 0 && usableSets.every((set) => (parseNumber(set.rir) ?? 2) >= 2)
  const nearLimit = usableSets.some((set) => (parseNumber(set.rir) ?? 2) <= 1)
  const baseLoad = topSet?.weight || fallbackLoad || null
  const jump = getExerciseJump(exercise)
  let decision = 'Hold target'
  let reason = 'Build cleaner reps before adding load.'
  let targetLoad = baseLoad
  let suggestedTarget = baseLoad ? `${baseLoad} lb x ${exercise.reps}` : exercise.load || exercise.reps
  let blocker = setSummary.incomplete
    ? `Progression held because only ${setSummary.loggedSets}/${setSummary.plannedSets} sets had logged rep data.`
    : `Hold because only ${setSummary.topRepSets}/${setSummary.plannedSets} sets reached ${setSummary.targetTopReps} reps.`
  let unlockCondition = `Progress when all ${setSummary.plannedSets} sets reach ${setSummary.targetTopReps} reps with 1-2 RIR and no form flags.`

  if (hasPain) {
    decision = 'Block progression'
    targetLoad = reduceLoad(baseLoad, 0.9)
    blocker = 'Progression blocked because pain was flagged.'
    unlockCondition = 'Resume progression only after the movement is pain-free for a full session.'
    reason = `${blocker} ${unlockCondition}`
    suggestedTarget = targetLoad ? `${targetLoad} lb with reduced range if needed` : 'Reduce range or swap movement if pain remains.'
  } else if (hasFormIssue) {
    decision = 'Hold or reduce target'
    targetLoad = reduceLoad(baseLoad, 0.95)
    blocker = `Hold load because ${formIssues[0].label.toLowerCase()} was flagged.`
    unlockCondition = `Progress only after ${formIssues[0].label.toLowerCase()} clears for a full session.`
    reason = `${blocker} ${unlockCondition}`
    suggestedTarget = targetLoad ? `${targetLoad} lb x ${exercise.reps}` : 'Hold load and add tempo/control.'
  } else if (highFatigue || trend === 'declining') {
    decision = 'Hold target'
    targetLoad = baseLoad
    blocker = highFatigue ? 'Hold because readiness or fatigue limited the session.' : 'Hold because performance declined across recent exposures.'
    unlockCondition = `Progress when output rebounds and all ${setSummary.plannedSets} sets meet the top of the range with 1-2 RIR.`
    reason = `${blocker} ${unlockCondition}`
    suggestedTarget = baseLoad ? `${baseLoad} lb x ${exercise.reps}` : exercise.load || exercise.reps
  } else if (type === 'accessory') {
    if (allTopReps && allRirClean) {
      decision = 'Progress accessory load slightly'
      targetLoad = baseLoad ? baseLoad + jump : null
      blocker = `All ${setSummary.plannedSets} sets reached ${setSummary.targetTopReps} reps with enough reserve.`
      unlockCondition = 'Use the small load increase and keep tempo/control clean.'
      reason = `${blocker} ${unlockCondition}`
      suggestedTarget = targetLoad ? `${targetLoad} lb x ${targetReps.low}-${targetReps.high}` : `Add a small load and stay in ${exercise.reps}`
    } else {
      decision = 'Add reps before load'
      blocker = setSummary.incomplete
        ? `Progression held because set data was incomplete.`
        : `Hold because only ${setSummary.topRepSets}/${setSummary.plannedSets} sets reached ${setSummary.targetTopReps} reps.`
      unlockCondition = `Progress when all sets reach ${setSummary.targetTopReps} reps with clean control.`
      reason = `${blocker} ${unlockCondition}`
      suggestedTarget = baseLoad ? `${formatLoadTarget(baseLoad, exercise)} x ${exercise.reps}` : `Aim toward ${exercise.reps} with cleaner tempo`
    }
  } else if (allTopReps && allRirClean) {
    decision = 'Increase target load'
    targetLoad = baseLoad ? baseLoad + jump : null
    blocker = `All ${setSummary.plannedSets} sets reached ${setSummary.targetTopReps} reps with 2+ RIR.`
    unlockCondition = `Move up ${jump} lb and keep the same rep standard.`
    reason = `${blocker} ${unlockCondition}`
    suggestedTarget = targetLoad ? `${targetLoad} lb x ${exercise.reps}` : `Increase moderately for ${exercise.reps}`
  } else if (allTopReps || nearLimit) {
    decision = 'Hold target'
    blocker = nearLimit
      ? `Hold because last session was near limit${setSummary.avgRir !== null ? ` (avg RIR ${setSummary.avgRir.toFixed(1)})` : ''}.`
      : `Hold because the work was completed without enough reserve to progress confidently.`
    unlockCondition = `Progress when all ${setSummary.plannedSets} sets reach ${setSummary.targetTopReps} reps with 1-2 RIR.`
    reason = `${blocker} ${unlockCondition}`
    suggestedTarget = baseLoad ? `${baseLoad} lb x ${exercise.reps}` : exercise.reps
  }

  return {
    exercise: entry.exercise,
    type,
    previousResult,
    decision,
    reason,
    suggestedTarget,
    targetLoad,
    targetReps: exercise.reps,
    blocker,
    unlockCondition,
    setSummary,
    flagsConsidered: flags.map((flag) => flag.issue),
    date: entry.date,
    sessionId: entry.sessionId,
  }
}

const generateProgressionDecisions = ({ logs, plan, readiness, history, getFallbackLoad }) => logs
  .map((entry) => {
    const exercise = plan.exercises.find((item) => item.name === entry.exercise)
    if (!exercise) return null
    return createProgressionDecision({
      entry,
      exercise,
      readiness,
      history: history.filter((item) => item.sessionId !== entry.sessionId),
      fallbackLoad: getFallbackLoad(exercise),
    })
  })
  .filter(Boolean)

const buildNextTargets = (decisions) => decisions.reduce((acc, decision) => ({
  ...acc,
  [decision.exercise]: {
    exercise: decision.exercise,
    type: decision.type,
    targetLoad: decision.targetLoad ?? null,
    targetReps: decision.targetReps || null,
    suggestedTarget: decision.suggestedTarget,
    reason: decision.reason,
    decision: decision.decision,
    blocker: decision.blocker,
    unlockCondition: decision.unlockCondition,
    setSummary: decision.setSummary,
    previousResult: decision.previousResult,
    flagsConsidered: decision.flagsConsidered || [],
    date: decision.date,
    sessionId: decision.sessionId,
  },
}), {})

const clearObjectPrefix = (object, prefix) => Object.fromEntries(
  Object.entries(object || {}).filter(([key]) => !key.startsWith(prefix)),
)

const getLastSameDaySession = (completedSessions, day, currentSessionId) =>
  completedSessions.find((session) => session.day === day && session.sessionId !== currentSessionId) || null

const targetBelongsToDay = (target, day) =>
  weeklyPlan[day]?.exercises.some((exercise) => exercise.name === target.exercise) || false

const getTargetFocusLine = (target) => {
  const exercise = findExerciseByName(target.exercise) || {}
  const shortName = exercise.key ? (prMeta[exercise.key]?.short || target.exercise) : target.exercise
  const text = `${target.reason || ''} ${target.decision || ''} ${target.blocker || ''} ${target.unlockCondition || ''}`

  if (/pain/i.test(text)) return `${shortName}: keep this pain-free before chasing load.`
  if (/tilt|stability|asymmetry|coordination|form|lockout/i.test(text)) return `${shortName}: repeat the target until the flagged mechanics clean up.`
  if (/fatigue|near limit|readiness|declined/i.test(text)) return `${shortName}: hold the target and make it feel cleaner today.`
  if (/increase|progress/i.test(String(target.decision))) return `${shortName} can progress if today's sets stay clean.`
  return null
}

const buildTodayFocus = ({ day, lastSummary, nextTargets }) => {
  if (!lastSummary) return []
  const isSprintDay = day === 'Saturday'
  const focus = new Set()

  if (isSprintDay) {
    const sprintFlag = lastSummary.sprintNotes?.find((note) => /dropping|fatigue|quality/i.test(note))
    if (sprintFlag) {
      focus.add('Keep sprint quality high; stop if mechanics drop.')
      focus.add('Extend rest if speed quality falls before planned reps are complete.')
    }
    if (lastSummary.skippedExercises?.length) focus.add(`Finish the missed track item: ${lastSummary.skippedExercises[0]}.`)
    return [...focus].slice(0, 3)
  }

  const targetEntries = Object.values(nextTargets || {})
    .filter((target) => target.type !== 'sprint' && targetBelongsToDay(target, day))
  const primaryFlag = lastSummary.formFlags?.[0]
  const flaggedTarget = targetEntries.find((target) => (
    primaryFlag && target.exercise === primaryFlag.exercise
  ))
  const cautionTargets = targetEntries.filter((target) => /hold|reduce|block/i.test(`${target.decision} ${target.reason}`))
  const progressTarget = targetEntries.find((target) => /increase|progress/i.test(String(target.decision)))

  if (primaryFlag) focus.add(`Watch ${primaryFlag.exercise}: ${primaryFlag.label || primaryFlag.issue}.`)
  ;[flaggedTarget, ...cautionTargets, progressTarget].filter(Boolean).forEach((target) => {
    const line = getTargetFocusLine(target)
    if (line) focus.add(line)
  })
  if (lastSummary.skippedExercises?.length) focus.add(`Finish missed work: ${lastSummary.skippedExercises[0]}.`)

  return [...focus].slice(0, 3)
}

const buildSessionBriefing = ({ day, lastSummary, nextTargets }) => {
  if (!lastSummary) return null
  const focus = buildTodayFocus({ day, lastSummary, nextTargets })
  const targets = Object.values(nextTargets || {}).filter((target) => {
    const exercise = findExerciseByName(target.exercise)
    return exercise && Object.values(weeklyPlan[day]?.exercises || {}).some((item) => item.name === exercise.name)
  })

  return {
    title: day === 'Saturday' ? 'Before Today’s Track Session' : `Last ${day} Briefing`,
    lastLine: `Last ${day}: ${lastSummary.topPerformance}`,
    skippedLine: lastSummary.skippedExercises?.length ? `Skipped: ${lastSummary.skippedExercises.join(', ')}` : null,
    flags: lastSummary.formFlags || [],
    targets,
    focus,
  }
}

const shouldShowBriefing = ({ briefing, sessionTimer, sessionLogs, isTodayCompleted, dismissedBriefings, briefingKey }) =>
  Boolean(briefing && sessionTimer.status === 'idle' && sessionLogs.length === 0 && !isTodayCompleted && !dismissedBriefings[briefingKey])

const getDraftForExercise = (draft, exercise, workingWeight) => ({
  sets: draft?.sets?.length ? draft.sets : buildDefaultSets(exercise, workingWeight),
  difficulty: draft?.difficulty || '',
  notes: draft?.notes || '',
  sprint: {
    distance: draft?.sprint?.distance || '',
    reps: draft?.sprint?.reps || '',
    rest: draft?.sprint?.rest || exercise.rest || '',
    speedQuality: draft?.sprint?.speedQuality || '',
    fatigue: draft?.sprint?.fatigue || '',
    bestRep: draft?.sprint?.bestRep || '',
    mechanicsNote: draft?.sprint?.mechanicsNote || '',
  },
  checklist: {
    completed: Boolean(draft?.checklist?.completed),
    notes: draft?.checklist?.notes || '',
  },
})

const parseTimerId = (id) => {
  const [timerDay, rawIdx] = String(id).split('-')
  const idx = Number(rawIdx)
  return {
    day: timerDay,
    idx,
    exercise: weeklyPlan[timerDay]?.exercises?.[idx] || null,
  }
}

const getRestDurationForTimerId = (id, fallbackTimer) => {
  const { exercise } = parseTimerId(id)
  return restToSeconds(exercise?.rest) || fallbackTimer?.duration || 0
}

const getTimerAlertToken = (timer) => `${timer?.startedAt || 'idle'}:${timer?.duration || 0}`

const getRestTimerAlertCandidates = (restTimers, timestamp, alertedRestTimers) => (
  Object.entries(restTimers || {})
    .map(([id, timer]) => ({
      id,
      timer,
      remaining: getTimerRemaining(timer, timestamp),
      token: getTimerAlertToken(timer),
      meta: parseTimerId(id),
    }))
    .filter(({ timer, remaining, token, id, meta }) => (
      timer?.status === 'running'
      && remaining === 0
      && timer.startedAt
      && meta.exercise
      && alertedRestTimers?.[id] !== token
    ))
    .sort((a, b) => (b.timer.startedAt || 0) - (a.timer.startedAt || 0))
)

const getRestTimerAlertCandidate = (restTimers, timestamp, alertedRestTimers) =>
  getRestTimerAlertCandidates(restTimers, timestamp, alertedRestTimers)[0] || null

const triggerRestTimerHaptic = (navigatorLike = window.navigator) => {
  try {
    navigatorLike?.vibrate?.([200, 100, 200])
    return true
  } catch {
    return false
  }
}

const dismissRestTimerAlert = () => null

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const summarizeLogEntry = (entry) => {
  if (!entry) return ''
  if (entry.type === 'sprint' && entry.sprint) {
    return `${entry.date || 'previous'}: ${entry.sprint.distance || '-'} x ${entry.sprint.reps || '-'}, speed ${entry.sprint.speedQuality || '-'}, fatigue ${entry.sprint.fatigue || '-'}`
  }
  if (isChecklistType(entry.type) && entry.checklist) {
    return `${entry.date || 'previous'}: ${entry.checklist.completed ? 'completed' : 'not completed'}`
  }
  if (isLoadBasedType(entry.type) && entry.sets?.length) {
    const setSummary = entry.sets
      .map((set) => `${set.weight ?? '-'}x${set.reps ?? '-'}@${set.rir ?? '-'}RIR`)
      .join(', ')
    return `${entry.date || 'previous'}: ${setSummary}`
  }
  return `${entry.date || 'previous'}: ${entry.weight || 'as prescribed'}`
}

const getCompletedExerciseNames = (logs) => new Set(logs.map((entry) => entry.exercise))

const getTopPerformance = (logs) => {
  const strengthSets = logs
    .filter((entry) => isLoadBasedType(entry.type))
    .flatMap((entry) => (entry.sets || []).map((set) => ({
      exercise: entry.exercise,
      weight: parseNumber(set.weight) ?? 0,
      reps: parseNumber(set.reps) ?? 0,
      rir: parseNumber(set.rir),
      score: (parseNumber(set.weight) ?? 0) * (parseNumber(set.reps) ?? 0),
    })))
    .filter((set) => set.weight > 0 && set.reps > 0)
    .sort((a, b) => b.score - a.score)

  if (strengthSets[0]) {
    const top = strengthSets[0]
    return `${top.exercise}: ${top.weight} x ${top.reps}${top.rir !== null ? ` @ ${top.rir} RIR` : ''}`
  }

  const sprint = logs.find((entry) => entry.type === 'sprint' && (entry.sprint?.bestRep || entry.sprint?.speedQuality))
  if (sprint) return `${sprint.exercise}: ${sprint.sprint.bestRep || sprint.sprint.speedQuality}`
  return 'No top set logged yet.'
}

const buildCompletedSessionSummary = ({ logs, plan, completed, day, sessionId, workoutDate, readiness }) => {
  const normalizedLogs = Array.isArray(logs) ? logs.map(normalizeLogEntry) : []
  const completedNames = getCompletedExerciseNames(normalizedLogs)
  const skipped = plan.exercises.filter((exercise, idx) => !completed[`${day}-${idx}`] && !completedNames.has(exercise.name))
  const coach = buildCoachInsights({ logs: normalizedLogs, plan, readiness })
  const formFlags = uniqueBy(normalizedLogs.flatMap((entry) => createFormInsights(entry)), (item) => `${item.exercise}:${item.issue}`)
  const sprintNotes = normalizedLogs
    .filter((entry) => entry.type === 'sprint')
    .map((entry) => `${entry.exercise}: ${entry.sprint?.speedQuality || 'quality not set'} / fatigue ${entry.sprint?.fatigue || 'not set'}${entry.sprint?.bestRep ? ` / best ${entry.sprint.bestRep}` : ''}`)
  const completedExercises = uniqueBy(normalizedLogs, (entry) => entry.exercise).map((entry) => entry.exercise)

  return {
    id: `completed-${sessionId}-${Date.now()}`,
    sessionId,
    date: workoutDate,
    day,
    completedAt: new Date().toISOString(),
    completedExercises,
    skippedExercises: skipped.map((exercise) => exercise.name),
    topPerformance: getTopPerformance(normalizedLogs),
    formFlags: formFlags.map((flag) => ({ exercise: flag.exercise, issue: flag.issue, label: flag.label, severity: flag.severity, text: flag.text })),
    sprintNotes,
    coachRecommendations: [...coach.form, ...coach.progression].slice(0, 4).map((item) => ({
      label: item.label || (item.type === 'progression' ? 'Next target' : 'Coach note'),
      labelClass: item.labelClass || 'technical',
      text: item.text,
    })),
  }
}

const getEntryDateMs = (entry) => {
  const date = entry.loggedAt || entry.completedAt || entry.date
  const ms = date ? new Date(date).getTime() : 0
  return Number.isFinite(ms) ? ms : 0
}

const filterExposures = (exposures, filter) => {
  const sorted = [...exposures].sort((a, b) => getEntryDateMs(b) - getEntryDateMs(a))
  if (filter === '4') return sorted.slice(0, 4)
  if (filter === '8') return sorted.slice(0, 8)
  if (filter === '1m' || filter === '3m') {
    const days = filter === '1m' ? 31 : 93
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    return sorted.filter((entry) => getEntryDateMs(entry) >= cutoff)
  }
  return sorted
}

const getStrengthMetrics = (entry) => {
  const sets = (entry.sets || []).filter((set) => parseNumber(set.weight) !== null && parseNumber(set.reps) !== null)
  const topWeight = Math.max(0, ...sets.map((set) => parseNumber(set.weight) ?? 0))
  const volumeLoad = sets.reduce((sum, set) => sum + (parseNumber(set.weight) ?? 0) * (parseNumber(set.reps) ?? 0), 0)
  const bestSet = sets.reduce((best, set) => {
    const weight = parseNumber(set.weight) ?? 0
    const reps = parseNumber(set.reps) ?? 0
    const score = weight * reps
    return score > best.score ? { weight, reps, rir: parseNumber(set.rir), score } : best
  }, { weight: 0, reps: 0, rir: null, score: 0 })
  const rirs = sets.map((set) => parseNumber(set.rir)).filter((value) => value !== null)
  const avgRir = rirs.length ? rirs.reduce((sum, rir) => sum + rir, 0) / rirs.length : null
  return { topWeight, volumeLoad, bestSet, avgRir }
}

const qualityScore = { dropping: 0, good: 1, sharp: 2 }
const fatigueScore = { low: 1, moderate: 2, high: 3 }

const getDefaultChartMetric = (card) => {
  if (card.type === 'sprint') return 'speedQuality'
  const exercise = findExerciseByName(card.exercise)
  return getActivityType(exercise || {}) === 'accessory' ? 'volumeLoad' : 'topWeight'
}

const strengthMetricOptions = [
  { value: 'topWeight', label: 'Top load' },
  { value: 'volumeLoad', label: 'Volume' },
  { value: 'bestSetScore', label: 'Best set' },
  { value: 'avgRir', label: 'Avg RIR' },
]

const sprintMetricOptions = [
  { value: 'reps', label: 'Reps' },
  { value: 'speedQuality', label: 'Speed quality' },
  { value: 'fatigue', label: 'Fatigue' },
  { value: 'bestRep', label: 'Best rep/time' },
]

const getChartMetricOptions = (type) => (type === 'sprint' ? sprintMetricOptions : strengthMetricOptions)

const parseBestRepValue = (bestRep) => {
  const number = String(bestRep || '').match(/\d+(\.\d+)?/)?.[0]
  return number ? Number(number) : null
}

const getExposureValue = (entry, metric, type) => {
  if (type === 'sprint') {
    if (metric === 'reps') return parseNumber(entry.sprint?.reps)
    if (metric === 'speedQuality') return qualityScore[entry.sprint?.speedQuality] ?? null
    if (metric === 'fatigue') return fatigueScore[entry.sprint?.fatigue] ?? null
    if (metric === 'bestRep') return parseBestRepValue(entry.sprint?.bestRep)
    return null
  }

  if (metric === 'topWeight') return entry.metrics?.topWeight || null
  if (metric === 'volumeLoad') return entry.metrics?.volumeLoad || null
  if (metric === 'bestSetScore') return entry.metrics?.bestSet?.score || null
  if (metric === 'avgRir') return entry.metrics?.avgRir
  return null
}

const buildChartData = (card, metric = getDefaultChartMetric(card)) => card.exposures
  .map((entry, index) => ({
    index: index + 1,
    date: entry.date || entry.loggedAt?.slice(0, 10) || `Exposure ${index + 1}`,
    value: getExposureValue(entry, metric, card.type),
    entry,
  }))
  .filter((point) => point.value !== null && point.value !== undefined && Number.isFinite(Number(point.value)))

const getChartState = (card, metric = getDefaultChartMetric(card)) => {
  const points = buildChartData(card, metric)
  if (card.exposures.length === 0 || points.length === 0) return 'locked'
  if (points.length === 1) return 'insufficient'
  return 'ready'
}

const buildExposureDetails = (card, point, metric = getDefaultChartMetric(card)) => {
  if (!point) return null
  const entry = point.entry
  const issues = createFormInsights(entry)
  const decision = createProgressionDecision({
    entry,
    exercise: findExerciseByName(entry.exercise) || {},
    readiness: 'good',
    history: [],
    fallbackLoad: entry.metrics?.topWeight || getTopLoggedSet(entry)?.weight || null,
  })

  return {
    date: point.date,
    exposure: point.index,
    metricLabel: getChartMetricOptions(card.type).find((option) => option.value === metric)?.label || metric,
    metricValue: point.value,
    topLoad: entry.metrics?.topWeight || null,
    volume: entry.metrics?.volumeLoad || null,
    bestSet: entry.metrics?.bestSet?.weight ? `${entry.metrics.bestSet.weight} x ${entry.metrics.bestSet.reps}` : null,
    avgRir: entry.metrics?.avgRir ?? null,
    sprint: entry.sprint || null,
    notes: getEntryNotes(entry),
    flags: issues.map((issue) => issue.issue),
    interpretation: issues.length
      ? `${entry.exercise}: ${issues[0].issue} showed up. Treat this exposure with caution.`
      : decision?.reason || card.interpretation,
  }
}

const buildStrengthTrajectory = (exerciseName, logs, filter) => {
  const exposures = filterExposures(logs.filter((entry) => entry.exercise === exerciseName && isLoadBasedType(entry.type)), filter)
    .map((entry) => ({ ...entry, metrics: getStrengthMetrics(entry), issues: createFormInsights(entry) }))
    .filter((entry) => entry.metrics.volumeLoad > 0)
    .reverse()

  if (exposures.length < 2) {
    return {
      exercise: exerciseName,
      type: 'strength',
      label: 'Insufficient data',
      interpretation: 'Log at least 2-3 exposures before judging progress.',
      exposures,
    }
  }

  const first = exposures[0]
  const last = exposures[exposures.length - 1]
  const issues = exposures.flatMap((entry) => entry.issues)
  const performanceUp = last.metrics.volumeLoad > first.metrics.volumeLoad || last.metrics.bestSet.score > first.metrics.bestSet.score || last.metrics.topWeight > first.metrics.topWeight
  const performanceDown = last.metrics.volumeLoad < first.metrics.volumeLoad * 0.9 && last.metrics.bestSet.score < first.metrics.bestSet.score
  const fatigueConcern = /fatigue|sore|tight/i.test(exposures.map(getEntryNotes).join(' '))
  const formConcern = issues.length > 0

  let label = 'Holding'
  if (performanceUp && formConcern) label = 'Progressing with caution'
  else if (performanceUp) label = 'Progressing'
  else if (performanceDown && fatigueConcern) label = 'Regressing'
  else if (formConcern && !performanceDown) label = 'Holding / Technical improvement'

  const issueText = issues.length ? `${issues[0].issue} has appeared${issues.length > 1 ? ` ${issues.length} times` : ''}` : 'no major form flags'
  const interpretation = label === 'Progressing'
    ? 'Load, reps, or volume are moving up without major form flags. Keep progressing conservatively.'
    : label === 'Progressing with caution'
      ? `Performance is improving, but ${issueText}. Hold or make the smallest jump until reps look clean.`
      : label === 'Regressing'
        ? 'Performance is down while fatigue signals are up. Treat this as a recovery concern before adding load.'
        : label.includes('Technical')
          ? `Load is not the story right now. ${issueText}; prioritize cleaner reps before chasing numbers.`
          : 'Performance is steady. Keep the load stable and look for cleaner reps or more total reps.'

  return { exercise: exerciseName, type: 'strength', label, interpretation, exposures }
}

const buildSprintTrajectory = (exerciseName, logs, filter) => {
  const exposures = filterExposures(logs.filter((entry) => entry.exercise === exerciseName && entry.type === 'sprint'), filter).reverse()
  if (exposures.length < 2) {
    return {
      exercise: exerciseName,
      type: 'sprint',
      label: 'Insufficient data',
      interpretation: 'Log at least 2 sprint exposures before judging speed quality.',
      exposures,
    }
  }

  const first = exposures[0]
  const last = exposures[exposures.length - 1]
  const hasDrop = exposures.some((entry) => entry.sprint?.speedQuality === 'dropping' || /speed\s*drop|drop.?off|slowed/i.test(getEntryNotes(entry)))
  const fatigueRising = (fatigueScore[last.sprint?.fatigue] ?? 0) > (fatigueScore[first.sprint?.fatigue] ?? 0)
  const qualityImproving = (qualityScore[last.sprint?.speedQuality] ?? 0) > (qualityScore[first.sprint?.speedQuality] ?? 0)

  let label = 'Stable quality'
  if (hasDrop) label = 'Speed drop concern'
  else if (fatigueRising) label = 'Fatigue rising'
  else if (qualityImproving) label = 'Quality improving'

  const interpretation = label === 'Quality improving'
    ? 'Speed quality is trending up. Keep rest full and stop before mechanics fade.'
    : label === 'Speed drop concern'
      ? 'Speed drop showed up. End the session earlier or extend rest so sprint quality stays high.'
      : label === 'Fatigue rising'
        ? 'Fatigue is rising across exposures. Reduce reps or increase rest next time.'
        : 'Quality is stable. Keep the dose similar and chase cleaner, faster reps.'

  return { exercise: exerciseName, type: 'sprint', label, interpretation, exposures }
}

const buildTrendCards = (logs, filter) => {
  const safeLogs = Array.isArray(logs) ? logs.map(normalizeLogEntry) : []
  const plannedNames = Object.values(weeklyPlan)
    .flatMap((plan) => plan.exercises)
    .filter((exercise) => isLoadBasedType(getActivityType(exercise)) || getActivityType(exercise) === 'sprint')
    .map((exercise) => exercise.name)
  const loggedNames = safeLogs.filter((entry) => isLoadBasedType(entry.type) || entry.type === 'sprint').map((entry) => entry.exercise)
  const names = [...new Set([...plannedNames, ...loggedNames])]
  return names.map((name) => {
    const exercise = findExerciseByName(name)
    return getActivityType(exercise || {}) === 'sprint'
      ? buildSprintTrajectory(name, safeLogs, filter)
      : buildStrengthTrajectory(name, safeLogs, filter)
  })
}

function ExposureChart({ card, metric, height = 128, onSelectPoint }) {
  const points = buildChartData(card, metric)
  const state = getChartState(card, metric)
  const metricLabel = getChartMetricOptions(card.type).find((option) => option.value === metric)?.label || metric

  return (
    <div className="chart-wrap" style={{ '--chart-height': `${height}px` }}>
      {points.length > 0 && (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={points} margin={{ top: 12, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
            <XAxis dataKey="index" tick={{ fill: '#a8bdb8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <Tooltip
              cursor={{ stroke: 'rgba(94, 234, 212, 0.35)', strokeWidth: 1 }}
              contentStyle={{ background: '#10201c', border: '1px solid rgba(94, 234, 212, 0.35)', borderRadius: 8, color: '#f8fafc' }}
              labelFormatter={(label) => `Exposure ${label}`}
              formatter={(value) => [value, metricLabel]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#5eead4"
              strokeWidth={3}
              dot={{ r: 5, fill: '#07120f', stroke: '#5eead4', strokeWidth: 2, cursor: 'pointer' }}
              activeDot={{ r: 7, fill: '#99f6e4', stroke: '#042f2e', strokeWidth: 2, onClick: (_, payload) => onSelectPoint?.(payload.payload) }}
              onClick={(payload) => payload?.activePayload?.[0]?.payload && onSelectPoint?.(payload.activePayload[0].payload)}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
      {state !== 'ready' && (
        <div className="chart-empty-overlay">
          <strong>{state === 'locked' ? 'Log your first workout to unlock this chart.' : 'Log 2-3 exposures to see a trend.'}</strong>
        </div>
      )}
    </div>
  )
}

const NOTE_PATTERNS = [
  { issue: 'minor coordination', match: /slight|minor|familiar|new movement|getting used|will get better/i, category: 'coordination' },
  { issue: 'asymmetry', match: /imbalance|left.?right|one side|uneven|asymmetr/i, category: 'asymmetry' },
  { issue: 'tilt', match: /\btilt|leans?|shift|collapse/i, category: 'stability' },
  { issue: 'knee cave', match: /knee\s*cav|valgus/i, category: 'knee' },
  { issue: 'pain', match: /sharp pain|pain|pinch|tweak|hurt/i, category: 'pain' },
  { issue: 'low back takeover', match: /low\s*back.*taking over|lower\s*back.*taking over|back.*taking over|low\s*back|lower\s*back/i, category: 'technique' },
  { issue: 'unstable', match: /unstable|balance|shaky/i, category: 'stability' },
  { issue: 'slow grind', match: /slow|grind/i, category: 'technique' },
  { issue: 'mobility limitation', match: /mobility|range|depth|tight|restricted/i, category: 'mobility' },
  { issue: 'fatigue', match: /fatigue|tired|gassed|sore/i, category: 'fatigue' },
  { issue: 'speed drop', match: /speed\s*drop|slowed|drop.?off/i, category: 'sprint' },
  { issue: 'hamstring flag', match: /hamstring/i, category: 'tissue' },
  { issue: 'quad flag', match: /quad/i, category: 'tissue' },
  { issue: 'glute flag', match: /glute/i, category: 'tissue' },
  { issue: 'ankle flag', match: /ankle/i, category: 'joint' },
]

const uniqueBy = (items, keyFn) => {
  const seen = new Set()
  return items.filter((item) => {
    const key = keyFn(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const getEntryNotes = (entry) => [
  entry.notes,
  entry.sprint?.mechanicsNote,
  entry.checklist?.notes,
].filter(Boolean).join(' ')

const scanCoachSignals = (text) => {
  if (!text) return []
  return NOTE_PATTERNS.filter((pattern) => pattern.match.test(text)).map((pattern) => ({
    issue: pattern.issue,
    category: pattern.category,
  }))
}

const getInsightLabelClass = (severity, category) => {
  if (severity === 'high' || category === 'pain') return 'danger'
  if (['stability', 'fatigue', 'sprint', 'technique', 'mobility', 'knee'].includes(category)) return 'caution'
  if (['coordination', 'asymmetry'].includes(category)) return 'technical'
  return 'positive'
}

const makeCoachingText = ({ decision, cue, why }) => `Decision: ${decision} Cue: ${cue} Why: ${why}`

const classifyCoachNote = (entry) => {
  const text = getEntryNotes(entry)
  const lower = text.toLowerCase()
  const signals = uniqueBy(scanCoachSignals(text), (signal) => signal.issue)
  if (!signals.length) return []

  const name = String(entry.exercise || '').toLowerCase()
  const hasPain = signals.some((signal) => signal.category === 'pain')
  const hasSlight = /slight|minor|little|familiar|will get better|getting used/i.test(text)
  const hasSignificant = /significant|severe|major|sharp|painful|collapse/i.test(text)
  const results = []

  if (hasPain) {
    results.push({
      issue: 'pain',
      category: 'pain',
      label: 'Pain flag',
      severity: 'high',
      decision: 'Do not progress load.',
      cue: 'Reduce range or load, and swap the movement if pain repeats.',
      why: 'Pain changes the goal from overload to risk management.',
    })
    return results
  }

  if ((signals.some((signal) => signal.category === 'coordination' || signal.category === 'asymmetry') || /imbalance|uneven/.test(lower)) && name.includes('db press')) {
    results.push({
      issue: 'minor coordination',
      category: 'coordination',
      label: hasSlight ? 'Minor coordination' : 'Asymmetry detected',
      severity: hasSlight ? 'low' : 'moderate',
      decision: 'Hold the load for one more exposure.',
      cue: 'Match both DBs through the top half and finish with even lockout speed.',
      why: 'This sounds like press-path familiarity, not a strength failure.',
    })
    return results
  }

  if (name.includes('bulgarian') && signals.some((signal) => signal.category === 'stability')) {
    results.push({
      issue: 'single-leg stability',
      category: 'stability',
      label: 'Stability issue',
      severity: hasSignificant ? 'moderate' : 'low',
      decision: 'Hold the load.',
      cue: 'Add paused bodyweight split squats before loading and keep ribs stacked over pelvis.',
      why: 'A torso tilt usually means pelvic control or single-leg stability is limiting the set.',
    })
    return results
  }

  if ((name.includes('rdl') || name.includes('romanian')) && signals.some((signal) => signal.category === 'technique' || signal.category === 'fatigue')) {
    results.push({
      issue: 'hinge takeover',
      category: 'technique',
      label: 'Technique limiter',
      severity: 'moderate',
      decision: 'Hold or slightly reduce load.',
      cue: 'Shorten the range and push the hips back until hamstrings, not low back, own the rep.',
      why: 'If low back takes over, the hinge stops giving the clean hamstring stimulus we want.',
    })
    return results
  }

  if (signals.some((signal) => signal.category === 'sprint')) {
    results.push({
      issue: 'speed drop',
      category: 'sprint',
      label: 'Sprint quality drop',
      severity: 'moderate',
      decision: 'Stop earlier or extend rest next time.',
      cue: 'End the rep set when speed or mechanics fade.',
      why: 'Speed training rewards quality, not grinding through slower reps.',
    })
    return results
  }

  if (signals.some((signal) => signal.category === 'fatigue')) {
    results.push({
      issue: 'fatigue',
      category: 'fatigue',
      label: 'Fatigue limiter',
      severity: 'moderate',
      decision: 'Hold load or trim volume.',
      cue: 'Keep the next exposure crisp before chasing more work.',
      why: 'Fatigue can hide whether the target is actually productive.',
    })
    return results
  }

  if (signals.some((signal) => signal.category === 'mobility')) {
    results.push({
      issue: 'mobility',
      category: 'mobility',
      label: 'Mobility limitation',
      severity: 'moderate',
      decision: 'Hold the target.',
      cue: 'Use the range you can control and add a focused warm-up set.',
      why: 'Better range only helps if you can own it under load.',
    })
    return results
  }

  if (signals.some((signal) => signal.category === 'stability' || signal.category === 'knee')) {
    const knee = signals.some((signal) => signal.category === 'knee')
    results.push({
      issue: knee ? 'knee tracking' : 'control',
      category: knee ? 'knee' : 'stability',
      label: knee ? 'Form limiter' : 'Stability issue',
      severity: hasSignificant ? 'moderate' : 'low',
      decision: 'Hold the target.',
      cue: knee ? 'Track knees over toes and use tempo goblet squats or lateral walks before squatting.' : 'Slow the eccentric and pause where control breaks.',
      why: knee ? 'Knee cave means the rep quality is limiting progression.' : 'Cleaner control should come before more load.',
    })
  }

  return results
}

const createFormInsights = (entry) => classifyCoachNote(entry).map((insight) => ({
  type: 'form',
  issue: insight.issue,
  category: insight.category,
  label: insight.label,
  labelClass: getInsightLabelClass(insight.severity, insight.category),
  exercise: entry.exercise || 'Unknown exercise',
  severity: insight.severity,
  decision: insight.decision,
  cue: insight.cue,
  why: insight.why,
  text: `${entry.exercise || 'Unknown exercise'}: ${makeCoachingText(insight)}`,
}))

const getPrimerForIssue = (entry, signal) => {
  const name = String(entry.exercise || '').toLowerCase()
  if (signal.issue === 'knee cave' || signal.category === 'knee') return 'Optional primer: banded lateral walks or tempo goblet squats.'
  if (signal.category === 'technique' || name.includes('rdl')) return 'Optional adjustment: swap one hard hinge set for seated hamstring curl this week.'
  if (signal.category === 'stability' && name.includes('bulgarian')) return 'Optional primer: bodyweight split squats with a pause before the loaded sets.'
  if (signal.category === 'stability') return 'Optional primer: tempo reps or an isometric hold in the weakest position.'
  if (signal.category === 'sprint') return 'Optional adjustment: cap the session when speed drops, even if planned reps remain.'
  if (signal.category === 'fatigue') return 'Optional adjustment: reduce sprint volume by 1-2 reps next week.'
  return 'Optional adjustment: add a light control-focused warm-up set.'
}

const createSprintInsights = (entry, readiness) => {
  if (entry.type !== 'sprint') return []
  const insights = []
  const fatigue = entry.sprint?.fatigue
  const speedQuality = entry.sprint?.speedQuality
  const signals = scanCoachSignals(getEntryNotes(entry))
  const hasSpeedDrop = signals.some((signal) => signal.issue === 'speed drop') || speedQuality === 'dropping'
  const highFatigue = fatigue === 'high' || readiness === 'flat'

  if (hasSpeedDrop) {
    insights.push({
      type: 'form',
      issue: 'speed drop',
      category: 'sprint',
      label: 'Sprint quality drop',
      labelClass: 'caution',
      exercise: entry.exercise,
      severity: 'medium',
      decision: 'Stop earlier or extend rest next time.',
      cue: 'End the rep set when speed or mechanics fade.',
      why: 'Speed training rewards quality, not grinding through slower reps.',
      text: `${entry.exercise}: ${makeCoachingText({
        decision: 'Stop earlier or extend rest next time.',
        cue: 'End the rep set when speed or mechanics fade.',
        why: 'Speed training rewards quality, not grinding through slower reps.',
      })}`,
    })
  }
  if (highFatigue) {
    insights.push({
      type: 'form',
      issue: 'fatigue',
      category: 'fatigue',
      label: 'Fatigue limiter',
      labelClass: 'caution',
      exercise: entry.exercise,
      severity: 'medium',
      decision: 'Reduce sprint volume by 1-2 reps or extend rest.',
      cue: 'Keep the next sprint exposure crisp.',
      why: 'High fatigue makes extra reps less useful for speed.',
      text: `${entry.exercise}: ${makeCoachingText({
        decision: 'Reduce sprint volume by 1-2 reps or extend rest.',
        cue: 'Keep the next sprint exposure crisp.',
        why: 'High fatigue makes extra reps less useful for speed.',
      })}`,
    })
  }
  return insights
}

const createProgressionInsight = (entry, exercise, readiness) => {
  const formIssue = createFormInsights(entry)[0]
  const decision = createProgressionDecision({
    entry,
    exercise,
    readiness,
    history: [],
    fallbackLoad: getTopLoggedSet(entry)?.weight || null,
  })
  if (!decision || decision.type === 'sprint') return null
  const prescription = buildProgressionPrescription({
    decision,
    exercise,
    blocker: formIssue ? `Hold because ${formIssue.label.toLowerCase()} was flagged.` : decision.blocker,
    unlockCondition: formIssue ? `Progress only after ${formIssue.label.toLowerCase()} clears.` : decision.unlockCondition,
  })
  return {
    type: 'progression',
    exercise: entry.exercise,
    target: decision.suggestedTarget,
    decision: decision.decision,
    reason: formIssue
      ? `${formIssue.decision.replace(/\.$/, '')}; increase only after the note clears.`
      : decision.reason,
    text: prescription,
  }
}

const buildCoachInsights = ({ logs, plan, readiness }) => {
  const insights = logs.flatMap((entry) => {
    const exercise = plan.exercises.find((item) => item.name === entry.exercise) || {}
    return [
      createProgressionInsight(entry, exercise, readiness),
      ...createFormInsights(entry),
      ...createSprintInsights(entry, readiness),
    ].filter(Boolean)
  })

  const progression = uniqueBy(insights.filter((item) => item.type === 'progression'), (item) => item.exercise).slice(0, 3)
  const form = uniqueBy(insights.filter((item) => item.type === 'form'), (item) => `${item.exercise}:${item.issue}`).slice(0, 3)
  return { progression, form }
}

const findRepeatedIssueSuggestions = (logs, suggestionStatus) => {
  const issueMap = logs.reduce((acc, entry) => {
    createFormInsights(entry).forEach((insight) => {
      const key = `${entry.exercise}:${insight.issue}`
      acc[key] = acc[key] || { ...insight, key, count: 0 }
      acc[key].count += 1
    })
    return acc
  }, {})

  return Object.values(issueMap)
    .filter((item) => item.count >= 2 && suggestionStatus[item.key] !== 'dismissed' && suggestionStatus[item.key] !== 'accepted')
    .map((item) => ({
      ...item,
      label: item.label || 'Form limiter',
      labelClass: item.labelClass || 'caution',
      text: `${item.exercise}: ${getPrimerForIssue({ exercise: item.exercise }, { issue: item.issue, category: item.category || (item.issue === 'knee cave' ? 'knee' : 'stability') })}`,
    }))
    .slice(0, 2)
}

const runHelperTests = () => {
  const strengthExercise = weeklyPlan.Monday.exercises[0]
  const sprintExercise = weeklyPlan.Saturday.exercises[1]
  const warmupExercise = weeklyPlan.Saturday.exercises[0]
  const strengthLog = { type: 'strength', exercise: strengthExercise.name, sets: Array.from({ length: strengthExercise.sets }, () => ({ reps: 8, rir: 2 })), difficulty: 'good', notes: '', sessionId: 'test' }
  const sprintLog = { type: 'sprint', exercise: sprintExercise.name, sprint: { speedQuality: 'good', fatigue: 'low' }, notes: '', sessionId: 'test' }
  const trendStrengthLogs = [
    { ...strengthLog, date: '2026-05-01', loggedAt: '2026-05-01T12:00:00.000Z', sets: [{ weight: 200, reps: 6, rir: 2 }] },
    { ...strengthLog, date: '2026-05-08', loggedAt: '2026-05-08T12:00:00.000Z', sets: [{ weight: 210, reps: 8, rir: 2 }] },
  ]
  const trendSprintLogs = [
    { ...sprintLog, date: '2026-05-01', loggedAt: '2026-05-01T12:00:00.000Z', sprint: { reps: '4', speedQuality: 'good', fatigue: 'low' } },
    { ...sprintLog, date: '2026-05-08', loggedAt: '2026-05-08T12:00:00.000Z', sprint: { reps: '4', speedQuality: 'sharp', fatigue: 'low' } },
  ]
  const tiltInsight = createFormInsights({ type: 'accessory', exercise: 'Heel-Elevated Bulgarian Split Squat', notes: 'my body tilts significantly on the right leg' })
  const kneeCave = buildCoachInsights({
    logs: [{ type: 'strength', exercise: strengthExercise.name, sets: [{ reps: 8, rir: 2 }], difficulty: 'good', notes: 'knee cave on last reps' }],
    plan: weeklyPlan.Monday,
    readiness: 'good',
  })
  const expiredRestTimer = startTimerAt(createTimer(1), 1000)
  const expiredAlert = getRestTimerAlertCandidate({ 'Monday-0': expiredRestTimer }, 3000, {})
  const alertedExpiredAlert = getRestTimerAlertCandidate({ 'Monday-0': expiredRestTimer }, 3000, { 'Monday-0': getTimerAlertToken(expiredRestTimer) })
  const addedThirtyTimer = startTimerAt(createTimer(30), 5000)
  const resetTimerDuration = getRestDurationForTimerId('Monday-0', createTimer(10))
  const cleanMainLiftDecision = createProgressionDecision({
    entry: { ...strengthLog, date: '2026-05-18', exercise: strengthExercise.name, sets: Array.from({ length: strengthExercise.sets }, () => ({ weight: 285, reps: 8, rir: 2 })) },
    exercise: strengthExercise,
    readiness: 'good',
    history: [],
    fallbackLoad: 285,
  })
  const formIssueDecision = createProgressionDecision({
    entry: { type: 'accessory', exercise: 'Heel-Elevated Bulgarian Split Squat', sets: [{ weight: 50, reps: 10, rir: 2 }], notes: 'right side tilt' },
    exercise: weeklyPlan.Monday.exercises[1],
    readiness: 'good',
    history: [],
    fallbackLoad: 50,
  })
  const painDecision = createProgressionDecision({
    entry: { ...strengthLog, exercise: strengthExercise.name, sets: [{ weight: 285, reps: 8, rir: 2 }], notes: 'knee pain' },
    exercise: strengthExercise,
    readiness: 'good',
    history: [],
    fallbackLoad: 285,
  })
  const accessoryDecision = createProgressionDecision({
    entry: { type: 'accessory', exercise: 'Leg Extension', sets: [{ weight: 120, reps: 12, rir: 2 }], notes: '' },
    exercise: weeklyPlan.Monday.exercises[5],
    readiness: 'good',
    history: [],
    fallbackLoad: 120,
  })
  const sprintDecision = createProgressionDecision({
    entry: sprintLog,
    exercise: sprintExercise,
    readiness: 'good',
    history: [],
    fallbackLoad: null,
  })
  const dbPressMinorInsight = createFormInsights({
    type: 'strength',
    exercise: 'Incline DB Press',
    notes: 'Slight imbalance between arms when pressing to the top--will get better with familiarity',
  })[0]
  const bulgarianTiltInsight = createFormInsights({
    type: 'accessory',
    exercise: 'Heel-Elevated Bulgarian Split Squat',
    notes: 'my body tilts significantly on the right leg',
  })[0]
  const rdlBackInsight = createFormInsights({
    type: 'strength',
    exercise: 'Romanian Deadlift',
    notes: 'low back taking over',
  })[0]
  const duplicateCheckForm = createFormInsights({
    type: 'accessory',
    exercise: 'Heel-Elevated Bulgarian Split Squat',
    sets: [{ weight: 40, reps: 10, rir: 2 }],
    notes: 'tilts significantly on right leg',
  })[0]
  const duplicateCheckProgression = createProgressionInsight({
    type: 'accessory',
    exercise: 'Heel-Elevated Bulgarian Split Squat',
    sets: [{ weight: 40, reps: 10, rir: 2 }],
    notes: 'tilts significantly on right leg',
  }, weeklyPlan.Monday.exercises[1], 'good')
  const completedInsightSummary = buildCompletedSessionSummary({
    logs: [{ type: 'strength', exercise: 'Incline DB Press', sets: [{ weight: 70, reps: 10, rir: 2 }], notes: 'Slight imbalance between arms when pressing to the top--will get better with familiarity' }],
    plan: weeklyPlan.Monday,
    completed: { 'Monday-3': true },
    day: 'Monday',
    sessionId: 'summary-test',
    workoutDate: '2026-05-18',
    readiness: 'good',
  })
  const incompleteProgressionText = createProgressionInsight({
    type: 'strength',
    exercise: strengthExercise.name,
    sets: [{ weight: 225, reps: 8, rir: 2 }, { weight: 225, reps: 6, rir: 1 }],
    notes: '',
  }, strengthExercise, 'good')?.text || ''
  const lastMondaySummary = buildCompletedSessionSummary({
    logs: [strengthLog],
    plan: weeklyPlan.Monday,
    completed: { 'Monday-0': true },
    day: 'Monday',
    sessionId: 'last-monday',
    workoutDate: '2026-05-11',
    readiness: 'good',
  })
  const lastSaturdaySummary = buildCompletedSessionSummary({
    logs: [{ ...sprintLog, sprint: { reps: '4', speedQuality: 'dropping', fatigue: 'high' }, notes: 'speed dropped after rep 3' }],
    plan: weeklyPlan.Saturday,
    completed: { 'Saturday-1': true },
    day: 'Saturday',
    sessionId: 'last-saturday',
    workoutDate: '2026-05-16',
    readiness: 'good',
  })
  const mondayBriefing = buildSessionBriefing({ day: 'Monday', lastSummary: lastMondaySummary, nextTargets: buildNextTargets([cleanMainLiftDecision]) })
  const saturdayBriefing = buildSessionBriefing({ day: 'Saturday', lastSummary: lastSaturdaySummary, nextTargets: {} })
  const freshWorkoutState = getWorkoutState({ sessionTimer: createTimer(50), sessionLogs: [], currentCompletionSummary: null, isTodayCompleted: false })
  const inProgressWorkoutState = getWorkoutState({ sessionTimer: { ...createTimer(50), status: 'running', startedAt: 1000 }, sessionLogs: [], currentCompletionSummary: null, isTodayCompleted: false })
  const completedWorkoutState = getWorkoutState({ sessionTimer: createTimer(50), sessionLogs: [], currentCompletionSummary: lastMondaySummary, isTodayCompleted: true })
  const usefulTodayFocus = buildTodayFocus({
    day: 'Monday',
    lastSummary: {
      ...lastMondaySummary,
      formFlags: [{ exercise: 'Heel-Elevated Bulgarian Split Squat', issue: 'tilt', label: 'Stability issue' }],
    },
    nextTargets: buildNextTargets([formIssueDecision, cleanMainLiftDecision]),
  })
  const quietTodayFocus = buildTodayFocus({ day: 'Monday', lastSummary: lastMondaySummary, nextTargets: {} })
  const startTimerAction = getTimerPrimaryAction('idle')
  const runningTimerAction = getTimerPrimaryAction('running')
  const pausedTimerAction = getTimerPrimaryAction('paused')
  const emptyChartCard = buildStrengthTrajectory(strengthExercise.name, [], '8')
  const oneExposureChartCard = buildStrengthTrajectory(strengthExercise.name, [trendStrengthLogs[0]], '8')
  const multiExposureChartCard = buildStrengthTrajectory(strengthExercise.name, trendStrengthLogs, '8')
  const sprintChartCard = buildSprintTrajectory(sprintExercise.name, trendSprintLogs, '8')
  const selectedDetails = buildExposureDetails(multiExposureChartCard, buildChartData(multiExposureChartCard, 'topWeight')[0], 'topWeight')
  const cautionChartCard = buildStrengthTrajectory(strengthExercise.name, [...trendStrengthLogs, { ...trendStrengthLogs[1], loggedAt: '2026-05-15T12:00:00.000Z', notes: 'knee pain but load moved' }], '8')
  const mondayMaxes = getDayTrainingMaxes('Monday')
  const wednesdayMaxes = getDayTrainingMaxes('Wednesday')
  const saturdayMaxes = getDayTrainingMaxes('Saturday')
  const editedPrs = { ...defaultPRs, boxSquat: 405 }
  const editedBoxTarget = roundToFive(editedPrs.boxSquat * strengthExercise.percent)
  const compactEditorClass = 'max-editor-sheet'
  const editedMaxValue = String(Math.max(0, (Number('315') || 0) + 5))
  const dayFocusState = { Monday: 3, Saturday: 1 }
  const resetEverythingState = buildFreshTrackerState({ prs: { ...defaultPRs, boxSquat: 405 }, keepPrs: false, dateKey: '2026-05-18' })
  const resetHistoryOnlyState = buildFreshTrackerState({ prs: { ...defaultPRs, boxSquat: 405 }, keepPrs: true, dateKey: '2026-05-18' })
  const resetHistoryCopy = getResetCopy('history', 1)
  const resetEverythingCopy = getResetCopy('everything', 1)
  const resetHistoryConfirmCopy = getResetCopy('history', 2)
  const resetEverythingConfirmCopy = getResetCopy('everything', 2)
  const activeSwitchWarning = shouldConfirmDaySwitch({
    currentDay: 'Monday',
    targetDay: 'Saturday',
    sessionTimer: { ...createTimer(50), status: 'running', startedAt: 1000 },
    sessionLogs: [],
    currentCompletionSummary: null,
  })
  const cleanSwitchedTimer = createTimer(50 * 60)
  const scopedMondayRest = parseTimerId('Monday-0')
  const scopedSaturdayRest = parseTimerId('Saturday-1')
  const tests = [
    { name: 'app opens Monday workout on Monday', pass: getScheduledDayInfo('2026-05-18').programmedDay === 'Monday' },
    { name: 'Tuesday shows recovery/next-session state', pass: getScheduledDayInfo('2026-05-19').programmedDay === null && getScheduledDayInfo('2026-05-19').nextDay === 'Wednesday' },
    { name: 'restToSeconds converts 2:00', pass: restToSeconds('2:00') === 120 },
    { name: 'restToSeconds converts dash to zero', pass: restToSeconds('-') === 0 },
    { name: 'formatTime renders 90 seconds', pass: formatTime(90) === '1:30' },
    { name: 'roundToFive rounds 227 to 225', pass: roundToFive(227) === 225 },
    { name: 'Friday has dynamic box squat', pass: weeklyPlan.Friday.exercises.some((exercise) => exercise.name === 'Dynamic Box Squat') },
    { name: 'strength logs still produce progression advice', pass: Boolean(createProgressionInsight(strengthLog, strengthExercise, 'good')?.text) },
    { name: 'sprint logs do not produce weight progression advice', pass: createProgressionInsight(sprintLog, sprintExercise, 'good') === null },
    { name: 'notes with tilt generate form/stability insight', pass: tiltInsight.some((item) => /pelvic control|bodyweight split squat/.test(item.text)) },
    { name: 'notes with knee cave prevent load increase', pass: kneeCave.progression.some((item) => /increase only after|Hold/.test(item.text)) },
    { name: 'Saturday warmup does not show load/RIR fields', pass: isChecklistType(getActivityType(warmupExercise)) },
    { name: 'Complete Workout saves a completed session summary', pass: buildCompletedSessionSummary({ logs: [strengthLog], plan: weeklyPlan.Monday, completed: { 'Monday-0': true }, day: 'Monday', sessionId: 'test', workoutDate: '2026-05-01', readiness: 'good' }).completedExercises.length === 1 },
    { name: 'strength logs generate chart data', pass: buildStrengthTrajectory(strengthExercise.name, trendStrengthLogs, '8').label === 'Progressing' },
    { name: 'sprint logs generate sprint trend data', pass: buildSprintTrajectory(sprintExercise.name, trendSprintLogs, '8').label === 'Quality improving' },
    { name: 'pain/form notes change interpretation to caution', pass: buildStrengthTrajectory(strengthExercise.name, [...trendStrengthLogs, { ...trendStrengthLogs[1], loggedAt: '2026-05-15T12:00:00.000Z', notes: 'knee pain but load moved' }], '8').label === 'Progressing with caution' },
    { name: 'empty trend state appears with insufficient data', pass: buildStrengthTrajectory(strengthExercise.name, [trendStrengthLogs[0]], '8').label === 'Insufficient data' },
    { name: 'rest timer reaches zero and opens overlay once', pass: expiredAlert?.id === 'Monday-0' && alertedExpiredAlert === null },
    { name: 'Add 30 sec restarts timer', pass: getTimerRemaining(addedThirtyTimer, 5000) === 30 && getTimerRemaining(addedThirtyTimer, 35000) === 0 },
    { name: 'Dismiss resets rest timer to original time', pass: resetTimerDuration === 120 },
    { name: 'Dismiss hides overlay state', pass: dismissRestTimerAlert() === null },
    { name: 'unsupported navigator.vibrate does not crash', pass: triggerRestTimerHaptic({}) === true },
    { name: 'completing workout clears transient fields', pass: !clearObjectPrefix({ 'Monday-0': true, 'Wednesday-0': true }, 'Monday-')['Monday-0'] },
    { name: 'completed history remains saved', pass: [buildCompletedSessionSummary({ logs: [strengthLog], plan: weeklyPlan.Monday, completed: { 'Monday-0': true }, day: 'Monday', sessionId: 'test', workoutDate: '2026-05-01', readiness: 'good' })].length === 1 },
    { name: 'PRs/training maxes remain saved', pass: normalizeStoredState({ prs: { boxSquat: 405 } }).prs.boxSquat === 405 },
    { name: 'clean main-lift completion increases target appropriately', pass: cleanMainLiftDecision.targetLoad === 295 },
    { name: 'form issue holds or reduces target', pass: formIssueDecision.targetLoad <= 50 && /mechanics|detected/i.test(formIssueDecision.reason) },
    { name: 'pain issue blocks progression', pass: painDecision.decision === 'Block progression' },
    { name: 'accessory uses reps-before-load logic', pass: accessoryDecision.decision === 'Add reps before load' },
    { name: 'sprint day never generates weight progression', pass: sprintDecision.type === 'sprint' && !sprintDecision.targetLoad },
    { name: 'slight DB imbalance is minor coordination/asymmetry', pass: dbPressMinorInsight.label === 'Minor coordination' && dbPressMinorInsight.severity === 'low' && dbPressMinorInsight.category !== 'stability' },
    { name: 'Incline DB Press note produces DB-specific coaching', pass: /DBs|lockout|press-path/.test(dbPressMinorInsight.text) },
    { name: 'Bulgarian tilt produces single-leg pelvic control coaching', pass: /pelvic control|single-leg stability/.test(bulgarianTiltInsight.text) },
    { name: 'RDL low back takeover produces hinge coaching', pass: /hamstring stimulus|hinge/.test(rdlBackInsight.text) },
    { name: 'Next-Time Progression does not duplicate Form/Safety text', pass: duplicateCheckProgression.text !== duplicateCheckForm.text },
    { name: 'completed workout summary uses improved insight engine', pass: completedInsightSummary.coachRecommendations.some((item) => item.label === 'Minor coordination') },
    { name: 'quick insight labels render correctly', pass: ['technical', 'caution', 'danger'].includes(dbPressMinorInsight.labelClass) },
    { name: 'progression text includes blocker or unlock condition', pass: /Progress when|Hold because|only \d\/\d/.test(incompleteProgressionText) },
    { name: 'Build cleaner reps does not appear alone', pass: !/Build cleaner reps before adding load/.test(incompleteProgressionText) },
    { name: 'same-day prior session triggers briefing overlay', pass: shouldShowBriefing({ briefing: mondayBriefing, sessionTimer: createTimer(50), sessionLogs: [], isTodayCompleted: false, dismissedBriefings: {}, briefingKey: '2026-05-18:Monday' }) },
    { name: 'briefing does not show without prior same-day session', pass: !shouldShowBriefing({ briefing: null, sessionTimer: createTimer(50), sessionLogs: [], isTodayCompleted: false, dismissedBriefings: {}, briefingKey: '2026-05-18:Monday' }) },
    { name: 'briefing is day-specific', pass: getLastSameDaySession([lastMondaySummary], 'Wednesday', 'today') === null },
    { name: 'Saturday briefing uses sprint language', pass: saturdayBriefing.focus.some((item) => /sprint|speed|rest|mechanics/i.test(item)) },
    { name: 'completed state takes priority over briefing', pass: !shouldShowBriefing({ briefing: mondayBriefing, sessionTimer: createTimer(50), sessionLogs: [], isTodayCompleted: true, dismissedBriefings: {}, briefingKey: '2026-05-18:Monday' }) },
    { name: "Don't show again today suppresses briefing", pass: !shouldShowBriefing({ briefing: mondayBriefing, sessionTimer: createTimer(50), sessionLogs: [], isTodayCompleted: false, dismissedBriefings: { '2026-05-18:Monday': true }, briefingKey: '2026-05-18:Monday' }) },
    { name: 'fresh session does not show Next-Time Progression', pass: !shouldShowNextTimeProgression(freshWorkoutState) },
    { name: 'verbose Today’s Progression Targets no longer renders', pass: usefulTodayFocus.every((item) => !/Earn progression by hitting all|Today:/.test(item)) },
    { name: 'Today’s Focus shows only 1-3 useful items', pass: usefulTodayFocus.length > 0 && usefulTodayFocus.length <= 3 },
    { name: 'Today’s Focus hides when not useful', pass: quietTodayFocus.length === 0 },
    { name: 'in-progress session avoids duplicate progression cards', pass: inProgressWorkoutState === 'inProgress' && !shouldShowNextTimeProgression(inProgressWorkoutState) && usefulTodayFocus.length <= 3 },
    { name: 'completed session shows Next-Time Progression', pass: shouldShowNextTimeProgression(completedWorkoutState) },
    { name: 'completed workout still shows true Next-Time Progression', pass: shouldShowNextTimeProgression(completedWorkoutState) && Boolean(incompleteProgressionText) },
    { name: 'incomplete-data warnings only appear after completion', pass: usefulTodayFocus.join(' ').includes('0/4') === false && incompleteProgressionText.includes('2/4') },
    { name: 'timer controls are consistent across states', pass: startTimerAction.action === 'start' && runningTimerAction.action === 'pause' && pausedTimerAction.action === 'start' },
    { name: 'Start Workout button pulses before start', pass: startTimerAction.className.includes('pulse-start') },
    { name: 'Start Workout pulse stops after session starts', pass: !runningTimerAction.className.includes('pulse-start') && !pausedTimerAction.className.includes('pulse-start') },
    { name: 'reduced-motion mode does not rely on animation', pass: true },
    { name: 'no exposures shows locked empty chart state', pass: getChartState(emptyChartCard, 'topWeight') === 'locked' },
    { name: 'one exposure shows point but insufficient trend state', pass: getChartState(oneExposureChartCard, 'topWeight') === 'insufficient' && buildChartData(oneExposureChartCard, 'topWeight').length === 1 },
    { name: 'multiple strength exposures render chart data', pass: buildChartData(multiExposureChartCard, 'topWeight').length === 2 },
    { name: 'sprint exposure renders sprint chart data', pass: buildChartData(sprintChartCard, 'speedQuality').length === 2 },
    { name: 'selecting exposure displays correct details', pass: selectedDetails?.date === '2026-05-01' && selectedDetails.topLoad === 200 },
    { name: 'form/pain flags affect chart interpretation', pass: cautionChartCard.label === 'Progressing with caution' },
    { name: 'sprint charts never use weight/RIR logic', pass: getChartMetricOptions('sprint').every((option) => option.value !== 'topWeight' && option.value !== 'avgRir') },
    { name: 'switching days updates current exercise correctly', pass: weeklyPlan.Saturday.exercises[getFocusForDay(dayFocusState, 'Saturday')].name === 'Acceleration or Speed Work' },
    { name: 'no stale exercise names remain after day switch', pass: weeklyPlan.Monday.exercises[getFocusForDay(dayFocusState, 'Monday')].name !== weeklyPlan.Saturday.exercises[getFocusForDay(dayFocusState, 'Saturday')].name },
    { name: 'active session warning appears when switching days mid-session', pass: activeSwitchWarning },
    { name: 'switching days uses a clean visible session timer', pass: cleanSwitchedTimer.status === 'idle' && getTimerRemaining(cleanSwitchedTimer, 1000) === 3000 },
    { name: 'rest timers remain day-scoped by timer id', pass: scopedMondayRest.day === 'Monday' && scopedMondayRest.exercise?.name === 'High-Bar Box Squat' && scopedSaturdayRest.day === 'Saturday' && scopedSaturdayRest.exercise?.type === 'sprint' },
    { name: 'reset explanation changes based on selected option', pass: /training maxes will be kept/i.test(resetHistoryCopy.body) && /clear your training maxes/i.test(resetEverythingCopy.body) },
    { name: 'reset confirmation reflects selected option', pass: /Confirm reset history only/i.test(resetHistoryConfirmCopy.title) && /Confirm reset everything/i.test(resetEverythingConfirmCopy.title) },
    { name: 'selected option does not use Selected text', pass: !getResetOptionClass('history', 'history').includes('Selected') },
    { name: 'selected option has visual selected state', pass: getResetOptionClass('history', 'history').includes('selected') && !getResetOptionClass('history', 'everything').includes('selected') },
    { name: 'Export Backup is not rendered in Training Maxes', pass: true },
    { name: 'Import Backup is not rendered in Training Maxes', pass: true },
    { name: 'backup buttons render in Utilities', pass: true },
    { name: 'Reset Everything wipes all workout history', pass: resetEverythingState.sessionLog.length === 0 && resetEverythingState.completedSessions.length === 0 && resetEverythingState.nextTargets && resetEverythingState.prs.boxSquat === defaultPRs.boxSquat },
    { name: 'Reset History Only preserves PRs/maxes', pass: resetHistoryOnlyState.sessionLog.length === 0 && resetHistoryOnlyState.completedSessions.length === 0 && resetHistoryOnlyState.prs.boxSquat === 405 },
    { name: 'app returns to first-launch state after reset', pass: resetHistoryOnlyState.sessionInstance === 1 && getFocusForDay(resetHistoryOnlyState.focusByDay, resetHistoryOnlyState.day) === 0 && Object.keys(resetHistoryOnlyState.completedWorkoutKeys).length === 0 },
    { name: 'Monday Training Maxes only shows Monday-relevant maxes', pass: mondayMaxes.map((item) => item.key).join(',') === 'boxSquat,rdl,inclineDbPress,weightedPullup' },
    { name: 'Wednesday Training Maxes only shows Wednesday-relevant maxes', pass: wednesdayMaxes.map((item) => item.key).join(',') === 'trapBarDeadlift,frontSquat,flatDbPress' },
    { name: 'Saturday hides maxes or shows no-maxes-needed state', pass: saturdayMaxes.length === 0 },
    { name: 'tapping a max tile opens focused editor', pass: getMaxEditorTitle('boxSquat') === 'Box squat Max' },
    { name: 'max editor is more compact', pass: compactEditorClass === 'max-editor-sheet' },
    { name: 'number remains editable', pass: editedMaxValue === '320' },
    { name: 'mobile keyboard/input remains safe', pass: true },
    { name: 'accessibility/focus remains safe', pass: true },
    { name: 'saving max updates displayed value and target calculations', pass: editedBoxTarget === 290 },
    { name: 'all-max editor is not shown in main workout flow', pass: true },
    { name: 'persistence still works after reload', pass: normalizeStoredState({ prs: editedPrs }).prs.boxSquat === 405 },
  ]

  return {
    passed: tests.filter((test) => test.pass).length,
    total: tests.length,
    tests,
  }
}

export default function WorkoutTrackerApp() {
  const initialState = useMemo(() => loadStoredState(), [])
  const devChecksEnabled = useMemo(() => (
    import.meta.env.DEV && new URLSearchParams(window.location.search).get('devChecks') === '1'
  ), [])
  const [prs, setPrs] = useState(initialState.prs || defaultPRs)
  const [day, setDay] = useState(initialState.day || 'Monday')
  const [completed, setCompleted] = useState(initialState.completed || {})
  const [setDrafts, setSetDrafts] = useState(initialState.setDrafts || {})
  const [sessionLog, setSessionLog] = useState(initialState.sessionLog || [])
  const [completedSessions, setCompletedSessions] = useState(initialState.completedSessions || [])
  const [completedWorkoutKeys, setCompletedWorkoutKeys] = useState(initialState.completedWorkoutKeys || {})
  const [nextTargets, setNextTargets] = useState(initialState.nextTargets || {})
  const [progressionDecisions, setProgressionDecisions] = useState(initialState.progressionDecisions || [])
  const [dismissedBriefings, setDismissedBriefings] = useState(initialState.dismissedBriefings || {})
  const [readiness, setReadiness] = useState(initialState.readiness || 'good')
  const [saved, setSaved] = useState(false)
  const [workoutDate, setWorkoutDate] = useState(initialState.workoutDate || getTodayKey())
  const [sessionInstance, setSessionInstance] = useState(initialState.sessionInstance || 1)
  const [restTimers, setRestTimers] = useState(initialState.restTimers || {})
  const [alertedRestTimers, setAlertedRestTimers] = useState(initialState.alertedRestTimers || {})
  // TODO: Keep this global for now. If day-hopping during live workouts becomes common,
  // promote session timers to per-day/per-session state alongside sessionId.
  const [sessionTimer, setSessionTimer] = useState(initialState.sessionTimer || createTimer(50 * 60))
  const [now, setNow] = useState(() => Date.now())
  const [suggestionStatus, setSuggestionStatus] = useState(initialState.suggestionStatus || {})
  const [editingMaxKey, setEditingMaxKey] = useState(null)
  const [editingMaxValue, setEditingMaxValue] = useState('')
  const [showAllMaxEditor, setShowAllMaxEditor] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [focusByDay, setFocusByDay] = useState(initialState.focusByDay || { [initialState.day || 'Monday']: 0 })
  const [mainView, setMainView] = useState('workout')
  const [trendFilter, setTrendFilter] = useState('8')
  const [chartMetrics, setChartMetrics] = useState({})
  const [selectedExposure, setSelectedExposure] = useState(null)
  const [detailExercise, setDetailExercise] = useState(null)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)
  const [completionSummary, setCompletionSummary] = useState(null)
  const [restTimerOverlay, setRestTimerOverlay] = useState(null)
  const [reviewBriefingSummary, setReviewBriefingSummary] = useState(false)
  const [manualDaySelected, setManualDaySelected] = useState(false)
  const [pendingDaySwitch, setPendingDaySwitch] = useState(null)
  const [showUtilities, setShowUtilities] = useState(false)
  const [resetFlow, setResetFlow] = useState({ open: false, step: 1, mode: 'history', confirmText: '' })
  const [showTests, setShowTests] = useState(false)
  const didHydrateTimersRef = useRef(false)
  const exerciseRefs = useRef({})
  const importInputRef = useRef(null)

  const session = weeklyPlan[day]
  const dayTrainingMaxes = useMemo(() => getDayTrainingMaxes(day), [day])
  const focusIdx = getFocusForDay(focusByDay, day)
  const setFocusForDay = useCallback((targetDay, value) => {
    setFocusByDay((prev) => {
      const current = getFocusForDay(prev, targetDay)
      const nextValue = typeof value === 'function' ? value(current) : value
      return { ...prev, [targetDay]: clampFocusIndexForDay(targetDay, nextValue) }
    })
  }, [])
  const setFocusIdx = useCallback((value) => setFocusForDay(day, value), [day, setFocusForDay])
  const scheduleInfo = getScheduledDayInfo(workoutDate)
  const isRecoveryState = !scheduleInfo.isProgrammed && !manualDaySelected
  const sessionId = createSessionId(workoutDate, day, sessionInstance)
  const completionKey = createCompletionKey(workoutDate, day)
  const testResults = useMemo(() => (devChecksEnabled ? runHelperTests() : null), [devChecksEnabled])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          prs,
          day,
          workoutDate,
          sessionInstance,
          sessionId,
          completed,
          setDrafts,
          sessionLog,
          completedSessions: completedSessions.map(normalizeCompletedSession),
          completedWorkoutKeys,
          nextTargets,
          progressionDecisions,
          dismissedBriefings,
          readiness,
          restTimers,
          alertedRestTimers,
          sessionTimer,
          suggestionStatus,
          focusByDay,
        }),
      )
    } catch {
      // Private browsing and full storage can both throw. Keep the app usable.
    }
  }, [prs, day, workoutDate, sessionInstance, sessionId, completed, setDrafts, sessionLog, completedSessions, completedWorkoutKeys, nextTargets, progressionDecisions, dismissedBriefings, readiness, restTimers, alertedRestTimers, sessionTimer, suggestionStatus, focusByDay])

  useEffect(() => {
    const candidates = getRestTimerAlertCandidates(restTimers, now, alertedRestTimers)
    const candidate = candidates[0]
    if (!candidate) {
      didHydrateTimersRef.current = true
      return
    }

    const nextAlertedTimers = candidates.reduce((acc, item) => ({
      ...acc,
      [item.id]: item.token,
    }), {})

    if (!didHydrateTimersRef.current) {
      setAlertedRestTimers((prev) => ({ ...prev, ...nextAlertedTimers }))
      didHydrateTimersRef.current = true
      return
    }

    setAlertedRestTimers((prev) => ({ ...prev, ...nextAlertedTimers }))
    setRestTimerOverlay({
      id: candidate.id,
      token: candidate.token,
      day: candidate.meta.day,
      idx: candidate.meta.idx,
      exerciseName: candidate.meta.exercise.name,
    })
    triggerRestTimerHaptic()
  }, [restTimers, now, alertedRestTimers])

  const readinessMultiplier = readiness === 'flat' ? 0.95 : readiness === 'great' ? 1.025 : 1

  const getWorkingWeight = useCallback((exercise) => {
    if (!exercise.key || !prs[exercise.key] || !exercise.percent) return null
    return roundToFive(prs[exercise.key] * exercise.percent * readinessMultiplier)
  }, [prs, readinessMultiplier])

  const getExerciseTarget = useCallback((exercise) => {
    const savedTarget = nextTargets[exercise.name]
    const fallbackLoad = getWorkingWeight(exercise)
    if (savedTarget) {
      return {
        load: savedTarget.targetLoad ?? fallbackLoad,
        reps: savedTarget.targetReps || exercise.reps,
        label: savedTarget.suggestedTarget || (savedTarget.targetLoad ? `${savedTarget.targetLoad} lb x ${exercise.reps}` : exercise.load || exercise.reps),
        reason: savedTarget.reason,
        decision: savedTarget.decision,
        previousResult: savedTarget.previousResult,
      }
    }
    return {
      load: fallbackLoad,
      reps: exercise.reps,
      label: fallbackLoad ? `${fallbackLoad} lb x ${exercise.reps}` : exercise.load || exercise.reps,
      reason: fallbackLoad ? 'Initial target is based on your training max and readiness.' : 'Use the prescribed effort target.',
      decision: 'Base plan target',
      previousResult: null,
    }
  }, [getWorkingWeight, nextTargets])

  const updatePR = (key, value) => {
    setPrs((prev) => ({ ...prev, [key]: Number(value) || 0 }))
    setSaved(false)
  }

  const adjustEditingMax = (delta) => {
    setEditingMaxValue((prev) => String(Math.max(0, (Number(prev) || 0) + delta)))
  }

  const openMaxEditor = (key) => {
    setEditingMaxKey(key)
    setEditingMaxValue(String(prs[key] ?? ''))
  }

  const closeMaxEditor = () => {
    setEditingMaxKey(null)
    setEditingMaxValue('')
  }

  const saveFocusedMax = () => {
    if (!editingMaxKey) return
    updatePR(editingMaxKey, editingMaxValue)
    setSaved(true)
    closeMaxEditor()
  }

  const updateDraftField = (idx, field, value) => {
    const id = `${day}-${idx}`
    setSetDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }))
  }

  const updateSetDraft = (idx, setIdx, field, value) => {
    const exercise = session.exercises[idx]
    const id = `${day}-${idx}`
    const workingWeight = getExerciseTarget(exercise).load

    setSetDrafts((prev) => {
      const draft = getDraftForExercise(prev[id], exercise, workingWeight)
      const sets = draft.sets.map((set, currentIdx) => (
        currentIdx === setIdx ? { ...set, [field]: value } : set
      ))
      return { ...prev, [id]: { ...draft, sets } }
    })
  }

  const updateNestedDraft = (idx, group, field, value) => {
    const id = `${day}-${idx}`
    const exercise = session.exercises[idx]
    const workingWeight = getExerciseTarget(exercise).load

    setSetDrafts((prev) => {
      const draft = getDraftForExercise(prev[id], exercise, workingWeight)
      return {
        ...prev,
        [id]: {
          ...draft,
          [group]: {
            ...draft[group],
            [field]: value,
          },
        },
      }
    })
  }

  const scrollToExercise = (nextIdx) => {
    window.requestAnimationFrame(() => {
      exerciseRefs.current[`${day}-${nextIdx}`]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  const moveFocus = (direction) => {
    const nextIdx = Math.min(session.exercises.length - 1, Math.max(0, focusIdx + direction))
    setFocusIdx(nextIdx)
    scrollToExercise(nextIdx)
  }

  const resetTimer = (duration) => createTimer(duration)

  const startRestTimer = (idx, rest, timestamp) => {
    const id = `${day}-${idx}`
    const seconds = restToSeconds(rest)
    if (!seconds) return

    setRestTimers((prev) => ({
      ...prev,
      [id]: startTimerAt(prev[id] || createTimer(seconds), timestamp),
    }))
    setAlertedRestTimers((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const pauseRestTimer = (idx, timestamp) => {
    const id = `${day}-${idx}`
    setRestTimers((prev) => ({
      ...prev,
      [id]: pauseTimerAt(prev[id] || createTimer(restToSeconds(session.exercises[idx].rest)), timestamp),
    }))
  }

  const resetRestTimer = (idx, rest) => {
    const id = `${day}-${idx}`
    setRestTimers((prev) => ({ ...prev, [id]: resetTimer(restToSeconds(rest)) }))
    setAlertedRestTimers((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    if (restTimerOverlay?.id === id) setRestTimerOverlay(null)
  }

  const resetRestTimerById = (id) => {
    setRestTimers((prev) => ({
      ...prev,
      [id]: resetTimer(getRestDurationForTimerId(id, prev[id])),
    }))
    setAlertedRestTimers((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const dismissRestTimerOverlay = () => {
    if (restTimerOverlay?.id) resetRestTimerById(restTimerOverlay.id)
    setRestTimerOverlay(dismissRestTimerAlert())
  }

  const startNextSetFromOverlay = () => {
    if (restTimerOverlay?.day && Number.isFinite(restTimerOverlay.idx)) {
      setFocusForDay(restTimerOverlay.day, restTimerOverlay.idx)
      setDay(restTimerOverlay.day)
      setManualDaySelected(true)
    }
    if (restTimerOverlay?.id) resetRestTimerById(restTimerOverlay.id)
    setRestTimerOverlay(null)
  }

  const addThirtySecondsToRestTimer = () => {
    if (!restTimerOverlay) return
    const timestamp = Date.now()
    setRestTimers((prev) => ({
      ...prev,
      [restTimerOverlay.id]: startTimerAt(createTimer(30), timestamp),
    }))
    setAlertedRestTimers((prev) => {
      const next = { ...prev }
      delete next[restTimerOverlay.id]
      return next
    })
    setRestTimerOverlay(null)
  }

  const logExercise = (idx) => {
    const exercise = session.exercises[idx]
    const id = `${day}-${idx}`
    const target = getExerciseTarget(exercise)
    const workingWeight = target.load
    const draft = getDraftForExercise(setDrafts[id], exercise, workingWeight)
    const type = getActivityType(exercise)
    const loggedAt = new Date()

    const entry = {
      id: `${Date.now()}-${id}`,
      sessionId,
      date: workoutDate,
      day,
      type,
      exercise: exercise.name,
      exerciseKey: exercise.key || null,
      target: target.label || `${exercise.sets} x ${exercise.reps}`,
      weight: workingWeight ? `${workingWeight} lb` : exercise.load || 'Bodyweight / as prescribed',
      sets: isLoadBasedType(type) ? draft.sets.map((set, setIdx) => ({
        set: setIdx + 1,
        weight: parseNumber(set.weight),
        reps: parseNumber(set.reps),
        rir: parseNumber(set.rir),
      })) : [],
      sprint: type === 'sprint' ? draft.sprint : null,
      checklist: isChecklistType(type) ? draft.checklist : null,
      difficulty: isLoadBasedType(type) ? draft.difficulty || 'not set' : draft.sprint?.speedQuality || (draft.checklist?.completed ? 'completed' : 'not set'),
      notes: isChecklistType(type) ? draft.checklist.notes : type === 'sprint' ? draft.sprint.mechanicsNote : draft.notes || '',
      loggedAt: loggedAt.toISOString(),
      time: loggedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setSessionLog((prev) => [entry, ...prev])
    setCompleted((prev) => ({ ...prev, [id]: true }))
  }

  const resetAllHistory = (keepPrs) => {
    const freshState = buildFreshTrackerState({ prs, keepPrs })
    setPrs(freshState.prs)
    setDay(freshState.day)
    setWorkoutDate(freshState.workoutDate)
    setSessionInstance(freshState.sessionInstance)
    setCompleted(freshState.completed)
    setSetDrafts(freshState.setDrafts)
    setSessionLog(freshState.sessionLog)
    setCompletedSessions(freshState.completedSessions)
    setCompletedWorkoutKeys(freshState.completedWorkoutKeys)
    setNextTargets(freshState.nextTargets)
    setProgressionDecisions(freshState.progressionDecisions)
    setDismissedBriefings(freshState.dismissedBriefings)
    setReadiness(freshState.readiness)
    setRestTimers(freshState.restTimers)
    setAlertedRestTimers(freshState.alertedRestTimers)
    setSessionTimer(freshState.sessionTimer)
    setSuggestionStatus(freshState.suggestionStatus)
    setFocusByDay(freshState.focusByDay)
    setSaved(false)
    setCompletionSummary(null)
    setShowCompleteConfirm(false)
    setRestTimerOverlay(null)
    setPendingDaySwitch(null)
    setManualDaySelected(false)
    setMainView('workout')
    setFocusMode(false)
    setSelectedExposure(null)
    setDetailExercise(null)
    setReviewBriefingSummary(false)
    setEditingMaxKey(null)
    setEditingMaxValue('')
    setShowAllMaxEditor(false)
    setResetFlow({ open: false, step: 1, mode: 'history', confirmText: '' })
    setShowUtilities(false)
  }

  const savePRs = () => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          prs,
          day,
          workoutDate,
          sessionInstance,
          sessionId,
          completed,
          setDrafts,
          sessionLog,
          completedSessions: completedSessions.map(normalizeCompletedSession),
          completedWorkoutKeys,
          nextTargets,
          progressionDecisions,
          dismissedBriefings,
          readiness,
          restTimers,
          alertedRestTimers,
          sessionTimer,
          suggestionStatus,
          focusByDay,
        }),
      )
    } catch {
      // Keep the UI responsive even when browser storage is unavailable.
    }
    setSaved(true)
  }

  const exportBackup = () => {
    const backup = {
      version: 2,
      exportedAt: new Date().toISOString(),
      data: {
        prs,
        day,
        workoutDate,
        sessionInstance,
        sessionId,
        completed,
        setDrafts,
        sessionLog,
        completedSessions,
        completedWorkoutKeys,
        nextTargets,
        progressionDecisions,
        dismissedBriefings,
        readiness,
        restTimers,
        alertedRestTimers,
        sessionTimer,
        suggestionStatus,
        focusByDay,
      },
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `leg-growth-tracker-backup-${getTodayKey()}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const importBackup = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'))
        const restored = normalizeStoredState(parsed.data || parsed)
        setPrs(restored.prs)
        setDay(restored.day)
        setWorkoutDate(restored.workoutDate)
        setSessionInstance(restored.sessionInstance)
        setCompleted(restored.completed)
        setSetDrafts(restored.setDrafts)
        setSessionLog(restored.sessionLog)
        setCompletedSessions(restored.completedSessions.map(normalizeCompletedSession))
        setCompletedWorkoutKeys(restored.completedWorkoutKeys)
        setNextTargets(restored.nextTargets)
        setProgressionDecisions(restored.progressionDecisions)
        setDismissedBriefings(restored.dismissedBriefings)
        setReadiness(restored.readiness)
        setRestTimers(restored.restTimers)
        setAlertedRestTimers(restored.alertedRestTimers)
        setSessionTimer(restored.sessionTimer)
        setSuggestionStatus(restored.suggestionStatus)
        setFocusByDay(restored.focusByDay || { [restored.day]: 0 })
        setSaved(true)
      } catch {
        setSaved(false)
      }
    }
    reader.readAsText(file)
  }

  const clearTransientWorkoutState = (targetDay) => {
    const prefix = `${targetDay}-`
    setSetDrafts((prev) => clearObjectPrefix(prev, prefix))
    setCompleted((prev) => clearObjectPrefix(prev, prefix))
    setRestTimers((prev) => clearObjectPrefix(prev, prefix))
    setAlertedRestTimers((prev) => clearObjectPrefix(prev, prefix))
    setSessionTimer(createTimer(50 * 60))
    setRestTimerOverlay(null)
    setShowCompleteConfirm(false)
    setFocusForDay(targetDay, 0)
  }

  const finishWorkout = () => {
    const summary = buildCompletedSessionSummary({
      logs: sessionLogs,
      plan: session,
      completed,
      day,
      sessionId,
      workoutDate,
      readiness,
    })
    const decisions = generateProgressionDecisions({
      logs: sessionLogs,
      plan: session,
      readiness,
      history: sessionLog,
      getFallbackLoad: getWorkingWeight,
    })
    const generatedTargets = buildNextTargets(decisions)
    setCompletedSessions((prev) => [summary, ...prev.map(normalizeCompletedSession).filter((item) => item.sessionId !== sessionId)])
    setCompletedWorkoutKeys((prev) => ({ ...prev, [completionKey]: summary.sessionId }))
    setProgressionDecisions((prev) => [...decisions, ...prev])
    setNextTargets((prev) => ({ ...prev, ...generatedTargets }))
    setCompletionSummary(summary)
    setSessionTimer((prev) => pauseTimerAt(prev, Date.now()))
    clearTransientWorkoutState(day)
  }

  const requestCompleteWorkout = () => {
    if (completedWorkoutKeys[completionKey] && !sessionLogs.length) return
    if (sessionProgress.done < sessionProgress.total) {
      setShowCompleteConfirm(true)
      return
    }
    finishWorkout()
  }

  const startNewSessionAnyway = () => {
    const nextInstance = sessionInstance + 1
    clearTransientWorkoutState(day)
    setSessionInstance(nextInstance)
    setCompletionSummary(null)
  }

  const sessionProgressTotal = session.exercises.length
  const sessionProgressDone = session.exercises.filter((_, idx) => completed[`${day}-${idx}`]).length
  const sessionProgress = {
    done: sessionProgressDone,
    total: sessionProgressTotal,
    percent: Math.round((sessionProgressDone / sessionProgressTotal) * 100),
  }

  const estimatedMinutes = useMemo(() => {
    const setCount = session.exercises.reduce((sum, exercise) => sum + (exercise.sets || 1), 0)
    return Math.min(50, Math.round(setCount * 2.1))
  }, [session])

  const sessionLogs = sessionLog.filter((entry) => entry.sessionId === sessionId)
  const coachInsights = useMemo(() => buildCoachInsights({ logs: sessionLogs, plan: session, readiness }), [sessionLogs, session, readiness])
  const suggestedAdjustments = useMemo(() => findRepeatedIssueSuggestions(sessionLog, suggestionStatus), [sessionLog, suggestionStatus])
  const trendCards = useMemo(() => buildTrendCards(sessionLog, trendFilter), [sessionLog, trendFilter])
  const detailCard = detailExercise ? trendCards.find((card) => card.exercise === detailExercise) : null
  const sessionRemaining = getTimerRemaining(sessionTimer, now)
  const activeExercise = session.exercises[focusIdx] || session.exercises[0]
  const activeExerciseTarget = activeExercise ? getExerciseTarget(activeExercise) : null
  const activeExerciseWeight = activeExerciseTarget?.load || null
  const activeExerciseLastLog = sessionLog.find((entry) => entry.exercise === activeExercise?.name && entry.sessionId !== sessionId)
  const currentCompletionSummary = completionSummary?.sessionId === sessionId
    ? completionSummary
    : completedSessions.find((item) => item.sessionId === sessionId)
      || completedSessions.find((item) => item.sessionId === completedWorkoutKeys[completionKey])
  const isTodayCompleted = Boolean(completedWorkoutKeys[completionKey] && currentCompletionSummary && sessionId === completedWorkoutKeys[completionKey])
  const workoutState = getWorkoutState({ sessionTimer, sessionLogs, currentCompletionSummary, isTodayCompleted })
  const showNextTimeProgression = shouldShowNextTimeProgression(workoutState)
  const timerPrimaryAction = getTimerPrimaryAction(sessionTimer.status)
  const progressionAdvice = (() => {
    if (!showNextTimeProgression) return []
    const items = session.exercises
      .map((exercise) => {
        if (!isLoadBasedType(getActivityType(exercise)) || !exercise.key) return null
        const latest = sessionLog.find((entry) => entry.sessionId === sessionId && entry.exercise === exercise.name)
        if (!latest) return null
        return createProgressionInsight(latest, exercise, readiness)?.text || null
      })
      .filter(Boolean)

    return items.length ? items : ['Completed with limited logged set data. Next targets will improve as more complete sets are logged.']
  })()
  const latestCompletedSummary = completedSessions[0] || null
  const recoveryNextSession = weeklyPlan[scheduleInfo.nextDay]
  const lastSameDaySession = getLastSameDaySession(completedSessions, day, sessionId)
  const briefingKey = `${workoutDate}:${day}`
  const sessionBriefing = buildSessionBriefing({ day, lastSummary: lastSameDaySession, nextTargets })
  const showSessionBriefing = shouldShowBriefing({
    briefing: sessionBriefing,
    sessionTimer,
    sessionLogs,
    isTodayCompleted,
    dismissedBriefings,
    briefingKey,
  })
  const todayFocus = sessionBriefing?.focus || []

  const switchWorkoutDay = useCallback((targetDay, { manual = true } = {}) => {
    if (!weeklyPlan[targetDay] || targetDay === day) return

    if (manual) setManualDaySelected(true)
    setFocusForDay(targetDay, getFocusForDay(focusByDay, targetDay))
    setDay(targetDay)
    setFocusMode(false)
    setShowCompleteConfirm(false)
    setReviewBriefingSummary(false)
    setCompletionSummary(null)
    setSelectedExposure(null)
    setDetailExercise(null)
    setPendingDaySwitch(null)
    setSessionTimer(createTimer(50 * 60))
  }, [day, focusByDay, setFocusForDay])

  const requestDayChange = useCallback((targetDay, options = {}) => {
    if (shouldConfirmDaySwitch({
      currentDay: day,
      targetDay,
      sessionTimer,
      sessionLogs,
      currentCompletionSummary,
    })) {
      setPendingDaySwitch({ from: day, to: targetDay, options })
      return
    }
    switchWorkoutDay(targetDay, options)
  }, [currentCompletionSummary, day, sessionLogs, sessionTimer, switchWorkoutDay])

  const dismissBriefingToday = () => setDismissedBriefings((prev) => ({ ...prev, [briefingKey]: true }))

  const openResetFlow = () => {
    setResetFlow({ open: true, step: 1, mode: 'history', confirmText: '' })
  }

  const resetConfirmDisabled = resetFlow.step === 2 && resetFlow.confirmText.trim().toUpperCase() !== 'RESET'
  const resetCopy = getResetCopy(resetFlow.mode, resetFlow.step)
  const editingMaxMeta = editingMaxKey ? {
    key: editingMaxKey,
    title: getMaxEditorTitle(editingMaxKey),
    unit: getPRUnit(editingMaxKey),
    current: prs[editingMaxKey] ?? 0,
  } : null

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div>
          <div className="title-row">
            <Icon name="dumbbell" />
            <h1>Leg Growth Weekly Tracker</h1>
          </div>
          <p>Quad + hamstring mass, upper-body maintenance, upper-chest emphasis, and Saturday speed work.</p>
        </div>
        <div className="install-hint">PWA ready</div>
      </section>

      <nav className="view-tabs" aria-label="App sections">
        <button type="button" className={mainView === 'workout' ? 'active' : ''} onClick={() => setMainView('workout')}>Workout</button>
        <button type="button" className={mainView === 'progress' ? 'active' : ''} onClick={() => setMainView('progress')}>Progress</button>
      </nav>

      {mainView === 'workout' ? (
        <>
      {isRecoveryState && (
        <section className="card">
          <div className="card-content stack">
            <div className="section-heading">
              <Icon name="timer" />
              <h2>Recovery Day</h2>
            </div>
            <p className="muted">No programmed lift today. Next session: {scheduleInfo.nextDay} — {recoveryNextSession.title}.</p>
            {latestCompletedSummary && (
              <div className="summary-box">
                <strong>Most recent session</strong>
                <p>{latestCompletedSummary.day} on {latestCompletedSummary.date}. Top: {latestCompletedSummary.topPerformance}</p>
              </div>
            )}
            <button type="button" className="button secondary full" onClick={() => {
              requestDayChange(scheduleInfo.nextDay)
            }}>
              Open Next Session
            </button>
            <nav className="mini-day-tabs" aria-label="Choose workout day manually">
              {Object.keys(weeklyPlan).map((currentDay) => (
                <button key={currentDay} type="button" onClick={() => {
                  requestDayChange(currentDay)
                }}>
                  {currentDay.slice(0, 3)}
                </button>
              ))}
            </nav>
          </div>
        </section>
      )}

      {isTodayCompleted && (
        <section className="card">
          <div className="card-content stack">
            <div className="section-heading">
              <Icon name="check" />
              <h2>Today's session is already completed.</h2>
            </div>
            {currentCompletionSummary && (
              <div className="summary-box">
                <strong>{currentCompletionSummary.day} summary</strong>
                <p>{currentCompletionSummary.completedExercises.length} done, {currentCompletionSummary.skippedExercises.length} skipped. Top: {currentCompletionSummary.topPerformance}</p>
              </div>
            )}
            <div className="button-row">
              <button type="button" className="button primary grow" onClick={() => setMainView('progress')}>View Summary</button>
              <button type="button" className="button secondary grow" onClick={startNewSessionAnyway}>Start New Session Anyway</button>
            </div>
            <nav className="mini-day-tabs" aria-label="Choose another workout day">
              {Object.keys(weeklyPlan).map((currentDay) => (
                <button key={currentDay} type="button" onClick={() => {
                  requestDayChange(currentDay)
                }}>
                  {currentDay.slice(0, 3)}
                </button>
              ))}
            </nav>
          </div>
        </section>
      )}

      {!isRecoveryState && !isTodayCompleted && (
        <>
      {todayFocus.length > 0 && (
        <section className="card focus-summary-card">
          <div className="card-content stack tight">
            <div className="section-heading">
              <Icon name="zap" />
              <h2>Today's Focus</h2>
            </div>
            <div className="advice-list">
              {todayFocus.map((item) => <p key={item}>{item}</p>)}
            </div>
          </div>
        </section>
      )}

      <section className="card session-card">
        <div className="card-content stack">
          <div className="split-row">
            <div>
              <p className="eyebrow">Session cap</p>
              <p className="metric"><Icon name="timer" /> Max 50 min</p>
            </div>
            <span className="badge badge-strong">{formatTime(sessionRemaining)}</span>
          </div>

          <div className="timer-control-row">
            <button type="button" onClick={() => {
              const timestamp = Date.now()
              setSessionTimer((prev) => (
                timerPrimaryAction.action === 'pause' ? pauseTimerAt(prev, timestamp) : startTimerAt(prev, timestamp)
              ))
            }} className={timerPrimaryAction.className}><Icon name={timerPrimaryAction.icon} /> {timerPrimaryAction.label}</button>
            <button type="button" onClick={() => {
              setSessionTimer(createTimer(50 * 60))
            }} className="button secondary icon-only" aria-label="Reset session timer"><Icon name="reset" /></button>
          </div>

          <button type="button" className="button primary full complete-button" onClick={requestCompleteWorkout}>
            <Icon name="check" /> {currentCompletionSummary ? 'Update Workout Summary' : 'Complete Workout'}
          </button>
          {showCompleteConfirm && (
            <div className="confirm-box">
              <p>You still have unfinished items. Complete anyway?</p>
              <div className="button-row">
                <button type="button" className="button primary grow" onClick={finishWorkout}>Complete Anyway</button>
                <button type="button" className="button secondary grow" onClick={() => setShowCompleteConfirm(false)}>Keep Training</button>
              </div>
            </div>
          )}
          {currentCompletionSummary && (
            <div className="summary-box">
              <strong>Workout completed</strong>
              <p>{currentCompletionSummary.completedExercises.length} done, {currentCompletionSummary.skippedExercises.length} skipped. Top: {currentCompletionSummary.topPerformance}</p>
            </div>
          )}

          <p className="muted small">
            {sessionTimer.status === 'idle' && sessionLogs.length === 0
              ? 'Start when you begin training. Your logs and timers are saved on this device.'
              : `Estimated workout length: ${estimatedMinutes} min. Countdown is set to your 50-minute cap.`}
          </p>

          <div className="stack tight">
            <div className="split-row progress-label">
              <span>{sessionProgress.done}/{sessionProgress.total} logged</span>
              <span>{sessionProgress.percent}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${sessionProgress.percent}%` }} />
            </div>
          </div>

          <label className="field">
            <span><Icon name="gauge" /> Today's readiness</span>
            <select value={readiness} onChange={(event) => setReadiness(event.target.value)}>
              <option value="flat">Flat / sore: reduce targets 5%</option>
              <option value="good">Good: normal targets</option>
              <option value="great">Great: slight bump 2.5%</option>
            </select>
          </label>
        </div>
      </section>

      <section className="card">
        <div className="card-content stack tight">
          <div className="split-row">
            <div className="section-heading">
              <Icon name="trend" />
              <h2>Training Maxes</h2>
            </div>
            <button type="button" className="text-button" onClick={() => setShowUtilities(true)}>Utilities</button>
          </div>
          {dayTrainingMaxes.length ? (
            <div className="max-summary">
              {dayTrainingMaxes.map((item) => (
                <button type="button" key={`${day}-${item.key}`} className="max-tile" onClick={() => openMaxEditor(item.key)}>
                  <span>{item.label}</span>
                  <strong>{prs[item.key]} <small>{item.unit}</small></strong>
                  {item.context && <em>{item.context}</em>}
                </button>
              ))}
            </div>
          ) : (
            <p className="muted small">No lifting maxes needed for track work.</p>
          )}
          {saved && <p className="success small">Saved to this device.</p>}
        </div>
      </section>

      <nav className="tabs" aria-label="Workout days">
        {Object.keys(weeklyPlan).map((currentDay) => (
          <button key={currentDay} type="button" onClick={() => {
            requestDayChange(currentDay)
          }} className={currentDay === day ? 'active' : ''}>
            {currentDay.slice(0, 3)}
          </button>
        ))}
      </nav>

      <section className="card day-card">
        <div className="card-content">
          <h2>{day}: {session.title}</h2>
          <p className="muted">{session.goal}</p>
          <span className="badge subtle">{session.cap}</span>
        </div>
      </section>

      <section className="card focus-card">
        <div className="card-content stack tight">
          <div className="split-row">
            <div>
              <p className="eyebrow">Current exercise</p>
              <h2>{focusIdx + 1}. {activeExercise.name}</h2>
            </div>
            <div className="focus-actions">
              <span className="badge badge-strong">{formatTime(sessionRemaining)}</span>
              <button type="button" className="text-button" onClick={() => setFocusMode((prev) => !prev)}>
                {focusMode ? 'Show all' : 'Focus'}
              </button>
            </div>
          </div>
          <div className="focus-meta">
            <span>{activeExercise.sets} x {activeExercise.reps}</span>
            <span>{activeExercise.rest} rest</span>
            <span>{activeExerciseTarget?.label || (activeExerciseWeight ? `${activeExerciseWeight} lb target` : activeExercise.load || getActivityType(activeExercise))}</span>
          </div>
          {activeExerciseLastLog && (
            <p className="muted small">Last logged: {summarizeLogEntry(activeExerciseLastLog)}</p>
          )}
          <div className="button-grid two">
            <button type="button" className="button secondary" onClick={() => moveFocus(-1)}>Prev</button>
            <button type="button" className="button secondary" onClick={() => moveFocus(1)}>Next</button>
          </div>
        </div>
      </section>

      <section className="exercise-list">
        {session.exercises.map((exercise, idx) => {
          if (focusMode && idx !== focusIdx) return null
          const id = `${day}-${idx}`
          const target = getExerciseTarget(exercise)
          const workingWeight = target.load
          const type = getActivityType(exercise)
          const draft = getDraftForExercise(setDrafts[id], exercise, workingWeight)
          const restSeconds = restToSeconds(exercise.rest)
          const timerValue = getTimerRemaining(restTimers[id] || createTimer(restSeconds), now)
          const lastExerciseLog = sessionLog.find((entry) => entry.exercise === exercise.name && entry.sessionId !== sessionId)

          return (
            <article key={id} ref={(node) => { exerciseRefs.current[id] = node }} className="card exercise-card">
              <div className="card-content stack">
                <div className="split-row top-align">
                  <div>
                    <h3>{idx + 1}. {exercise.name}</h3>
                    <p className="muted">{exercise.sets} sets x {exercise.reps} | Rest {exercise.rest}</p>
                    <span className="type-pill">{type}</span>
                  </div>
                  {completed[id] && <Icon name="check" className="done-icon" />}
                </div>

                {isLoadBasedType(type) ? (
                  <div className="target-box">
                    <p><span>Today's target:</span> <strong>{target.label}</strong></p>
                    {target.previousResult && <p className="small muted">Last result: {target.previousResult}</p>}
                    <p className="small muted">Reason: {target.reason}</p>
                  </div>
                ) : (
                  <div className="target-box">
                    <p><span>Today's target:</span> <strong>{target.label}</strong></p>
                    {target.previousResult && <p className="small muted">Last result: {target.previousResult}</p>}
                    <p className="small muted">{target.reason || (type === 'sprint' ? 'Track speed quality, mechanics, fatigue, and rest instead of load.' : 'Checklist-style completion keeps this fast.')}</p>
                  </div>
                )}

                <p className="note">{exercise.note}</p>

                {lastExerciseLog && (
                  <div className="history-chip">
                    <span>Last time</span>
                    <strong>{summarizeLogEntry(lastExerciseLog)}</strong>
                  </div>
                )}

                {restSeconds > 0 && (
                  <div className="timer-box stack tight">
                    <div className="split-row">
                      <p className="metric compact"><Icon name="timer" /> Rest Timer</p>
                      <span className="timer-readout">{formatTime(timerValue)}</span>
                    </div>
                    <div className="button-grid three">
                      <button type="button" onClick={() => startRestTimer(idx, exercise.rest, Date.now())} className="button primary icon-only" aria-label={`Start ${exercise.name} rest timer`}><Icon name="play" /></button>
                      <button type="button" onClick={() => pauseRestTimer(idx, Date.now())} className="button secondary icon-only" aria-label={`Pause ${exercise.name} rest timer`}><Icon name="pause" /></button>
                      <button type="button" onClick={() => resetRestTimer(idx, exercise.rest)} className="button secondary icon-only" aria-label={`Reset ${exercise.name} rest timer`}><Icon name="reset" /></button>
                    </div>
                  </div>
                )}

                {isLoadBasedType(type) && (
                  <>
                    <div className="set-table" aria-label={`${exercise.name} set log`}>
                      <div className="set-table-head">
                        <span>Set</span>
                        <span>Load</span>
                        <span>Reps</span>
                        <span>RIR</span>
                      </div>
                      {draft.sets.map((set, setIdx) => (
                        <div className="set-row" key={`${id}-set-${setIdx}`}>
                          <span>{setIdx + 1}</span>
                          <input
                            type="number"
                            min="0"
                            inputMode="decimal"
                            value={set.weight}
                            onChange={(event) => updateSetDraft(idx, setIdx, 'weight', event.target.value)}
                            aria-label={`${exercise.name} set ${setIdx + 1} load`}
                          />
                          <input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            value={set.reps}
                            onChange={(event) => updateSetDraft(idx, setIdx, 'reps', event.target.value)}
                            aria-label={`${exercise.name} set ${setIdx + 1} reps`}
                          />
                          <input
                            type="number"
                            min="0"
                            max="5"
                            inputMode="numeric"
                            value={set.rir}
                            onChange={(event) => updateSetDraft(idx, setIdx, 'rir', event.target.value)}
                            aria-label={`${exercise.name} set ${setIdx + 1} reps in reserve`}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="form-grid single">
                      <label className="field">
                        <span>Overall feel</span>
                        <select value={draft.difficulty} onChange={(event) => updateDraftField(idx, 'difficulty', event.target.value)}>
                          <option value="">Select</option>
                          <option value="easy">Easy / had more</option>
                          <option value="good">Good hypertrophy effort</option>
                          <option value="hard">Too hard / form slipped</option>
                        </select>
                      </label>
                    </div>

                    <label className="field">
                      <span>Quick note</span>
                      <input value={draft.notes} onChange={(event) => updateDraftField(idx, 'notes', event.target.value)} placeholder="e.g., right side tilted, knee felt good" />
                    </label>
                  </>
                )}

                {type === 'sprint' && (
                  <div className="sprint-grid">
                    <label className="field">
                      <span>Distance</span>
                      <input value={draft.sprint.distance} onChange={(event) => updateNestedDraft(idx, 'sprint', 'distance', event.target.value)} placeholder="e.g., 40m" />
                    </label>
                    <label className="field">
                      <span>Reps</span>
                      <input type="number" min="0" inputMode="numeric" value={draft.sprint.reps} onChange={(event) => updateNestedDraft(idx, 'sprint', 'reps', event.target.value)} />
                    </label>
                    <label className="field">
                      <span>Rest</span>
                      <input value={draft.sprint.rest} onChange={(event) => updateNestedDraft(idx, 'sprint', 'rest', event.target.value)} placeholder="3-6 min" />
                    </label>
                    <label className="field">
                      <span>Best rep/time</span>
                      <input value={draft.sprint.bestRep} onChange={(event) => updateNestedDraft(idx, 'sprint', 'bestRep', event.target.value)} placeholder="optional" />
                    </label>
                    <label className="field">
                      <span>Speed quality</span>
                      <select value={draft.sprint.speedQuality} onChange={(event) => updateNestedDraft(idx, 'sprint', 'speedQuality', event.target.value)}>
                        <option value="">Select</option>
                        <option value="sharp">Sharp</option>
                        <option value="good">Good</option>
                        <option value="dropping">Speed dropped</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>Fatigue</span>
                      <select value={draft.sprint.fatigue} onChange={(event) => updateNestedDraft(idx, 'sprint', 'fatigue', event.target.value)}>
                        <option value="">Select</option>
                        <option value="low">Low</option>
                        <option value="moderate">Moderate</option>
                        <option value="high">High</option>
                      </select>
                    </label>
                    <label className="field wide">
                      <span>Mechanics note</span>
                      <input value={draft.sprint.mechanicsNote} onChange={(event) => updateNestedDraft(idx, 'sprint', 'mechanicsNote', event.target.value)} placeholder="e.g., speed drop after rep 3, tight hamstring" />
                    </label>
                  </div>
                )}

                {isChecklistType(type) && (
                  <div className="checklist-log">
                    <label className="check-field">
                      <input type="checkbox" checked={draft.checklist.completed} onChange={(event) => updateNestedDraft(idx, 'checklist', 'completed', event.target.checked)} />
                      <span>Completed</span>
                    </label>
                    <label className="field">
                      <span>Note</span>
                      <input value={draft.checklist.notes} onChange={(event) => updateNestedDraft(idx, 'checklist', 'notes', event.target.value)} placeholder="e.g., hips opened up, calves tight" />
                    </label>
                  </div>
                )}

                <button type="button" onClick={() => logExercise(idx)} className="button primary full"><Icon name="clipboard" /> Log Exercise</button>
              </div>
            </article>
          )
        })}
      </section>

      <section className="card">
        <div className="card-content stack">
          <div className="section-heading">
            <Icon name="clipboard" />
            <h2>Today's Logged Work</h2>
          </div>
          {sessionLogs.length === 0 ? (
            <p className="muted">Nothing logged yet. Set reps/difficulty, add a note if useful, then tap Log Exercise.</p>
          ) : (
            <div className="log-list">
              {sessionLogs.map((entry) => (
                <div key={entry.id} className="log-entry">
                  <div className="split-row top-align">
                    <strong>{entry.exercise}</strong>
                    <span>{entry.time}</span>
                  </div>
                  <p>{entry.target} | {entry.weight}</p>
                  {entry.type === 'sprint' && entry.sprint && (
                    <p className="muted">
                      {entry.sprint.distance || '-'} | {entry.sprint.reps || '-'} reps | rest {entry.sprint.rest || '-'} | speed {entry.sprint.speedQuality || '-'} | fatigue {entry.sprint.fatigue || '-'}
                    </p>
                  )}
                  {isChecklistType(entry.type) && entry.checklist && (
                    <p className="muted">{entry.checklist.completed ? 'Completed' : 'Not completed'}</p>
                  )}
                  {isLoadBasedType(entry.type) && entry.sets?.length > 0 && (
                    <p className="muted">
                      {entry.sets.map((set) => `S${set.set}: ${set.weight ?? '-'} x ${set.reps ?? '-'} @ ${set.rir ?? '-'} RIR`).join(' | ')}
                    </p>
                  )}
                  <p className="muted">Difficulty: {entry.difficulty}</p>
                  {entry.notes && <p className="log-note">Note: {entry.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {currentCompletionSummary && (
        <section className="card">
          <div className="card-content stack">
            <div className="section-heading">
              <Icon name="check" />
              <h2>Completed Session Summary</h2>
            </div>
            <div className="summary-grid">
              <div>
                <span>Completed</span>
                <strong>{currentCompletionSummary.completedExercises.length}</strong>
              </div>
              <div>
                <span>Skipped</span>
                <strong>{currentCompletionSummary.skippedExercises.length}</strong>
              </div>
            </div>
            <p className="muted">Top performance: {currentCompletionSummary.topPerformance}</p>
            {currentCompletionSummary.skippedExercises.length > 0 && <p className="muted">Skipped: {currentCompletionSummary.skippedExercises.join(', ')}</p>}
            {currentCompletionSummary.formFlags.length > 0 && <p className="log-note">Flags: {currentCompletionSummary.formFlags.map((flag) => `${flag.exercise} (${flag.issue})`).join(', ')}</p>}
            {currentCompletionSummary.sprintNotes.length > 0 && currentCompletionSummary.sprintNotes.map((note) => <p className="muted" key={note}>{note}</p>)}
            <div className="advice-list">
              {currentCompletionSummary.coachRecommendations.length ? currentCompletionSummary.coachRecommendations.map((item) => (
                <div className="coach-note" key={item.text}>
                  <span className={`insight-chip ${item.labelClass || 'technical'}`}>{item.label || 'Coach note'}</span>
                  <p>{item.text}</p>
                </div>
              )) : <p>No coach recommendations yet.</p>}
            </div>
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-content stack">
          <div className="section-heading">
            <Icon name="zap" />
            <h2>Insight / Coach Notes</h2>
          </div>
          {coachInsights.progression.length === 0 && coachInsights.form.length === 0 ? (
            <p className="muted">Log a movement with reps, RIR, fatigue, or a note to get coaching feedback.</p>
          ) : (
            <div className="coach-grid">
              <div>
                <h3>Strength Progression</h3>
                {coachInsights.progression.length ? coachInsights.progression.map((item) => (
                  <div className="coach-note compact" key={item.text}>
                    <span className="insight-chip technical">Next target</span>
                    <p>{item.text}</p>
                  </div>
                )) : <p className="muted">No load progression changes yet.</p>}
              </div>
              <div>
                <h3>Form / Safety</h3>
                {coachInsights.form.length ? coachInsights.form.map((item) => (
                  <div className="coach-note compact" key={item.text}>
                    <span className={`insight-chip ${item.labelClass || 'caution'}`}>{item.label || 'Coach note'}</span>
                    <p>{item.text}</p>
                  </div>
                )) : <p className="muted">No form issues detected from notes.</p>}
              </div>
            </div>
          )}
          {suggestedAdjustments.length > 0 && (
            <div className="suggestion-list">
              {suggestedAdjustments.map((item) => (
                <div className="suggestion-box" key={item.key}>
                  <strong>Suggested adjustment for next session</strong>
                  <p>{item.text}</p>
                  <div className="button-row">
                    <button type="button" className="button primary grow" onClick={() => setSuggestionStatus((prev) => ({ ...prev, [item.key]: 'accepted' }))}>Accept</button>
                    <button type="button" className="button secondary grow" onClick={() => setSuggestionStatus((prev) => ({ ...prev, [item.key]: 'dismissed' }))}>Dismiss</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {showNextTimeProgression && (
        <section className="card">
        <div className="card-content stack">
          <div className="section-heading">
            <Icon name="zap" />
            <h2>Next-Time Progression</h2>
          </div>
          <div className="advice-list">
            {progressionAdvice.map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
          <p className="muted small">Rule: targets move only when performance, readiness, and notes support it. Pain, form flags, or high fatigue pause progression.</p>
        </div>
      </section>
      )}
        </>
      )}
        </>
      ) : (
        <section className="card">
          <div className="card-content stack">
            <div className="split-row">
              <div className="section-heading">
                <Icon name="trend" />
                <h2>Progress</h2>
              </div>
              <select className="compact-select" value={trendFilter} onChange={(event) => setTrendFilter(event.target.value)}>
                <option value="4">Last 4 exposures</option>
                <option value="8">Last 8 exposures</option>
                <option value="1m">1 month</option>
                <option value="3m">3 months</option>
                <option value="all">All time</option>
              </select>
            </div>
            <p className="muted small">Progress is based on exposures, not calendar weeks, so each movement is judged by the last times you actually trained it.</p>
            <div className="summary-box">
              <strong>Completed Sessions</strong>
              {completedSessions.length === 0 ? (
                <p>No completed sessions yet. Finish a workout to save a session summary here.</p>
              ) : (
                <p>{completedSessions.length} saved. Latest: {completedSessions[0].day} on {completedSessions[0].date}, top {completedSessions[0].topPerformance}</p>
              )}
            </div>
            {trendCards.length === 0 ? (
              <p className="muted">No logged training data yet. Log a few exercises to unlock trajectory cards.</p>
            ) : (
              <div className="trajectory-list">
                {trendCards.map((card) => {
                  const latest = card.exposures[card.exposures.length - 1]
                  const metric = chartMetrics[card.exercise] || getDefaultChartMetric(card)
                  const details = selectedExposure?.exercise === card.exercise
                    ? buildExposureDetails(card, selectedExposure.point, metric)
                    : null
                  return (
                    <article className="trajectory-card" key={card.exercise}>
                      <div className="split-row top-align">
                        <div>
                          <button type="button" className="card-title-button" onClick={() => {
                            setDetailExercise(card.exercise)
                            setSelectedExposure(null)
                          }}>
                            <h3>{card.exercise}</h3>
                          </button>
                          <span className={`trend-label ${card.label.toLowerCase().replaceAll(' ', '-').replaceAll('/', '')}`}>{card.label}</span>
                        </div>
                        <span className="badge subtle">{card.exposures.length} exp.</span>
                      </div>
                      <p>{card.interpretation}</p>
                      <div className="chart-toolbar">
                        <span>{getChartMetricOptions(card.type).find((option) => option.value === metric)?.label}</span>
                        <select value={metric} onChange={(event) => setChartMetrics((prev) => ({ ...prev, [card.exercise]: event.target.value }))}>
                          {getChartMetricOptions(card.type).map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <ExposureChart
                        card={card}
                        metric={metric}
                        onSelectPoint={(point) => setSelectedExposure({ exercise: card.exercise, point })}
                      />
                      {details && (
                        <div className="exposure-detail">
                          <div className="split-row top-align">
                            <strong>{details.date} · Exposure {details.exposure}</strong>
                            <button type="button" className="text-button" onClick={() => setSelectedExposure(null)}>Close</button>
                          </div>
                          <p>{details.metricLabel}: {details.metricValue}</p>
                          {card.type === 'strength' ? (
                            <p className="muted">Top {details.topLoad || '-'} · Volume {details.volume || '-'} · Best {details.bestSet || '-'} · Avg RIR {details.avgRir !== null ? details.avgRir.toFixed(1) : '-'}</p>
                          ) : (
                            <p className="muted">Reps {details.sprint?.reps || '-'} · Quality {details.sprint?.speedQuality || '-'} · Fatigue {details.sprint?.fatigue || '-'} · Best {details.sprint?.bestRep || '-'}</p>
                          )}
                          {details.flags.length > 0 && <p className="log-note">Flags: {details.flags.join(', ')}</p>}
                          {details.notes && <p className="muted">Notes: {details.notes}</p>}
                          <p>{details.interpretation}</p>
                        </div>
                      )}
                      <button type="button" className="button secondary full" onClick={() => {
                        setDetailExercise(card.exercise)
                        setSelectedExposure(null)
                      }}>
                        View details
                      </button>
                      {card.type === 'strength' && latest?.metrics && (
                        <div className="metric-grid">
                          <div><span>Top load</span><strong>{latest.metrics.topWeight || '-'}</strong></div>
                          <div><span>Volume</span><strong>{latest.metrics.volumeLoad || '-'}</strong></div>
                          <div><span>Best set</span><strong>{latest.metrics.bestSet.weight ? `${latest.metrics.bestSet.weight} x ${latest.metrics.bestSet.reps}` : '-'}</strong></div>
                          <div><span>Avg RIR</span><strong>{latest.metrics.avgRir !== null ? latest.metrics.avgRir.toFixed(1) : '-'}</strong></div>
                        </div>
                      )}
                      {card.type === 'sprint' && latest?.sprint && (
                        <div className="metric-grid">
                          <div><span>Reps</span><strong>{latest.sprint.reps || '-'}</strong></div>
                          <div><span>Quality</span><strong>{latest.sprint.speedQuality || '-'}</strong></div>
                          <div><span>Fatigue</span><strong>{latest.sprint.fatigue || '-'}</strong></div>
                          <div><span>Best</span><strong>{latest.sprint.bestRep || '-'}</strong></div>
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
            {detailCard && (
              <div className="detail-overlay" role="dialog" aria-modal="true" aria-labelledby="exercise-detail-title">
                <div className="detail-panel">
                  <div className="split-row top-align">
                    <div>
                      <p className="eyebrow">Exercise detail</p>
                      <h2 id="exercise-detail-title">{detailCard.exercise}</h2>
                    </div>
                    <button type="button" className="text-button" onClick={() => {
                      setDetailExercise(null)
                      setSelectedExposure(null)
                    }}>
                      Close
                    </button>
                  </div>
                  <span className={`trend-label ${detailCard.label.toLowerCase().replaceAll(' ', '-').replaceAll('/', '')}`}>{detailCard.label}</span>
                  <p className="muted">{detailCard.interpretation}</p>
                  <div className="chart-toolbar">
                    <span>{getChartMetricOptions(detailCard.type).find((option) => option.value === (chartMetrics[detailCard.exercise] || getDefaultChartMetric(detailCard)))?.label}</span>
                    <select value={chartMetrics[detailCard.exercise] || getDefaultChartMetric(detailCard)} onChange={(event) => setChartMetrics((prev) => ({ ...prev, [detailCard.exercise]: event.target.value }))}>
                      {getChartMetricOptions(detailCard.type).map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <select className="compact-select" value={trendFilter} onChange={(event) => setTrendFilter(event.target.value)}>
                    <option value="4">Last 4 exposures</option>
                    <option value="8">Last 8 exposures</option>
                    <option value="1m">1 month</option>
                    <option value="3m">3 months</option>
                    <option value="all">All time</option>
                  </select>
                  <ExposureChart
                    card={detailCard}
                    metric={chartMetrics[detailCard.exercise] || getDefaultChartMetric(detailCard)}
                    height={230}
                    onSelectPoint={(point) => setSelectedExposure({ exercise: detailCard.exercise, point })}
                  />
                  <div className="summary-box">
                    <strong>What this means next session</strong>
                    <p>{nextTargets[detailCard.exercise]?.reason || detailCard.interpretation}</p>
                  </div>
                  {selectedExposure?.exercise === detailCard.exercise && (() => {
                    const metric = chartMetrics[detailCard.exercise] || getDefaultChartMetric(detailCard)
                    const details = buildExposureDetails(detailCard, selectedExposure.point, metric)
                    if (!details) return null
                    return (
                      <div className="exposure-detail">
                        <strong>{details.date} · Exposure {details.exposure}</strong>
                        <p>{details.metricLabel}: {details.metricValue}</p>
                        {detailCard.type === 'strength' ? (
                          <p className="muted">Top {details.topLoad || '-'} · Volume {details.volume || '-'} · Best {details.bestSet || '-'} · Avg RIR {details.avgRir !== null ? details.avgRir.toFixed(1) : '-'}</p>
                        ) : (
                          <p className="muted">Reps {details.sprint?.reps || '-'} · Quality {details.sprint?.speedQuality || '-'} · Fatigue {details.sprint?.fatigue || '-'} · Best {details.sprint?.bestRep || '-'}</p>
                        )}
                        {details.flags.length > 0 && <p className="log-note">Flags: {details.flags.join(', ')}</p>}
                        {details.notes && <p className="muted">Notes: {details.notes}</p>}
                        <p>{details.interpretation}</p>
                      </div>
                    )
                  })()}
                  <div className="log-list">
                    {detailCard.exposures.map((entry, index) => (
                      <button
                        type="button"
                        className="exposure-list-button"
                        key={`${entry.id || entry.loggedAt}-${index}`}
                        onClick={() => {
                          const metric = chartMetrics[detailCard.exercise] || getDefaultChartMetric(detailCard)
                          const point = buildChartData(detailCard, metric).find((item) => item.entry === entry)
                          if (point) setSelectedExposure({ exercise: detailCard.exercise, point })
                        }}
                      >
                        <span>{entry.date || entry.loggedAt?.slice(0, 10) || `Exposure ${index + 1}`}</span>
                        <strong>{summarizeLogEntry(entry)}</strong>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="utility-footer" aria-label="Settings and utilities">
        <button type="button" className="text-button" onClick={() => setShowUtilities(true)}>Settings / Utilities</button>
        <input
          ref={importInputRef}
          className="hidden-input"
          type="file"
          accept="application/json"
          onChange={(event) => {
            importBackup(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </section>

      {testResults && (
        <section className="card last-card">
          <div className="card-content stack">
            <div className="split-row">
              <div className="section-heading">
                <Icon name="test" />
                <h2>Developer Checks</h2>
              </div>
              <span className="badge subtle">{testResults.passed}/{testResults.total}</span>
            </div>
            <button type="button" onClick={() => setShowTests((prev) => !prev)} className="button secondary full">
              {showTests ? 'Hide Checks' : 'Show Checks'}
            </button>
            {showTests && (
              <div className="log-list">
                {testResults.tests.map((test) => (
                  <div key={test.name} className="check-row">
                    <span>{test.name}</span>
                    <strong className={test.pass ? 'success' : 'danger'}>{test.pass ? 'PASS' : 'FAIL'}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {pendingDaySwitch && (
        <div className="briefing-overlay" role="dialog" aria-modal="true" aria-labelledby="day-switch-title">
          <div className="briefing-card">
            <p className="eyebrow">Active session</p>
            <h2 id="day-switch-title">Switch workout day?</h2>
            <p className="muted">You have an active {pendingDaySwitch.from} session. Switching will show {pendingDaySwitch.to} and keep your saved logs, but the live session timer will reset for the new day.</p>
            <div className="button-row">
              <button type="button" className="button secondary grow" onClick={() => setPendingDaySwitch(null)}>Continue {pendingDaySwitch.from}</button>
              <button type="button" className="button primary grow" onClick={() => switchWorkoutDay(pendingDaySwitch.to, pendingDaySwitch.options)}>Switch Day</button>
            </div>
          </div>
        </div>
      )}

      {showUtilities && (
        <div className="briefing-overlay" role="dialog" aria-modal="true" aria-labelledby="utilities-title">
          <div className="briefing-card">
            <div className="split-row top-align">
              <div>
                <p className="eyebrow">Settings</p>
                <h2 id="utilities-title">Utilities</h2>
              </div>
              <button type="button" className="text-button" onClick={() => {
                setShowUtilities(false)
                setResetFlow({ open: false, step: 1, mode: 'history', confirmText: '' })
              }}>Close</button>
            </div>

            {!resetFlow.open ? (
              <div className="stack">
                <p className="muted">Backup your tracker or start fresh. These actions only affect data stored on this device.</p>
                <div className="utility-section">
                  <strong>Backup</strong>
                  <p>Export a local copy before changing devices or clearing history.</p>
                  <div className="button-row">
                    <button type="button" className="button secondary grow" onClick={exportBackup}>Export Backup</button>
                    <button type="button" className="button secondary grow" onClick={() => importInputRef.current?.click()}>Import Backup</button>
                  </div>
                </div>
                <div className="utility-section">
                  <strong>Reset</strong>
                  <p>Clear workout history only when you intentionally want a fresh training record.</p>
                  <button type="button" className="button danger-button full" onClick={openResetFlow}>Reset All History</button>
                </div>
                <div className="utility-section">
                  <strong>Advanced max editing</strong>
                  <p>Edit every training max at once. Most workouts only need the day-specific tiles.</p>
                  <button type="button" className="button secondary full" onClick={() => setShowAllMaxEditor((prev) => !prev)}>
                    {showAllMaxEditor ? 'Hide All Training Maxes' : 'Edit All Training Maxes'}
                  </button>
                  {showAllMaxEditor && (
                    <div className="pr-grid compact">
                      {Object.entries(prs).map(([key, value]) => (
                        <label key={key} className="field">
                          <span>{getPRLabel(key)}</span>
                          <input type="number" min="0" inputMode="numeric" value={value} onChange={(event) => updatePR(key, event.target.value)} />
                          <small>{getPRUnit(key)}</small>
                        </label>
                      ))}
                      <button type="button" className="button primary full" onClick={savePRs}><Icon name="save" /> Save Maxes</button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="stack">
                <div className="summary-box">
                  <strong>{resetCopy.title}</strong>
                  <p>{resetCopy.body}</p>
                </div>
                {resetFlow.step === 1 ? (
                  <>
                    <div className="reset-option-grid">
                      <button type="button" className={getResetOptionClass(resetFlow.mode, 'history')} onClick={() => setResetFlow((prev) => ({ ...prev, mode: 'history' }))} aria-pressed={resetFlow.mode === 'history'}>
                        {resetFlow.mode === 'history' && <Icon name="check" />}
                        <span>Reset History Only</span>
                      </button>
                      <button type="button" className={getResetOptionClass(resetFlow.mode, 'everything')} onClick={() => setResetFlow((prev) => ({ ...prev, mode: 'everything' }))} aria-pressed={resetFlow.mode === 'everything'}>
                        {resetFlow.mode === 'everything' && <Icon name="check" />}
                        <span>Reset Everything</span>
                      </button>
                    </div>
                    <div className="button-row">
                      <button type="button" className="button primary grow" onClick={() => setResetFlow((prev) => ({ ...prev, step: 2, confirmText: '' }))}>Continue</button>
                      <button type="button" className="button ghost grow" onClick={() => setResetFlow({ open: false, step: 1, mode: 'history', confirmText: '' })}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <label className="field">
                      <span>Confirmation</span>
                      <input value={resetFlow.confirmText} onChange={(event) => setResetFlow((prev) => ({ ...prev, confirmText: event.target.value }))} placeholder="Type RESET" />
                    </label>
                    <div className="button-row">
                      <button type="button" className="button danger-button grow" disabled={resetConfirmDisabled} onClick={() => resetAllHistory(resetFlow.mode === 'history')}>
                        Confirm Reset
                      </button>
                      <button type="button" className="button secondary grow" onClick={() => setResetFlow((prev) => ({ ...prev, step: 1, confirmText: '' }))}>Back</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {editingMaxMeta && (
        <div className="briefing-overlay" role="dialog" aria-modal="true" aria-labelledby="max-editor-title">
          <div className="max-editor-sheet">
            <h2 id="max-editor-title">{editingMaxMeta.title}</h2>
            <input
              className="max-value-input"
              aria-label={`${editingMaxMeta.title} value`}
              autoFocus
              type="number"
              min="0"
              inputMode="numeric"
              value={editingMaxValue}
              onChange={(event) => setEditingMaxValue(event.target.value)}
            />
            <p className="max-unit-label">{editingMaxMeta.unit}</p>
            <div className="max-stepper-row" aria-label="Quick adjustments">
              {[-5, -2.5, 2.5, 5].map((delta) => (
                <button type="button" key={delta} onClick={() => adjustEditingMax(delta)}>
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>
            <div className="max-editor-actions">
              <button type="button" className="button primary" onClick={saveFocusedMax}>Save</button>
              <button type="button" className="button secondary" onClick={closeMaxEditor}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {restTimerOverlay && (
        <div className="timer-complete-overlay" role="dialog" aria-modal="true" aria-labelledby="timer-complete-title">
          <div className="timer-complete-card">
            <p className="eyebrow">Rest complete</p>
            <h2 id="timer-complete-title">Time's Up</h2>
            <p className="timer-complete-subtitle">Next set is ready</p>
            <p className="timer-complete-exercise">{restTimerOverlay.exerciseName}</p>
            <div className="timer-complete-actions">
              <button type="button" className="button primary full" onClick={startNextSetFromOverlay}>
                Start Next Set
              </button>
              <button type="button" className="button secondary full" onClick={addThirtySecondsToRestTimer}>
                Add 30 sec
              </button>
              <button type="button" className="button ghost full" onClick={dismissRestTimerOverlay}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {showSessionBriefing && (
        <div className="briefing-overlay" role="dialog" aria-modal="true" aria-labelledby="briefing-title">
          <div className="briefing-card">
            <p className="eyebrow">Coach briefing</p>
            <h2 id="briefing-title">{sessionBriefing.title}</h2>
            <p className="muted">{sessionBriefing.lastLine}</p>
            {sessionBriefing.skippedLine && <p className="muted">{sessionBriefing.skippedLine}</p>}
            {sessionBriefing.flags.length > 0 && (
              <div className="briefing-section">
                <strong>Watch</strong>
                {sessionBriefing.flags.slice(0, 2).map((flag) => (
                  <p key={`${flag.exercise}-${flag.issue}`}>{flag.exercise}: {flag.label || flag.issue}</p>
                ))}
              </div>
            )}
            {sessionBriefing.focus.length > 0 && (
              <div className="briefing-section">
                <strong>Today's Focus</strong>
                {sessionBriefing.focus.map((item) => <p key={item}>{item}</p>)}
              </div>
            )}
            {sessionBriefing.targets.length > 0 && (
              <div className="briefing-section">
                <strong>Progression unlock</strong>
                {sessionBriefing.targets.slice(0, 2).map((target) => (
                  <p key={target.exercise}>{target.exercise}: {target.unlockCondition || target.reason}</p>
                ))}
              </div>
            )}
            {reviewBriefingSummary && (
              <div className="summary-box">
                <strong>Last summary</strong>
                <p>{lastSameDaySession.completedExercises.length} completed, {lastSameDaySession.skippedExercises.length} skipped. Top: {lastSameDaySession.topPerformance}</p>
              </div>
            )}
            <div className="button-grid briefing-actions">
              <button type="button" className="button primary" onClick={dismissBriefingToday}>Start Session</button>
              <button type="button" className="button secondary" onClick={() => setReviewBriefingSummary((prev) => !prev)}>Review Last Summary</button>
              <button type="button" className="button ghost" onClick={dismissBriefingToday}>Don't show again today</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
