import { Link } from 'react-router-dom'

const techStack = [
  'React',
  'Vite',
  'Python',
  'Flask',
  'scikit-learn',
  'TF-IDF',
  'Logistic Regression',
  'O*NET Database',
  'pandas',
  'Natural Language Processing',
]

export default function Home() {
  return (
    <main className="app-shell">
      <nav className="navbar">
        <Link className="brand" to="/">COMP442 Project – Job Recommender</Link>
        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#how-it-works">How it works</a>
          <a href="#tech-stack">Tech stack</a>
          <Link className="nav-action" to="/intake">Get started</Link>
        </div>
      </nav>

      <header className="hero-panel card">
        <p className="eyebrow">COMP442 ML/NLP Project</p>
        <h1>Discover job titles that fit your background.</h1>
        <p className="hero-copy">
          Upload your resume or enter your experience, education, skills, and interests.
          Our machine learning model will recommend the job titles best suited for you —
          across all industries, not just tech.
        </p>
        <div className="hero-actions">
          <Link className="btn-primary" to="/intake">Start now</Link>
          <a className="btn-secondary" href="#how-it-works">Learn more</a>
        </div>
      </header>

      <section id="about" className="content-panel card">
        <div className="section-header">
          <p className="card-label">About</p>
          <h2>What this project does</h2>
        </div>
        <p>
          Many job seekers don't know what roles they qualify for or what fields align with their
          interests. This project uses machine learning and the O*NET occupational database to
          analyze your full background — skills, experience, education, and personal interests —
          and surfaces the job titles most likely to be a strong fit for you.
        </p>
      </section>

      <section id="how-it-works" className="content-grid">
        <article className="info-card card">
          <p className="card-label">Step 1</p>
          <h2>Build your profile</h2>
          <p>Upload a resume PDF or manually enter your experience, education, skills, and interests.</p>
        </article>
        <article className="info-card card">
          <p className="card-label">Step 2</p>
          <h2>Run the model</h2>
          <p>Our ML pipeline analyzes your profile against thousands of O*NET occupation profiles to find the best matches.</p>
        </article>
        <article className="info-card card">
          <p className="card-label">Step 3</p>
          <h2>Review results</h2>
          <p>Get a ranked list of job titles with fit scores — and the option to explore more beyond the top 5.</p>
        </article>
      </section>

      <section id="tech-stack" className="content-panel card">
        <div className="section-header">
          <p className="card-label">Tech stack</p>
          <h2>Built with</h2>
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
