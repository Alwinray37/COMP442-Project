import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

const emptyJob = { title: '', company: '', location: '', dateFrom: '', dateTo: '', description: '', skills: [] }
const emptyEducation = { school: '', degree: '', location: '', dateFrom: '', dateTo: '', details: '' }
const emptyProject = { name: '', role: '', link: '', dateFrom: '', dateTo: '', description: '', skills: [] }

// Best-effort extraction helpers
function toTitleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function extractEmail(text) {
  const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  return m ? m[0] : ''
}

function extractPhone(text) {
  const m = text.match(/(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/)
  return m ? m[0] : ''
}

function extractName(text) {
  // All-caps name at very start, ends at first double space or pipe
  const m = text.slice(0, 150).match(/^([A-Z][A-Z\s]{2,40?})(?:\s{2,}|\|)/)
  if (m) return toTitleCase(m[1].trim())
  return ''
}

function extractLocation(text) {
  // Skip past the all-caps name block, then find "Title Case City, ST"
  const afterName = text.slice(0, 300).replace(/^[A-Z\s]{3,40?}\s{2,}/, '')
  const m = afterName.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Z]{2})\b/)
  return m ? m[1].trim() : ''
}

function extractLinks(text) {
  const lines = []
  const linkedin = text.match(/LinkedIn[:\s]+([^\s|]+)/i)
  const github = text.match(/GitHub[:\s]+([^\s|]+)/i)
  if (linkedin) lines.push(`LinkedIn: ${linkedin[1]}`)
  if (github) lines.push(`GitHub: ${github[1]}`)
  return lines.join('\n')
}

