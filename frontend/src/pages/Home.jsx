import { Link } from 'react-router-dom'

const techStack = [
  'React',
  'Vite',
  'React Router',
  'JSON profile intake',
  'Machine Learning',
  'Natural Language Processing',
  'Future ranking model',
]

export default function Home() {
  return (
    <main className="app-shell">
      <nav className="navbar">
        <Link className="brand" to="/">
          SmartResume
        </Link>
        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#how-to-use">How to use</a>
          <a href="#tech-stack">Tech stack</a>
          <Link className="nav-action" to="/intake">
            Start intake
          </Link>
        </div>
      </nav>

      <header className="hero-panel">
        <p className="eyebrow">COMP442 ML/NLP Project</p>
        <h1>Tailor complete resume profiles to specific job postings.</h1>
        <p className="hero-copy">
          SmartResume is a system that analyzes a user's full background,
          compares it with a target job description, and recommends the most relevant
          experiences, skills, projects, and qualifications.
        </p>
        <div className="hero-actions">
          <Link className="primary-action" to="/intake">
            Go to intake
          </Link>
          <a className="secondary-action" href="#about">
            Learn more
          </a>
        </div>
      </header>

      <section id="about" className="content-panel">
        <div className="section-header">
          <p className="card-label">Project info</p>
          <h2>What the project does</h2>
        </div>
        <p>
          Job seekers often have more experience than should fit on one targeted resume. This
          project uses Machine Learning and Natural Language Processing to rank which jobs,
          projects, education, certifications, volunteer work, and skills best match a job
          posting.
        </p>
      </section>

      <section id="how-to-use" className="content-grid">
        <article className="info-card">
          <p className="card-label">Step 1</p>
          <h2>Add your profile</h2>
          <p>Upload a resume PDF or manually enter every resume section as structured data.</p>
        </article>
        <article className="info-card">
          <p className="card-label">Step 2</p>
          <h2>Add a job post</h2>
          <p>Provide the target role description the model will compare against the profile.</p>
        </article>
        <article className="info-card">
          <p className="card-label">Step 3</p>
          <h2>Review ranking</h2>
          <p>Use ranked recommendations to build a resume focused on that specific job.</p>
        </article>
      </section>

      <section id="tech-stack" className="content-panel">
        <div className="section-header">
          <p className="card-label">Tech stack</p>
          <h2>Current build</h2>
        </div>
        <div className="stack-list">
          {techStack.map((tech) => (
            <span key={tech}>{tech}</span>
          ))}
        </div>
      </section>
    </main>
  )
}
