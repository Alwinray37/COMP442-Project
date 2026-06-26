import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppNav from '../components/AppNav.jsx'

function readJson(key) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

export default function Profile() {
  const navigate = useNavigate()
  const [data, setData] = useState(() => readJson('userProfile'))
  const [recommendations, setRecommendations] = useState(() => readJson('recommendations'))
  const [expandedDescriptions, setExpandedDescriptions] = useState({})
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    if (!data) {
      navigate('/intake')
    }
  }, [data, navigate])

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
      setFetchError('Could not reach the backend. Make sure it is running at localhost:5001.')
    } finally {
      setFetching(false)
    }
  }

  const clearSavedInfo = () => {
    localStorage.removeItem('userProfile')
    localStorage.removeItem('recommendations')
    setData(null)
    setRecommendations(null)
    navigate('/intake')
  }

  const toggleDescription = (socCode) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [socCode]: !prev[socCode],
    }))
  }

  if (!data) return null

  const { profile, experience, education, skills, interests } = data

  return (
    <main className="app-shell profile-shell">
      <AppNav
        actions={(
          <button className="btn-danger nav-button" type="button" onClick={clearSavedInfo}>
            Clear saved info
          </button>
        )}
      />

      {/* Header */}
      <div className="card panel profile-header">
        <div>
          <p className="card-label">Step 2 of 2 · Recommendations</p>
          <h1 className="profile-name">{recommendations ? 'Review your job matches' : 'Ready to run recommendations'}</h1>
          <div className="profile-meta">
            {profile.headline && <span>{profile.headline}</span>}
            <span>{experience?.filter((j) => j.title || j.description).length || 0} experience entries</span>
            <span>{education?.filter((e) => e.degree || e.details).length || 0} education entries</span>
            <span>{skills?.length || 0} skills</span>
          </div>
          {profile.summary && (
            <p style={{ marginTop: 16, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 680 }}>
              {profile.summary}
            </p>
          )}
        </div>
        <div className="profile-actions">
          <Link className="btn-secondary" to="/intake">
            Edit intake
          </Link>
          {!recommendations && (
            <button className="btn-primary" type="button" onClick={runRecommender} disabled={fetching}>
              {fetching ? 'Running…' : 'Run recommendations'}
            </button>
          )}
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
      {experience?.some((j) => j.title || j.description) && (
        <div className="card panel profile-section">
          <h3>Work experience</h3>
          {experience.filter((j) => j.title || j.description).map((job, i) => (
            <div className="profile-item" key={i}>
              {job.title && <h4>{job.title}</h4>}
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
      {education?.some((e) => e.degree || e.details) && (
        <div className="card panel profile-section">
          <h3>Education</h3>
          {education.filter((e) => e.degree || e.details).map((item, i) => (
            <div className="profile-item" key={i}>
              {item.degree && <h4>{item.degree}</h4>}
              {item.details && <p style={{ marginTop: 6 }}>{item.details}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {recommendations ? (
        <div className="card panel profile-section">
          <p className="card-label">Predicted field: {recommendations.category}</p>
          <h3>Your top job matches</h3>
          <div className="recommendation-list">
            {recommendations.matches?.map((m, i) => (
              <div className="recommendation-row" key={m.soc_code}>
                <span className="recommendation-rank">{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <button
                    className="recommendation-title"
                    type="button"
                    onClick={() => toggleDescription(m.soc_code)}
                    aria-expanded={Boolean(expandedDescriptions[m.soc_code])}
                  >
                    {m.job_title}
                    {m.description && (
                      <span
                        className={`recommendation-chevron${expandedDescriptions[m.soc_code] ? ' is-open' : ''}`}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                  <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: 0 }}>
                    O*NET-SOC {m.soc_code}
                  </p>
                  {m.description && expandedDescriptions[m.soc_code] && (
                    <p className="recommendation-description">
                      {m.description}
                    </p>
                  )}
                </div>
                <span className="recommendation-score">
                  {(m.score * 100).toFixed(1)}% similarity
                </span>
              </div>
            ))}
          </div>
          {fetchError && <p style={{ color: 'var(--danger)', marginTop: 12, fontSize: '0.9rem' }}>{fetchError}</p>}
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