function extractExperience(text) {
  const section = text.match(/EXPERIENCE([\s\S]{0,3000}?)(?:EDUCATION|PROJECTS|SKILLS|CERTIFICATIONS|REFERENCES|$)/i)
  if (!section) return []

  const blocks = section[1].trim().split(/\n(?=[A-Z][a-zA-Z\s]+\s{2,}[A-Z][a-z])/)
  const jobs = []

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length < 2) continue

    const title = lines[0] || ''
    const dateLine = lines.find((l) => /\d{4}/.test(l) && /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December|Present)/i.test(l))
    const companyLine = lines.find((l) => l !== title && l !== dateLine && !l.startsWith('●') && l.length > 2)
    const descLines = lines.filter((l) => l.startsWith('●')).map((l) => l.replace(/^●\s*/, ''))

    // Parse company and location from something like "Acme Corp   Los Angeles, CA"
    const companyParts = (companyLine || '').split(/\s{2,}/)
    const company = companyParts[0] || ''
    const location = companyParts[1] || ''

    if (!title && !company) continue

    jobs.push({
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      dates: dateLine ? dateLine.trim() : '',
      description: descLines.join(' '),
      skills: [],
    })
  }

  return jobs.length > 0 ? jobs : [{ title: '', company: '', location: '', dates: '', description: '', skills: [] }]
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

    const school = schoolRaw.split(/\s*–/)[0].trim()
    const location = parts.find((p) => /^[A-Z][a-zA-Z\s]+,\s*[A-Z]{2}$/.test(p)) || ''
    const degree = parts.find((p) => /bachelor|master|associate/i.test(p)) || ''
    const dateRange = parts.find((p) => /\b(19|20)\d{2}\b/.test(p)) || ''

    edu.push({ school, location, degree, dateFrom: '', dateTo: '', dates: dateRange, details: '' })
  }

  return edu.length > 0 ? edu : [{ school: '', degree: '', location: '', dateFrom: '', dateTo: '', details: '' }]
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

  const [profile, setProfile] = useState(saved?.profile ?? {
    fullName: '', email: '', phone: '', location: '', headline: '', summary: '', links: '',
  })
  const [jobs, setJobs] = useState(saved?.experience ?? [{ ...emptyJob }])
  const [education, setEducation] = useState(saved?.education ?? [{ ...emptyEducation }])
  const [projects, setProjects] = useState(saved?.projects ?? [{ ...emptyProject }])
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
      console.log('RAW:', JSON.stringify(fullText.slice(0, 500)))
      console.log('NAME:', extractName(fullText))
      console.log('EMAIL:', extractEmail(fullText))
      console.log('PHONE:', extractPhone(fullText))
      console.log('LOCATION:', extractLocation(fullText))
      console.log('SKILLS:', extractSkills(fullText))
      console.log('EXPERIENCE:', JSON.stringify(extractExperience(fullText)))
      console.log('EDUCATION:', JSON.stringify(extractEducation(fullText)))
      // Pre-fill what we can extract
      setProfile((prev) => ({
        ...prev,
        fullName: prev.fullName || extractName(fullText),
        email: prev.email || extractEmail(fullText),
        phone: prev.phone || extractPhone(fullText),
        location: prev.location || extractLocation(fullText),
        links: prev.links || extractLinks(fullText),
      }))
      setSkills((prev) => {
        const extracted = extractSkills(fullText)
        return [...new Set([...prev, ...extracted])]
      })
      setJobs(extractExperience(fullText))
      setEducation(extractEducation(fullText))
      // Switch to manual so user can review and fill in the rest
      setEntryMode('manual')
    } catch (err) {
      setParseError('Could not parse this PDF. Please fill in your info manually.')
    } finally {
      setParsing(false)
    }
  }

  const handleSubmit = () => {
    const userProfile = {
      profile,
      experience: jobs,
      education,
      projects,
      skills,
      interests,
      rawResumeText,
    }
    localStorage.setItem('userProfile', JSON.stringify(userProfile))
    navigate('/profile')
  }

  return (
    <main className="app-shell intake-shell">
      <nav className="navbar">
        <Link className="brand" to="/">COMP442 Project – Job Recommender</Link>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link className="nav-action" to="/intake">Intake</Link>
        </div>
      </nav>

      <header className="intake-hero">
        <div className="card hero-panel">
          <p className="eyebrow">Resume intake</p>
          <h1>Build your profile.</h1>
          <p className="hero-copy">
            Enter your background and we'll recommend job titles that fit you. The more you fill in, the better the results.
          </p>
        </div>
        <div className="card status-card">
          <p className="card-label">Status</p>
          {parsing && <p>Parsing PDF…</p>}
          {!parsing && rawResumeText && <p className="file-meta">✓ PDF parsed — review and complete your profile below.</p>}
          {!parsing && !rawResumeText && <p>{entryMode === 'pdf' ? 'Upload a PDF to get started.' : 'Fill in as many sections as you can for the best recommendations.'}</p>}
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
          <FormSection label="Basics" title="Personal info">
            <div className="form-grid">
              <TextField label="Full name" value={profile.fullName} onChange={(v) => updateProfile('fullName', v)} placeholder="Jane Smith" />
              <TextField label="Email" type="email" value={profile.email} onChange={(v) => updateProfile('email', v)} placeholder="jane@email.com" />
              <TextField label="Phone" value={profile.phone} onChange={(v) => updateProfile('phone', v)} placeholder="+1 (514) 000-0000" />
              <TextField label="Location" value={profile.location} onChange={(v) => updateProfile('location', v)} placeholder="Montreal, QC" />
              <TextField label="Headline" value={profile.headline} onChange={(v) => updateProfile('headline', v)} placeholder="Recent CS graduate with a focus on data" wide />
              <TextArea label="Summary" value={profile.summary} onChange={(v) => updateProfile('summary', v)} placeholder="A short paragraph about your background, goals, and what makes you a strong candidate." />
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
                  <TextField label="Job title" value={job.title} onChange={(v) => updateItem(setJobs, index, 'title', v)} placeholder="Software Developer" />
                  <TextField label="Company" value={job.company} onChange={(v) => updateItem(setJobs, index, 'company', v)} placeholder="Acme Corp" />
                  <TextField label="Location" value={job.location} onChange={(v) => updateItem(setJobs, index, 'location', v)} placeholder="Montreal, QC" />
                  <TextField label="From" type="month" value={job.dateFrom} onChange={(v) => updateItem(setJobs, index, 'dateFrom', v)} />
                  <TextField label="To (leave blank if current)" type="month" value={job.dateTo} onChange={(v) => updateItem(setJobs, index, 'dateTo', v)} />
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
                  <h3>School {index + 1}{item.school ? ` — ${item.school}` : ''}</h3>
                  {education.length > 1 && (
                    <button className="btn-danger" type="button" onClick={() => removeItem(setEducation, index)}>
                      Remove
                    </button>
                  )}
                </div>
                <div className="form-grid">
                  <TextField label="School / University" value={item.school} onChange={(v) => updateItem(setEducation, index, 'school', v)} placeholder="Concordia University" />
                  <TextField label="Degree / Program" value={item.degree} onChange={(v) => updateItem(setEducation, index, 'degree', v)} placeholder="B.Sc. Computer Science" />
                  <TextField label="Location" value={item.location} onChange={(v) => updateItem(setEducation, index, 'location', v)} placeholder="Montreal, QC" />
                  <TextField label="From" type="month" value={item.dateFrom} onChange={(v) => updateItem(setEducation, index, 'dateFrom', v)} />
                  <TextField label="To" type="month" value={item.dateTo} onChange={(v) => updateItem(setEducation, index, 'dateTo', v)} />
                  <TextArea label="Details" value={item.details} onChange={(v) => updateItem(setEducation, index, 'details', v)} placeholder="Relevant coursework, honours, GPA, clubs, or achievements." />
                </div>
              </div>
            ))}
            <button className="btn-secondary" type="button" style={{ width: 'fit-content' }} onClick={() => setEducation((e) => [...e, { ...emptyEducation }])}>
              + Add education
            </button>
          </FormSection>

          {/* Projects */}
          <FormSection label="Projects" title="Projects">
            {projects.map((project, index) => (
              <div className="repeat-card" key={index}>
                <div className="repeat-header">
                  <h3>Project {index + 1}{project.name ? ` — ${project.name}` : ''}</h3>
                  {projects.length > 1 && (
                    <button className="btn-danger" type="button" onClick={() => removeItem(setProjects, index)}>
                      Remove
                    </button>
                  )}
                </div>
                <div className="form-grid">
                  <TextField label="Project name" value={project.name} onChange={(v) => updateItem(setProjects, index, 'name', v)} placeholder="Job Recommender System" />
                  <TextField label="Your role" value={project.role} onChange={(v) => updateItem(setProjects, index, 'role', v)} placeholder="Lead Developer" />
                  <TextField label="Link" value={project.link} onChange={(v) => updateItem(setProjects, index, 'link', v)} placeholder="github.com/jane/project" />
                  <TextField label="Date" type="month" value={project.dateFrom} onChange={(v) => updateItem(setProjects, index, 'dateFrom', v)} />
                  <TextArea label="Description" value={project.description} onChange={(v) => updateItem(setProjects, index, 'description', v)} placeholder="What did you build, what problem did it solve, and what was your contribution?" />
                  <div className="field field--wide">
                    <span>Technologies / skills</span>
                    <TagsInput
                      tags={project.skills}
                      onChange={(v) => updateItem(setProjects, index, 'skills', v)}
                      placeholder="e.g. Python, React, Machine Learning"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button className="btn-secondary" type="button" style={{ width: 'fit-content' }} onClick={() => setProjects((p) => [...p, { ...emptyProject }])}>
              + Add project
            </button>
          </FormSection>

          {/* Submit bar */}
          <div className="card submit-bar">
            <p>Your profile is saved locally — nothing is sent to a server until you submit.</p>
            <button className="btn-primary" type="button" onClick={handleSubmit}>
              Save &amp; see recommendations →
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
