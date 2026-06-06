import { useState } from 'react'
import { Link } from 'react-router-dom'

const emptyJob = {
  title: '',
  company: '',
  location: '',
  description: '',
  skills: '',
}

const emptyEducation = {
  school: '',
  degree: '',
  location: '',
  dates: '',
  details: '',
}

const emptyProject = {
  name: '',
  role: '',
  link: '',
  description: '',
  skills: '',
}

export default function Intake() {
  const [entryMode, setEntryMode] = useState('pdf')
  const [resumePdf, setResumePdf] = useState(null)
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    headline: '',
    summary: '',
    links: '',
  })
  const [jobs, setJobs] = useState([{ ...emptyJob }])
  const [education, setEducation] = useState([{ ...emptyEducation }])
  const [projects, setProjects] = useState([{ ...emptyProject }])

  const updateProfile = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }))
  }

  const updateItem = (setter, index, field, value) => {
    setter((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    )
  }

  return (
    <main className="app-shell input-shell">
      <nav className="navbar">
        <Link className="brand" to="/">
          Resume Matcher
        </Link>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link className="nav-action" to="/intake">
            Intake
          </Link>
        </div>
      </nav>

      <header className="input-hero">
        <div>
          <p className="eyebrow">Resume intake</p>
          <h1>Build the resume profile.</h1>
          <p className="hero-copy">
            Pick a PDF upload or manually enter resume sections. This screen only designs the
            data entry experience; it does not save to local storage yet.
          </p>
        </div>
        <div className="status-card">
          <p className="card-label">Current mode</p>
          <p>{entryMode === 'pdf' ? 'PDF upload selected' : 'Manual entry selected'}</p>
          {resumePdf ? <p className="file-meta">{resumePdf.name}</p> : null}
        </div>
      </header>

      <section className="mode-switch" aria-label="Resume entry mode">
        <button
          className={entryMode === 'pdf' ? 'is-active' : ''}
          type="button"
          onClick={() => setEntryMode('pdf')}
        >
          Upload PDF
        </button>
        <button
          className={entryMode === 'manual' ? 'is-active' : ''}
          type="button"
          onClick={() => setEntryMode('manual')}
        >
          Manual entry
        </button>
      </section>

      {entryMode === 'pdf' ? (
        <section className="panel">
          <p className="card-label">Upload</p>
          <h2>Resume PDF</h2>
          <p>Select a PDF resume. Parsing and storage will be connected after the UI is approved.</p>
          <label className="upload-dropzone" htmlFor="resumePdf">
            <span>Choose PDF</span>
            <small>{resumePdf ? resumePdf.name : 'PDF only'}</small>
            <input
              id="resumePdf"
              type="file"
              accept="application/pdf"
              onChange={(event) => setResumePdf(event.target.files?.[0] ?? null)}
            />
          </label>
        </section>
      ) : (
        <form className="intake-form">
          <FormSection title="Profile" label="Basics">
            <div className="form-grid">
              <TextField label="Full name" value={profile.fullName} onChange={(value) => updateProfile('fullName', value)} />
              <TextField label="Email" type="email" value={profile.email} onChange={(value) => updateProfile('email', value)} />
              <TextField label="Phone" value={profile.phone} onChange={(value) => updateProfile('phone', value)} />
              <TextField label="Location" value={profile.location} onChange={(value) => updateProfile('location', value)} />
              <TextField label="Headline" value={profile.headline} onChange={(value) => updateProfile('headline', value)} wide />
              <TextArea label="Summary" value={profile.summary} onChange={(value) => updateProfile('summary', value)} />
              <TextArea label="Links" value={profile.links} onChange={(value) => updateProfile('links', value)} placeholder="Portfolio, GitHub, LinkedIn" />
            </div>
          </FormSection>

          <FormSection title="Experience" label="Jobs">
            {jobs.map((job, index) => (
              <div className="repeat-card" key={`job-${index}`}>
                <div className="repeat-header">
                  <h3>Job {index + 1}</h3>
                </div>
                <div className="form-grid">
                  <TextField label="Position / job title" value={job.title} onChange={(value) => updateItem(setJobs, index, 'title', value)} />
                  <TextField label="Company" value={job.company} onChange={(value) => updateItem(setJobs, index, 'company', value)} />
                  <TextField label="Location" value={job.location} onChange={(value) => updateItem(setJobs, index, 'location', value)} />
                  <TextField label="Skills" value={job.skills} onChange={(value) => updateItem(setJobs, index, 'skills', value)} placeholder="React, SQL, Python" />
                  <TextArea label="Description" value={job.description} onChange={(value) => updateItem(setJobs, index, 'description', value)} />
                </div>
              </div>
            ))}
            <button className="secondary-button" type="button" onClick={() => setJobs((items) => [...items, { ...emptyJob }])}>
              Add another job
            </button>
          </FormSection>

          <FormSection title="Education" label="Schools">
            {education.map((item, index) => (
              <div className="repeat-card" key={`education-${index}`}>
                <div className="form-grid">
                  <TextField label="School" value={item.school} onChange={(value) => updateItem(setEducation, index, 'school', value)} />
                  <TextField label="Degree" value={item.degree} onChange={(value) => updateItem(setEducation, index, 'degree', value)} />
                  <TextField label="Location" value={item.location} onChange={(value) => updateItem(setEducation, index, 'location', value)} />
                  <TextField label="Dates" value={item.dates} onChange={(value) => updateItem(setEducation, index, 'dates', value)} />
                  <TextArea label="Details" value={item.details} onChange={(value) => updateItem(setEducation, index, 'details', value)} />
                </div>
              </div>
            ))}
            <button className="secondary-button" type="button" onClick={() => setEducation((items) => [...items, { ...emptyEducation }])}>
              Add education
            </button>
          </FormSection>

          <FormSection title="Projects" label="Work samples">
            {projects.map((project, index) => (
              <div className="repeat-card" key={`project-${index}`}>
                <div className="form-grid">
                  <TextField label="Project name" value={project.name} onChange={(value) => updateItem(setProjects, index, 'name', value)} />
                  <TextField label="Role" value={project.role} onChange={(value) => updateItem(setProjects, index, 'role', value)} />
                  <TextField label="Link" value={project.link} onChange={(value) => updateItem(setProjects, index, 'link', value)} />
                  <TextField label="Skills" value={project.skills} onChange={(value) => updateItem(setProjects, index, 'skills', value)} />
                  <TextArea label="Description" value={project.description} onChange={(value) => updateItem(setProjects, index, 'description', value)} />
                </div>
              </div>
            ))}
            <button className="secondary-button" type="button" onClick={() => setProjects((items) => [...items, { ...emptyProject }])}>
              Add project
            </button>
          </FormSection>
        </form>
      )}
    </main>
  )
}

function FormSection({ title, label, children }) {
  return (
    <section className="panel form-section">
      <p className="card-label">{label}</p>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function TextField({ label, value, onChange, type = 'text', placeholder = '', wide = false }) {
  return (
    <label className={wide ? 'field field--wide' : 'field'}>
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function TextArea({ label, value, onChange, placeholder = '' }) {
  return (
    <label className="field field--wide">
      <span>{label}</span>
      <textarea
        rows="4"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
