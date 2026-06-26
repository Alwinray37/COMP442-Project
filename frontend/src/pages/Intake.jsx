import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as pdfjsLib from 'pdfjs-dist'
import AppNav from '../components/AppNav.jsx'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

const emptyJob = { title: '', description: '', skills: [] }
const emptyEducation = { degree: '', details: '' }
const emptyProfile = { headline: '', summary: '' }

// Best-effort extraction helpers
function extractExperience(text) {
  const section = text.match(/EXPERIENCE([\s\S]{0,3000}?)(?:EDUCATION|PROJECTS|SKILLS|CERTIFICATIONS|REFERENCES|$)/i)
  if (!section) return []

  const blocks = section[1].trim().split(/\n(?=[A-Z][a-zA-Z\s]+\s{2,}[A-Z][a-z])/)
  const jobs = []

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length < 2) continue

    const title = lines[0] || ''
    const descLines = lines.filter((l) => l.startsWith('●')).map((l) => l.replace(/^●\s*/, ''))

    if (!title && descLines.length === 0) continue

    jobs.push({
      title: title.trim(),
      description: descLines.join(' '),
      skills: [],
    })
  }

  return jobs.length > 0 ? jobs : [{ ...emptyJob }]
}

function extractEducation(text) {
  const section = text.match(/EDUCATION\s+([\s\S]{0,2000}?)(?:PROJECTS|SKILLS|CERTIFICATIONS|REFERENCES|$)/i)
  if (!section) return []

  const raw = section[1].trim()
  const blocks = raw.split(/\s{2,}(?=[A-Z][a-zA-Z\s,]+–)/).filter((b) => b.trim().length > 5)
  const edu = []

  for (const block of blocks) {
    const parts = block.split(/\s{2,}/).map((p) => p.trim()).filter(Boolean)
    const schoolRaw = parts[0] || ''
    const isSchool = /university|college|school|institute/i.test(schoolRaw)

    if (!isSchool) {
      // Degree-only line — attach to previous entry
      if (edu.length > 0 && !edu[edu.length - 1].degree) {
        edu[edu.length - 1].degree = block.trim()
      }
      continue
    }

    const degree = parts.find((p) => /bachelor|master|associate/i.test(p)) || ''
    const details = parts.filter((p) => p !== schoolRaw && p !== degree).join(' ')

    edu.push({ degree, details })
  }

  return edu.length > 0 ? edu : [{ ...emptyEducation }]
}

function extractSkills(text) {
  // Find the SKILLS section
  const section = text.match(/SKILLS([\s\S]{0,1200}?)(?:EDUCATION|EXPERIENCE|PROJECTS|CERTIFICATIONS|REFERENCES|$)/i)
  if (!section) return []

  const skillText = section[1]
  const skills = []

  // Split by filled bullet ● or standard bullets
  const bullets = skillText.split(/●|•|·/).slice(1)

  for (const bullet of bullets) {
    // Remove the category label (e.g. "Web Development:", "Cloud & Database :")
    const withoutLabel = bullet.replace(/^[^:]+:\s*/, '').trim()
    // Split by comma and semicolon, clean each item
    const parts = withoutLabel
      .split(/[,;]/)
      .map((s) => s.replace(/[\n\r]/g, ' ').trim())
      .filter((s) => s.length > 1 && s.length < 50 && !/^\d+$/.test(s))
    skills.push(...parts)
  }

  return [...new Set(skills)].filter((s) => s.length > 1).slice(0, 30)
}

