import { useEffect, useMemo, useState } from 'react'

const defaultPRs = {
  boxSquat: 315,
  frontSquat: 225,
  trapBarDeadlift: 365,
  rdl: 275,
  inclineDbPress: 80,
  flatDbPress: 90,
  weightedPullup: 45,
}

const weeklyPlan = {
  Monday: {
    title: 'Quad Dominant Mass',
    goal: 'Heavy quad stimulus + upper chest',
    cap: '50 min',
    exercises: [
      { name: 'High-Bar Box Squat', key: 'boxSquat', sets: 4, reps: '6-8', targetTopReps: 8, percent: 0.72, rest: '2:00', note: 'Controlled 2-3 sec lower. Touch box, stay tight, explode up.' },
      { name: 'Heel-Elevated Bulgarian Split Squat', sets: 3, reps: '8-10/leg', targetTopReps: 10, load: 'DBs: hard but clean', rest: '1:15', note: 'Quad bias. Keep torso upright and knee tracking forward.' },
      { name: 'Romanian Deadlift', key: 'rdl', sets: 3, reps: '6-8', targetTopReps: 8, percent: 0.7, rest: '1:45', note: 'Hamstrings loaded, not lower-back grindy.' },
      { name: 'Incline DB Press', key: 'inclineDbPress', sets: 3, reps: '6-10', targetTopReps: 10, percent: 0.75, rest: '1:30', note: 'Upper chest focus. 30-40 degree incline.' },
      { name: 'Weighted Pull-Up', key: 'weightedPullup', sets: 2, reps: '5-8', targetTopReps: 8, percent: 0.75, rest: '1:30', note: 'Maintain back size without overdoing volume.' },
      { name: 'Leg Extension', sets: 2, reps: '12-15', targetTopReps: 15, load: 'Hard squeeze', rest: '0:45', note: 'Slow eccentric. Stop 1 rep before form breaks.' },
    ],
  },
  Wednesday: {
    title: 'Hamstrings + Quad Support',
    goal: 'Posterior chain growth + upper maintenance',
    cap: '50 min',
    exercises: [
      { name: 'Trap Bar Deadlift', key: 'trapBarDeadlift', sets: 4, reps: '5-6', targetTopReps: 6, percent: 0.72, rest: '2:00', note: 'Crisp reps. No maxing.' },
      { name: 'Front Squat', key: 'frontSquat', sets: 3, reps: '6-8', targetTopReps: 8, percent: 0.7, rest: '1:45', note: 'Upright torso. Quad drive.' },
      { name: 'Nordic Curl or GHR', sets: 3, reps: '5-8', targetTopReps: 8, load: 'Bodyweight', rest: '1:30', note: 'Controlled eccentric. Use assistance if needed.' },
      { name: 'Flat DB Press', key: 'flatDbPress', sets: 2, reps: '8-10', targetTopReps: 10, percent: 0.72, rest: '1:15', note: 'Maintenance dose.' },
      { name: 'Chest-Supported Row', sets: 3, reps: '8-12', targetTopReps: 12, load: 'Moderate-heavy', rest: '1:15', note: 'No lower-back fatigue.' },
      { name: 'Seated Hamstring Curl', sets: 2, reps: '10-12', targetTopReps: 12, load: 'Hard squeeze', rest: '0:45', note: 'Shortened-position hamstring work.' },
    ],
  },
  Friday: {
    title: 'Low-Fatigue Neural Primer',
    goal: 'Stay springy for Saturday speed work',
    cap: '40-45 min',
    exercises: [
      { name: 'Dynamic Box Squat', key: 'boxSquat', sets: 6, reps: '2', targetTopReps: 2, percent: 0.55, rest: '1:00', note: 'Fast bar speed. Leave feeling better than when you started.' },
      { name: 'Jump Squat or Clean Pull', sets: 4, reps: '3', targetTopReps: 3, load: 'Light/moderate', rest: '1:00', note: 'Explosive only. No grinding.' },
      { name: 'Walking Lunge', sets: 2, reps: '10/leg', targetTopReps: 10, load: 'Moderate', rest: '1:00', note: 'Keep this easy enough to preserve Saturday.' },
      { name: 'Incline Machine Press', sets: 3, reps: '10', targetTopReps: 10, load: 'Moderate', rest: '1:00', note: 'Upper chest frequency.' },
      { name: 'Pull-Up or Lat Pulldown', sets: 2, reps: '8', targetTopReps: 8, load: 'Moderate', rest: '1:00', note: 'Maintenance only.' },
      { name: 'Calves', sets: 3, reps: '10-15', targetTopReps: 15, load: 'Controlled', rest: '0:45', note: 'Useful for sprint elasticity.' },
    ],
  },
  Saturday: {
    title: 'Track Speed Work',
    goal: 'Pure speed, no conditioning junk',
    cap: 'Quality only',
    exercises: [
      { name: 'Warm-Up + Drills', sets: 1, reps: '15-20 min', load: 'Mobility + buildups', rest: '-', note: 'Gradually open up speed.' },
      { name: 'Acceleration or Speed Work', sets: 4, reps: '30-60m OR 120-150m', load: 'Full recovery', rest: '3:00', note: 'Stop when speed drops. Take 3-6 min between reps as needed.' },
      { name: 'Cooldown', sets: 1, reps: '5-10 min', load: 'Easy', rest: '-', note: 'Keep legs fresh for next week.' },
    ],
  },
}

