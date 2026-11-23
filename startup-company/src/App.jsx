import { useEffect, useState } from 'react'
import './App.css'

const request = async (url, options) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const result = await response.json().catch(() => ({}))
    throw new Error(result.error || 'Something went wrong. Please try again.')
  }

  return response.status === 204 ? null : response.json()
}

function App() {
  const [user, setUser] = useState(null)
  const [courses, setCourses] = useState([])
  const [records, setRecords] = useState([])
  const [checkingSession, setCheckingSession] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadPortal = async (currentUser) => {
    const [courseList, recordList] = await Promise.all([
      request('/api/courses'),
      request('/api/records'),
    ])
    setUser(currentUser)
    setCourses(courseList)
    setRecords(recordList)
  }

  useEffect(() => {
    let active = true

    const restoreSession = async () => {
      try {
        const currentUser = await request('/api/auth/me')
        const [courseList, recordList] = await Promise.all([
          request('/api/courses'),
          request('/api/records'),
        ])
        if (active) {
          setUser(currentUser)
          setCourses(courseList)
          setRecords(recordList)
        }
      } catch {
        if (active) setUser(null)
      } finally {
        if (active) setCheckingSession(false)
      }
    }

    restoreSession()
    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const form = new FormData(event.currentTarget)
    const payload = {
      email: form.get('email'),
      password: form.get('password'),
    }
    if (registering) payload.name = form.get('name')

    try {
      const currentUser = await request(
        registering ? '/api/auth/register' : '/api/auth/login',
        { method: 'POST', body: JSON.stringify(payload) },
      )
      await loadPortal(currentUser)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    setError('')
    try {
      await request('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setCourses([])
      setRecords([])
    } catch (logoutError) {
      setError(logoutError.message)
    }
  }

  if (checkingSession) {
    return <main className="loading-screen">Loading your secure portal…</main>
  }

  if (!user) {
    return (
      <main className="auth-page">
        <aside className="welcome-panel">
          <a className="brand brand-light" href="/" aria-label="Northstar home">
            <span className="brand-mark">N</span>
            <span>northstar<span className="brand-period">.</span></span>
          </a>
          <div className="welcome-copy">
            <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
            <h1>Make room<br />for what’s next.</h1>
            <p>Your courses, progress, and campus life — all in one place.</p>
            <div className="campus-art" aria-hidden="true">
              <div className="sun" />
              <div className="campus-building">
                <div className="building-roof" />
                <div className="building-columns"><i /><i /><i /><i /></div>
                <div className="building-steps" />
              </div>
              <div className="campus-ground" />
              <span className="art-spark spark-one">✳</span>
              <span className="art-spark spark-two">✳</span>
            </div>
          </div>
          <p className="panel-footnote">A little progress adds up to a lot.</p>
        </aside>

        <section className="auth-panel">
          <div className="mobile-brand">
            <span className="brand-mark">N</span>
            <span>northstar<span className="brand-period">.</span></span>
          </div>
          <div className="auth-card">
            <span className="eyebrow">NORTHSTAR STUDENT PORTAL</span>
            <h2>{registering ? 'Create your account' : 'Welcome back'}</h2>
            <p className="auth-description">
              {registering
                ? 'Start your journey. Your campus community is waiting.'
                : 'Sign in to pick up right where you left off.'}
            </p>

            {error && <div className="form-error" role="alert">{error}</div>}

            <form onSubmit={handleSubmit}>
              {registering && (
                <label className="field">
                  <span>Full name</span>
                  <input
                    name="name"
                    type="text"
                    placeholder="e.g. Alex Morgan"
                    autoComplete="name"
                    maxLength="80"
                    required
                  />
                </label>
              )}
              <label className="field">
                <span>Student email</span>
                <input
                  name="email"
                  type="email"
                  placeholder="you@school.edu"
                  autoComplete="email"
                  maxLength="254"
                  required
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  name="password"
                  type="password"
                  placeholder={registering ? 'At least 12 characters' : 'Enter your password'}
                  autoComplete={registering ? 'new-password' : 'current-password'}
                  minLength={registering ? 12 : undefined}
                  maxLength="72"
                  required
                />
              </label>

              {registering && (
                <p className="password-hint">Use 12 or more characters. Longer passphrases are easier to remember.</p>
              )}

              <button className="primary-button" type="submit" disabled={submitting}>
                {submitting
                  ? 'Please wait…'
                  : registering
                    ? 'Create account'
                    : 'Sign in'}
                {!submitting && <span aria-hidden="true">→</span>}
              </button>
            </form>

            <p className="auth-switch">
              {registering ? 'Already have an account?' : 'New to Northstar?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setRegistering(!registering)
                  setError('')
                }}
              >
                {registering ? 'Sign in' : 'Create an account'}
              </button>
            </p>
            <div className="security-note">
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.4 3.8 5v4.3c0 3.8 2.6 6.7 6.2 8.3 3.6-1.6 6.2-4.5 6.2-8.3V5L10 2.4Z" /><path d="m7.4 9.9 1.7 1.7 3.6-3.8" /></svg>
              Your account is protected with secure sign-in.
            </div>
          </div>
          <p className="auth-legal">By continuing, you agree to Northstar’s <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p>
        </section>
      </main>
    )
  }

  const firstName = user.name.split(' ')[0]
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="portal-layout">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Northstar home">
          <span className="brand-mark">N</span>
          <span>northstar<span className="brand-period">.</span></span>
        </a>
        <span className="nav-label">YOUR CAMPUS</span>
        <nav className="main-nav" aria-label="Main navigation">
          <a className="nav-item active" href="#overview"><span>⌂</span> Overview</a>
          <a className="nav-item" href="#courses"><span>▤</span> My courses</a>
          <a className="nav-item" href="#records"><span>▧</span> Academic records</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon">✳</span>
            <strong>Need a hand?</strong>
            <p>Your student support team is just a message away.</p>
            <a href="mailto:support@northstar.edu">Get support <span>↗</span></a>
          </div>
          <button className="sign-out" onClick={handleLogout} type="button">
            <span>↪</span> Sign out
          </button>
        </div>
      </aside>

      <main className="portal-main" id="overview">
        <header className="topbar">
          <div className="breadcrumb">Student portal <span>/</span> Overview</div>
          <div className="account-chip">
            <div className="avatar">{initials}</div>
            <div><strong>{user.name}</strong><span>Student</span></div>
          </div>
        </header>
        <div className="dashboard-content">
          {error && <div className="form-error dashboard-error" role="alert">{error}</div>}
          <section className="greeting">
            <div>
              <span className="eyebrow">YOUR CAMPUS, AT A GLANCE</span>
              <h1>Good to see you, {firstName}<span className="greeting-dot">.</span></h1>
              <p>Here’s what’s happening with your learning today.</p>
            </div>
            <div className="greeting-decoration" aria-hidden="true"><span>✳</span></div>
          </section>

          <section className="stat-grid" aria-label="Academic overview">
            <article className="stat-card">
              <span className="stat-icon lilac">▤</span>
              <span className="stat-label">AVAILABLE COURSES</span>
              <strong>{courses.length.toString().padStart(2, '0')}</strong>
              <span className="stat-caption">Ready when you are</span>
            </article>
            <article className="stat-card">
              <span className="stat-icon peach">✦</span>
              <span className="stat-label">ACADEMIC RECORDS</span>
              <strong>{records.length.toString().padStart(2, '0')}</strong>
              <span className="stat-caption">Your personal records</span>
            </article>
            <article className="stat-card term-card">
              <span className="stat-icon mint">◷</span>
              <span className="stat-label">CURRENT TERM</span>
              <strong>Fall <span>2026</span></strong>
              <span className="stat-caption">Make this term count</span>
            </article>
          </section>

          <section className="section-block" id="courses">
            <div className="section-heading">
              <div><span className="eyebrow">KEEP YOUR CURIOSITY CLOSE</span><h2>Your courses</h2></div>
              <span className="section-count">{courses.length} courses</span>
            </div>
            <div className="course-grid">
              {courses.map((course, index) => (
                <article className={`course-card course-${index % 3}`} key={course.id}>
                  <div className="course-art" aria-hidden="true">
                    <span>{course.code}</span><i>{['✳', '◈', '⌘'][index % 3]}</i>
                  </div>
                  <div className="course-info">
                    <span className="course-code">{course.code}</span>
                    <h3>{course.title}</h3>
                    <p>{course.instructor}</p>
                    <div className="course-meta"><span>▤ {course.schedule}</span><span>{course.credits} credits</span></div>
                    <p className="course-material">{course.materials}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="section-block records-section" id="records">
            <div className="section-heading">
              <div><span className="eyebrow">YOUR PROGRESS, YOURS ALONE</span><h2>Academic records</h2></div>
            </div>
            {records.length ? (
              <div className="records-table-wrap">
                <table>
                  <thead><tr><th>COURSE</th><th>TERM</th><th>GRADE</th><th>CREDITS</th></tr></thead>
                  <tbody>{records.map((record) => (
                    <tr key={record.id}>
                      <td><strong>{record.course_code}</strong><span>{record.course_title}</span></td>
                      <td>{record.term}</td><td><span className="grade-pill">{record.grade}</span></td><td>{record.credits}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : (
              <div className="empty-records">
                <span aria-hidden="true">✦</span>
                <div><strong>Your academic records will appear here.</strong><p>As you complete courses, you’ll find your grades and progress in this space.</p></div>
              </div>
            )}
          </section>
          <footer className="dashboard-footer">Made for your next chapter <span>✳</span></footer>
        </div>
      </main>
    </div>
  )
}

export default App