export default function Intake() {
  const navigate = useNavigate()
  const [entryMode, setEntryMode] = useState('manual')
  const [resumePdf, setResumePdf] = useState(null)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState('')

  const saved = (() => { try { return JSON.parse(localStorage.getItem('userProfile') || 'null') } catch { return null } })()
  const hasSavedProfile = Boolean(saved)

  const [profile, setProfile] = useState(saved?.profile ?? { ...emptyProfile })
  const [jobs, setJobs] = useState(saved?.experience ?? [{ ...emptyJob }])
  const [education, setEducation] = useState(saved?.education ?? [{ ...emptyEducation }])
  const [skills, setSkills] = useState(saved?.skills ?? [])
  const [interests, setInterests] = useState(saved?.interests ?? [])
  const [rawResumeText, setRawResumeText] = useState(saved?.rawResumeText ?? '')

  const updateProfile = (field, value) =>
    setProfile((prev) => ({ ...prev, [field]: value }))

  const updateItem = (setter, index, field, value) =>
    setter((items) =>
      items.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )

  const removeItem = (setter, index) =>
    setter((items) => items.filter((_, i) => i !== index))

  const handlePdfUpload = async (file) => {
    setResumePdf(file)
    setParsing(true)
    setParseError('')
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let fullText = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        fullText += content.items.map((item) => item.str).join(' ') + '\n'
      }
      setRawResumeText(fullText)
      setSkills((prev) => {
        const extracted = extractSkills(fullText)
        return [...new Set([...prev, ...extracted])]
      })
      setJobs(extractExperience(fullText))
      setEducation(extractEducation(fullText))
      // Switch to manual so user can review and fill in the rest
      setEntryMode('manual')
    } catch {
      setParseError('Could not parse this PDF. Please fill in your info manually.')
    } finally {
      setParsing(false)
    }
  }

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const clearSavedInfo = () => {
    localStorage.removeItem('userProfile')
    localStorage.removeItem('recommendations')
    setEntryMode('manual')
    setResumePdf(null)
    setParsing(false)
    setParseError('')
    setSubmitError('')
    setProfile({ ...emptyProfile })
    setJobs([{ ...emptyJob }])
    setEducation([{ ...emptyEducation }])
    setSkills([])
    setInterests([])
    setRawResumeText('')
  }

  const buildResumeText = () => {
    const parts = []
    if (profile.headline) parts.push(profile.headline)
    if (profile.summary) parts.push(profile.summary)
    if (skills.length) parts.push(skills.join(' '))
    if (interests.length) parts.push(interests.join(' '))
    jobs.forEach((j) => {
      if (j.title) parts.push(j.title)
      if (j.description) parts.push(j.description)
      if (j.skills?.length) parts.push(j.skills.join(' '))
    })
    education.forEach((e) => {
      if (e.degree) parts.push(e.degree)
      if (e.details) parts.push(e.details)
    })
    if (rawResumeText) parts.push(rawResumeText)
    return parts.join(' ')
  }

  const handleSubmit = async () => {
    const userProfile = {
      profile,
      experience: jobs,
      education,
      skills,
      interests,
      rawResumeText,
    }
    localStorage.setItem('userProfile', JSON.stringify(userProfile))
    localStorage.removeItem('recommendations')

    setSubmitting(true)
    setSubmitError('')
    try {
      const resumeText = buildResumeText()
      const res = await fetch('http://localhost:5001/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: resumeText }),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      localStorage.setItem('recommendations', JSON.stringify(data))
    } catch {
      setSubmitError('Could not reach the backend. Make sure it is running at localhost:5001.')
    } finally {
      setSubmitting(false)
      navigate('/profile')
    }
  }

  return (
    <main className="app-shell intake-shell">
      <AppNav
        actions={(
          <button className="btn-danger nav-button" type="button" onClick={clearSavedInfo}>
            Clear saved info
          </button>
        )}
      />

      <header className="intake-hero">
        <div className="card hero-panel">
          <p className="eyebrow">Step 1 of 2 · Intake</p>
          <h1>Build your recommender profile.</h1>
          <p className="hero-copy">
            Add the skills, interests, education, and experience the model should use. Saving here refreshes the recommendations page.
          </p>
        </div>
        <div className="card status-card">
          <p className="card-label">Current page</p>
          <h2>Editing intake</h2>
          {parsing && <p>Parsing PDF…</p>}
          {!parsing && rawResumeText && <p className="file-meta">PDF parsed. Review the fields, then save again.</p>}
          {!parsing && !rawResumeText && <p>{entryMode === 'pdf' ? 'Upload a PDF to prefill the intake.' : 'Update fields, then save to view job matches.'}</p>}
          {resumePdf && !parsing && <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 6 }}>{resumePdf.name}</p>}
        </div>
      </header>

      <div className="mode-switch">
        <button
          type="button"
          className={entryMode === 'manual' ? 'is-active' : ''}
          onClick={() => setEntryMode('manual')}
        >
          Manual entry
        </button>
        <button
          type="button"
          className={entryMode === 'pdf' ? 'is-active' : ''}
          onClick={() => setEntryMode('pdf')}
        >
          Upload PDF
        </button>
      </div>

      {entryMode === 'pdf' ? (
        <section className="card panel">
          <p className="card-label">Upload</p>
          <h2>Resume PDF</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.92rem' }}>
            We'll extract your info and pre-fill the form. You can review and add anything missing before saving.
          </p>
          <label className="upload-dropzone" htmlFor="resumePdf">
            <span>{parsing ? 'Parsing PDF…' : resumePdf ? resumePdf.name : 'Click to choose a PDF'}</span>
            <small>PDF files only · Max 10MB</small>
            <input
              id="resumePdf"
              type="file"
              accept="application/pdf"
              disabled={parsing}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handlePdfUpload(file)
              }}
            />
          </label>
          {parseError && (
            <p style={{ color: 'var(--danger)', marginTop: 12, fontSize: '0.9rem' }}>{parseError}</p>
          )}
        </section>
      ) : (
        <form className="intake-form" onSubmit={(e) => e.preventDefault()}>

          {/* Profile */}
          <FormSection label="Background" title="Career background">
            <div className="form-grid">
              <TextField label="Current goal or field" value={profile.headline} onChange={(v) => updateProfile('headline', v)} placeholder="Data analysis, healthcare, education, software, design..." wide />
              <TextArea label="Background summary" value={profile.summary} onChange={(v) => updateProfile('summary', v)} placeholder="Summarize your experience, strengths, coursework, and the kind of work you want." />
            </div>
          </FormSection>

          {/* Skills */}
          <FormSection label="Skills" title="Your skills">
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0 0 10px' }}>
              Add any technical or professional skills. Press Enter or comma to add each one.
            </p>
            <TagsInput
              tags={skills}
              onChange={setSkills}
              placeholder="e.g. Python, Excel, Public Speaking, Adobe Photoshop"
            />
          </FormSection>

          {/* Interests */}
          <FormSection label="Interests" title="Personal interests">
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0 0 10px' }}>
              Add hobbies, sports, passions, or anything you enjoy. These help us recommend roles that align with what you care about — e.g. "volleyball" might point toward coaching or sports management.
            </p>
            <TagsInput
              tags={interests}
              onChange={setInterests}
              placeholder="e.g. volleyball, photography, cooking, music production"
            />
          </FormSection>

          {/* Experience */}
          <FormSection label="Experience" title="Work experience">
            {jobs.map((job, index) => (
              <div className="repeat-card" key={index}>
                <div className="repeat-header">
                  <h3>Job {index + 1}{job.title ? ` — ${job.title}` : ''}</h3>
                  {jobs.length > 1 && (
                    <button className="btn-danger" type="button" onClick={() => removeItem(setJobs, index)}>
                      Remove
                    </button>
                  )}
                </div>
                <div className="form-grid">
                  <TextField label="Role or activity" value={job.title} onChange={(v) => updateItem(setJobs, index, 'title', v)} placeholder="Software developer, tutor, cashier, lab assistant..." wide />
                  <TextArea label="Description" value={job.description} onChange={(v) => updateItem(setJobs, index, 'description', v)} placeholder="Describe your responsibilities, achievements, and impact in this role." />
                  <div className="field field--wide">
                    <span>Skills used</span>
                    <TagsInput
                      tags={job.skills}
                      onChange={(v) => updateItem(setJobs, index, 'skills', v)}
                      placeholder="e.g. React, SQL, project management"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button className="btn-secondary" type="button" style={{ width: 'fit-content' }} onClick={() => setJobs((j) => [...j, { ...emptyJob }])}>
              + Add job
            </button>
          </FormSection>

          {/* Education */}
          <FormSection label="Education" title="Education">
            {education.map((item, index) => (
              <div className="repeat-card" key={index}>
                <div className="repeat-header">
                  <h3>Education {index + 1}{item.degree ? ` — ${item.degree}` : ''}</h3>
                  {education.length > 1 && (
                    <button className="btn-danger" type="button" onClick={() => removeItem(setEducation, index)}>
                      Remove
                    </button>
                  )}
                </div>
                <div className="form-grid">
                  <TextField label="Degree / Program" value={item.degree} onChange={(v) => updateItem(setEducation, index, 'degree', v)} placeholder="B.Sc. Computer Science, Data Analytics certificate..." wide />
                  <TextArea label="Details" value={item.details} onChange={(v) => updateItem(setEducation, index, 'details', v)} placeholder="Relevant coursework, projects, clubs, or academic strengths." />
                </div>
              </div>
            ))}
            <button className="btn-secondary" type="button" style={{ width: 'fit-content' }} onClick={() => setEducation((e) => [...e, { ...emptyEducation }])}>
              + Add education
            </button>
          </FormSection>

          {/* Submit bar */}
          <div className="card submit-bar">
            <p>Your profile is saved locally and sent to the job recommender when you submit.</p>
            {submitError && <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{submitError}</p>}
            <button className="btn-primary" type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Getting recommendations…' : hasSavedProfile ? 'Update & refresh recommendations →' : 'Save & see recommendations →'}
            </button>
          </div>
        </form>
      )}
    </main>
  )
}

/* ── Sub-components ── */

function FormSection({ label, title, children }) {
  return (
    <section className="card panel form-section">
      <p className="card-label">{label}</p>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function TextField({ label, value, onChange, type = 'text', placeholder = '', wide = false }) {
  return (
    <label className={`field${wide ? ' field--wide' : ''}`}>
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

function TextArea({ label, value, onChange, placeholder = '' }) {
  return (
    <label className="field field--wide">
      <span>{label}</span>
      <textarea
        rows={4}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

function TagsInput({ tags, onChange, placeholder }) {
  const [input, setInput] = useState('')

  const addTag = (raw) => {
    const value = raw.trim().replace(/,$/, '').trim()
    if (value && !tags.includes(value)) {
      onChange([...tags, value])
    }
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="tags-input-wrapper" onClick={(e) => e.currentTarget.querySelector('input').focus()}>
      {tags.map((tag) => (
        <span className="tag" key={tag}>
          {tag}
          <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))}>×</button>
        </span>
      ))}
      <input
        value={input}
        placeholder={tags.length === 0 ? placeholder : ''}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addTag(input) }}
      />
    </div>
  )
}