const STORAGE_KEY = 'leg-growth-tracker:v1'

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

function loadStoredState() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      prs: { ...defaultPRs, ...(stored.prs || {}) },
      day: weeklyPlan[stored.day] ? stored.day : 'Monday',
      completed: stored.completed || {},
      feedback: stored.feedback || {},
      sessionLog: Array.isArray(stored.sessionLog) ? stored.sessionLog : [],
      readiness: stored.readiness || 'good',
      timers: stored.timers || {},
      activeTimers: stored.activeTimers || {},
      sessionSeconds: Number.isFinite(stored.sessionSeconds) ? stored.sessionSeconds : 50 * 60,
      sessionRunning: Boolean(stored.sessionRunning),
    }
  } catch {
    return {}
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

const runHelperTests = () => {
  const tests = [
    { name: 'restToSeconds converts 2:00', pass: restToSeconds('2:00') === 120 },
    { name: 'restToSeconds converts dash to zero', pass: restToSeconds('-') === 0 },
    { name: 'formatTime renders 90 seconds', pass: formatTime(90) === '1:30' },
    { name: 'roundToFive rounds 227 to 225', pass: roundToFive(227) === 225 },
    { name: 'Friday has dynamic box squat', pass: weeklyPlan.Friday.exercises.some((exercise) => exercise.name === 'Dynamic Box Squat') },
  ]

  return {
    passed: tests.filter((test) => test.pass).length,
    total: tests.length,
    tests,
  }
}

export default function WorkoutTrackerApp() {
  const initialState = useMemo(() => loadStoredState(), [])
  const [prs, setPrs] = useState(initialState.prs || defaultPRs)
  const [day, setDay] = useState(initialState.day || 'Monday')
  const [completed, setCompleted] = useState(initialState.completed || {})
  const [feedback, setFeedback] = useState(initialState.feedback || {})
  const [sessionLog, setSessionLog] = useState(initialState.sessionLog || [])
  const [readiness, setReadiness] = useState(initialState.readiness || 'good')
  const [saved, setSaved] = useState(false)
  const [timers, setTimers] = useState(initialState.timers || {})
  const [activeTimers, setActiveTimers] = useState(initialState.activeTimers || {})
  const [sessionSeconds, setSessionSeconds] = useState(initialState.sessionSeconds ?? 50 * 60)
  const [sessionRunning, setSessionRunning] = useState(initialState.sessionRunning || false)
  const [showTests, setShowTests] = useState(false)

  const session = weeklyPlan[day]
  const testResults = useMemo(() => runHelperTests(), [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimers((prev) => {
        const next = { ...prev }
        Object.keys(activeTimers).forEach((id) => {
          if (activeTimers[id] && next[id] > 0) {
            next[id] -= 1
          }
        })
        return next
      })

      setSessionSeconds((prev) => {
        if (!sessionRunning) return prev
        return Math.max(0, prev - 1)
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [activeTimers, sessionRunning])

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        prs,
        day,
        completed,
        feedback,
        sessionLog,
        readiness,
        timers,
        activeTimers,
        sessionSeconds,
        sessionRunning,
      }),
    )
  }, [prs, day, completed, feedback, sessionLog, readiness, timers, activeTimers, sessionSeconds, sessionRunning])

  const readinessMultiplier = readiness === 'flat' ? 0.95 : readiness === 'great' ? 1.025 : 1

  const getWorkingWeight = (exercise) => {
    if (!exercise.key || !prs[exercise.key] || !exercise.percent) return null
    return roundToFive(prs[exercise.key] * exercise.percent * readinessMultiplier)
  }

  const updatePR = (key, value) => {
    setPrs((prev) => ({ ...prev, [key]: Number(value) || 0 }))
    setSaved(false)
  }

  const updateFeedback = (idx, field, value) => {
    const id = `${day}-${idx}`
    setFeedback((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }))
  }

  const startRestTimer = (idx, rest) => {
    const id = `${day}-${idx}`
    const seconds = restToSeconds(rest)
    if (!seconds) return

    setTimers((prev) => ({
      ...prev,
      [id]: prev[id] && prev[id] > 0 ? prev[id] : seconds,
    }))
    setActiveTimers((prev) => ({ ...prev, [id]: true }))
  }

  const pauseRestTimer = (idx) => {
    const id = `${day}-${idx}`
    setActiveTimers((prev) => ({ ...prev, [id]: false }))
  }

  const resetRestTimer = (idx, rest) => {
    const id = `${day}-${idx}`
    setTimers((prev) => ({ ...prev, [id]: restToSeconds(rest) }))
    setActiveTimers((prev) => ({ ...prev, [id]: false }))
  }

  const logExercise = (idx) => {
    const exercise = session.exercises[idx]
    const id = `${day}-${idx}`
    const currentFeedback = feedback[id] || {}
    const workingWeight = getWorkingWeight(exercise)

    const entry = {
      id: `${Date.now()}-${id}`,
      day,
      exercise: exercise.name,
      target: `${exercise.sets} x ${exercise.reps}`,
      weight: workingWeight ? `${workingWeight} lb` : exercise.load || 'Bodyweight / as prescribed',
      repsHit: currentFeedback.repsHit || 'not set',
      difficulty: currentFeedback.difficulty || 'not set',
      notes: currentFeedback.notes || '',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setSessionLog((prev) => [entry, ...prev])
    setCompleted((prev) => ({ ...prev, [id]: true }))
  }

  const resetAll = () => {
    setPrs(defaultPRs)
    setFeedback({})
    setCompleted({})
    setSessionLog([])
    setTimers({})
    setActiveTimers({})
    setSessionSeconds(50 * 60)
    setSessionRunning(false)
    setSaved(false)
  }

  const savePRs = () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        prs,
        day,
        completed,
        feedback,
        sessionLog,
        readiness,
        timers,
        activeTimers,
        sessionSeconds,
        sessionRunning,
      }),
    )
    setSaved(true)
  }

  const sessionProgress = useMemo(() => {
    const total = session.exercises.length
    const done = session.exercises.filter((_, idx) => completed[`${day}-${idx}`]).length
    return { done, total, percent: Math.round((done / total) * 100) }
  }, [completed, day, session.exercises])

  const progressionAdvice = useMemo(() => {
    const items = session.exercises
      .map((exercise, idx) => {
        const id = `${day}-${idx}`
        const currentFeedback = feedback[id] || {}
        if (!exercise.key) return null
        if (currentFeedback.difficulty === 'easy' && currentFeedback.repsHit === 'yes') return `${exercise.name}: add 5-10 lb next time.`
        if (currentFeedback.difficulty === 'good' && currentFeedback.repsHit === 'yes') return `${exercise.name}: repeat once, then increase if it feels clean again.`
        if (currentFeedback.difficulty === 'hard' || currentFeedback.repsHit === 'no') return `${exercise.name}: keep the same weight or reduce 5%.`
        return null
      })
      .filter(Boolean)

    return items.length ? items : ['Log reps and difficulty after each main lift to unlock progression advice.']
  }, [feedback, day, session.exercises])

  const estimatedMinutes = useMemo(() => {
    const setCount = session.exercises.reduce((sum, exercise) => sum + (exercise.sets || 1), 0)
    return Math.min(50, Math.round(setCount * 2.1))
  }, [session])

  const dayLogs = sessionLog.filter((entry) => entry.day === day)

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

      <section className="card session-card">
        <div className="card-content stack">
          <div className="split-row">
            <div>
              <p className="eyebrow">Session cap</p>
              <p className="metric"><Icon name="timer" /> Max 50 min</p>
            </div>
            <span className="badge badge-strong">{formatTime(sessionSeconds)}</span>
          </div>

          <div className="button-grid three">
            <button type="button" onClick={() => setSessionRunning(true)} className="button primary"><Icon name="play" /> Start</button>
            <button type="button" onClick={() => setSessionRunning(false)} className="button secondary"><Icon name="pause" /> Pause</button>
            <button type="button" onClick={() => {
              setSessionSeconds(50 * 60)
              setSessionRunning(false)
            }} className="button secondary icon-only" aria-label="Reset session timer"><Icon name="reset" /></button>
          </div>

          <p className="muted small">Estimated workout length: {estimatedMinutes} min. Countdown is set to your 50-minute cap.</p>

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

      <nav className="tabs" aria-label="Workout days">
        {Object.keys(weeklyPlan).map((currentDay) => (
          <button key={currentDay} type="button" onClick={() => setDay(currentDay)} className={currentDay === day ? 'active' : ''}>
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

      <section className="exercise-list">
        {session.exercises.map((exercise, idx) => {
          const id = `${day}-${idx}`
          const workingWeight = getWorkingWeight(exercise)
          const restSeconds = restToSeconds(exercise.rest)
          const timerValue = timers[id] ?? restSeconds

          return (
            <article key={id} className="card exercise-card">
              <div className="card-content stack">
                <div className="split-row top-align">
                  <div>
                    <h3>{idx + 1}. {exercise.name}</h3>
                    <p className="muted">{exercise.sets} sets x {exercise.reps} | Rest {exercise.rest}</p>
                  </div>
                  {completed[id] && <Icon name="check" className="done-icon" />}
                </div>

                <div className="target-box">
                  <p><span>Target load:</span> <strong>{workingWeight ? `${workingWeight} lb` : exercise.load || 'As prescribed'}</strong></p>
                  {exercise.percent && <p className="small muted">Based on {Math.round(exercise.percent * 100)}% of your current PR, adjusted by readiness.</p>}
                </div>

                <p className="note">{exercise.note}</p>

                {restSeconds > 0 && (
                  <div className="timer-box stack tight">
                    <div className="split-row">
                      <p className="metric compact"><Icon name="timer" /> Rest Timer</p>
                      <span className="timer-readout">{formatTime(timerValue)}</span>
                    </div>
                    <div className="button-grid three">
                      <button type="button" onClick={() => startRestTimer(idx, exercise.rest)} className="button primary icon-only" aria-label={`Start ${exercise.name} rest timer`}><Icon name="play" /></button>
                      <button type="button" onClick={() => pauseRestTimer(idx)} className="button secondary icon-only" aria-label={`Pause ${exercise.name} rest timer`}><Icon name="pause" /></button>
                      <button type="button" onClick={() => resetRestTimer(idx, exercise.rest)} className="button secondary icon-only" aria-label={`Reset ${exercise.name} rest timer`}><Icon name="reset" /></button>
                    </div>
                  </div>
                )}

                <div className="form-grid">
                  <label className="field">
                    <span>Reps hit?</span>
                    <select value={feedback[id]?.repsHit || ''} onChange={(event) => updateFeedback(idx, 'repsHit', event.target.value)}>
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Difficulty</span>
                    <select value={feedback[id]?.difficulty || ''} onChange={(event) => updateFeedback(idx, 'difficulty', event.target.value)}>
                      <option value="">Select</option>
                      <option value="easy">Easy</option>
                      <option value="good">Good</option>
                      <option value="hard">Too hard</option>
                    </select>
                  </label>
                </div>

                <label className="field">
                  <span>Quick note</span>
                  <input value={feedback[id]?.notes || ''} onChange={(event) => updateFeedback(idx, 'notes', event.target.value)} placeholder="e.g., hit 8s clean, knee felt good" />
                </label>

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
          {dayLogs.length === 0 ? (
            <p className="muted">Nothing logged yet. Set reps/difficulty, add a note if useful, then tap Log Exercise.</p>
          ) : (
            <div className="log-list">
              {dayLogs.map((entry) => (
                <div key={entry.id} className="log-entry">
                  <div className="split-row top-align">
                    <strong>{entry.exercise}</strong>
                    <span>{entry.time}</span>
                  </div>
                  <p>{entry.target} | {entry.weight}</p>
                  <p className="muted">Reps hit: {entry.repsHit} | Difficulty: {entry.difficulty}</p>
                  {entry.notes && <p className="log-note">Note: {entry.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-content stack">
          <div className="section-heading">
            <Icon name="trend" />
            <h2>Current PRs / Estimated Maxes</h2>
          </div>
          <div className="pr-grid">
            {Object.entries(prs).map(([key, value]) => (
              <label key={key} className="field">
                <span>{formatKey(key)}</span>
                <input type="number" min="0" inputMode="numeric" value={value} onChange={(event) => updatePR(key, event.target.value)} />
              </label>
            ))}
          </div>
          <div className="button-row">
            <button type="button" className="button primary grow" onClick={savePRs}><Icon name="save" /> Save PRs</button>
            <button type="button" className="button secondary icon-only" onClick={resetAll} aria-label="Reset all saved tracker data"><Icon name="reset" /></button>
          </div>
          {saved && <p className="success small">Saved to this device.</p>}
        </div>
      </section>

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
          <p className="muted small">Rule: if all sets hit the top of the rep range with clean form and 1-2 reps in reserve, add 5 lb for upper body or 5-10 lb for lower body next time.</p>
        </div>
      </section>

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
    </main>
  )
}
