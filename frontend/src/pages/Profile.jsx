import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function formatDate(ym) {
  if (!ym) return ''
  const [year, month] = ym.split('-')
  const d = new Date(year, parseInt(month) - 1)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function formatRange(from, to) {
  const f = formatDate(from)
  const t = to ? formatDate(to) : 'Present'
  if (!f && !t) return ''
  if (!f) return t
  return `${f} – ${t}`
}

export default function Profile() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [recommendations, setRecommendations] = useState(null)
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('userProfile')
    if (!saved) {
      navigate('/intake')
      return
    }
    setData(JSON.parse(saved))
    const recs = localStorage.getItem('recommendations')
    if (recs) setRecommendations(JSON.parse(recs))
  }, [navigate])

  const runRecommender = async () => {
    const saved = localStorage.getItem('userProfile')
    if (!saved) return
    const profile = JSON.parse(saved)
    const parts = []
    if (profile.profile?.headline) parts.push(profile.profile.headline)
    if (profile.profile?.summary) parts.push(profile.profile.summary)
    if (profile.skills?.length) parts.push(profile.skills.join(' '))
    if (profile.interests?.length) parts.push(profile.interests.join(' '))
    profile.experience?.forEach((j) => {
      if (j.title) parts.push(j.title)
      if (j.description) parts.push(j.description)
      if (j.skills?.length) parts.push(j.skills.join(' '))
    })
    profile.education?.forEach((e) => {
      if (e.degree) parts.push(e.degree)
      if (e.details) parts.push(e.details)
    })
    profile.projects?.forEach((p) => {
      if (p.name) parts.push(p.name)
      if (p.description) parts.push(p.description)
      if (p.skills?.length) parts.push(p.skills.join(' '))
    })
    if (profile.rawResumeText) parts.push(profile.rawResumeText)

    setFetching(true)
    setFetchError('')
    try {
      const res = await fetch('http://localhost:5001/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: parts.join(' ') }),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const recs = await res.json()
      localStorage.setItem('recommendations', JSON.stringify(recs))
      setRecommendations(recs)
    } catch {
      setFetchError('Could not reach the backend. Make sure it is running at localhost:5000.')
    } finally {
      setFetching(false)
    }
  }

  if (!data) return null

  const { profile, experience, education, projects, skills, interests } = data

  return (
    <main className="app-shell profile-shell">
      <nav className="navbar">
        <Link className="brand" to="/">COMP442 Project – Job Recommender</Link>
        <div className="nav-links">
          <Link to="/intake">Edit profile</Link>
          <button
            className="nav-action"
            type="button"
            style={{ border: 'none', cursor: 'pointer' }}
            onClick={runRecommender}
            disabled={fetching}
          >
            {fetching ? 'Running…' : 'Get recommendations →'}
          </button>
        </div>
      </nav>

      {/* Header */}
      <div className="card panel profile-header">
        <div>
          <p className="card-label">Your profile</p>
          <h1 className="profile-name">{profile.fullName || 'No name entered'}</h1>
          <div className="profile-meta">
            {profile.headline && <span>{profile.headline}</span>}
            {profile.location && <span>📍 {profile.location}</span>}
            {profile.email && <span>{profile.email}</span>}
            {profile.phone && <span>{profile.phone}</span>}
          </div>
          {profile.summary && (
            <p style={{ marginTop: 16, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 680 }}>
              {profile.summary}
            </p>
          )}
        </div>
        <div style={{ marginTop: 20 }}>
          <Link className="btn-secondary" to="/intake" style={{ display: 'inline-flex' }}>
            Edit profile
          </Link>
        </div>
      </div>

      {/* Skills */}
      {skills?.length > 0 && (
        <div className="card panel profile-section">
          <h3>Skills</h3>
          <div className="tag-list">
            {skills.map((s) => <span className="tag" key={s}>{s}</span>)}
          </div>
        </div>
      )}

      {/* Interests */}
      {interests?.length > 0 && (
        <div className="card panel profile-section">
          <h3>Interests</h3>
          <div className="tag-list">
            {interests.map((i) => <span className="tag tag-interest" key={i}>{i}</span>)}
          </div>
        </div>
      )}

      {/* Experience */}
      {experience?.some((j) => j.title || j.company) && (
        <div className="card panel profile-section">
          <h3>Work experience</h3>
          {experience.filter((j) => j.title || j.company).map((job, i) => (
            <div className="profile-item" key={i}>
              <h4>{job.title}{job.company ? ` — ${job.company}` : ''}</h4>
              <p>{[job.location, formatRange(job.dateFrom, job.dateTo)].filter(Boolean).join(' · ')}</p>
              {job.description && <p style={{ marginTop: 6 }}>{job.description}</p>}
              {job.skills?.length > 0 && (
                <div className="tag-list" style={{ marginTop: 8 }}>
                  {job.skills.map((s) => <span className="tag" key={s}>{s}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education?.some((e) => e.school || e.degree) && (
        <div className="card panel profile-section">
          <h3>Education</h3>
          {education.filter((e) => e.school || e.degree).map((item, i) => (
            <div className="profile-item" key={i}>
              <h4>{item.degree}{item.school ? ` — ${item.school}` : ''}</h4>
              <p>{[item.location, formatRange(item.dateFrom, item.dateTo)].filter(Boolean).join(' · ')}</p>
              {item.details && <p style={{ marginTop: 6 }}>{item.details}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {projects?.some((p) => p.name) && (
        <div className="card panel profile-section">
          <h3>Projects</h3>
          {projects.filter((p) => p.name).map((project, i) => (
            <div className="profile-item" key={i}>
              <h4>
                {project.name}
                {project.link && (
                  <a
                    href={project.link.startsWith('http') ? project.link : `https://${project.link}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ marginLeft: 10, fontSize: '0.85rem', color: 'var(--accent)' }}
                  >
                    View →
                  </a>
                )}
              </h4>
              {project.role && <p>{project.role}</p>}
              {project.description && <p style={{ marginTop: 6 }}>{project.description}</p>}
              {project.skills?.length > 0 && (
                <div className="tag-list" style={{ marginTop: 8 }}>
                  {project.skills.map((s) => <span className="tag" key={s}>{s}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Links */}
      {profile.links && (
        <div className="card panel profile-section">
          <h3>Links</h3>
          <p style={{ color: 'var(--muted)', whiteSpace: 'pre-line', fontSize: '0.92rem' }}>
            {profile.links}
          </p>
        </div>
      )}

      {/* Recommendations */}
      {recommendations ? (
        <div className="card panel profile-section">
          <p className="card-label">Predicted field: {recommendations.category}</p>
          <h3>Your top job matches</h3>
          <div style={{ marginTop: 16 }}>
            {recommendations.matches?.map((m, i) => (
              <div key={m.soc_code} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', borderBottom: 'var(--border)' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)', minWidth: 24 }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, margin: 0 }}>{m.job_title}</p>
                  <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: 0 }}>{m.soc_code}</p>
                </div>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  {(m.score * 100).toFixed(1)}% similarity
                </span>
              </div>
            ))}
          </div>
          {fetchError && <p style={{ color: 'var(--danger)', marginTop: 12, fontSize: '0.9rem' }}>{fetchError}</p>}
          <button className="btn-secondary" type="button" style={{ marginTop: 20 }} onClick={runRecommender} disabled={fetching}>
            {fetching ? 'Running…' : 'Re-run recommendations'}
          </button>
        </div>
      ) : (
        <div className="card panel" style={{ textAlign: 'center' }}>
          <p className="card-label">Next step</p>
          <h2>Ready to find your best-fit roles?</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 20 }}>
            Run your profile through the job recommender to get your top matched job titles.
          </p>
          {fetchError && <p style={{ color: 'var(--danger)', marginBottom: 12, fontSize: '0.9rem' }}>{fetchError}</p>}
          <button className="btn-primary" type="button" onClick={runRecommender} disabled={fetching}>
            {fetching ? 'Getting recommendations…' : 'Get job recommendations →'}
          </button>
        </div>
      )}
    </main>
  )
}
