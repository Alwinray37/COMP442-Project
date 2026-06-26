import { Link } from 'react-router-dom'
import AppNav from '../components/AppNav.jsx'

const techStack = [
  'React',
  'Vite',
  'Python',
  'Flask',
  'scikit-learn',
  'TF-IDF',
  'Cosine Similarity',
  'O*NET Database',
  'pandas',
  'Natural Language Processing',
]

export default function Home() {
  return (
    <main className="app-shell">
      <AppNav actions={<Link className="nav-action" to="/intake">Get started</Link>} />

      <header className="hero-panel card">
        <p className="eyebrow">COMP442 ML/NLP Project</p>
        <h1>Explore career paths that match your background.</h1>
        <p className="hero-copy">
          Upload a PDF resume or enter only the background details the recommender needs.
          The app turns your skills, experience, education, and interests into ranked
          occupation matches from the O*NET database.
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
          This COMP442 project connects a React intake flow to a Flask recommendation API.
          It collects resume-like text, predicts the closest career area, compares the profile
          against O*NET occupation descriptions, and returns specific job titles with match scores.
        </p>
      </section>

      <section id="how-it-works" className="content-grid">
        <article className="info-card card">
          <p className="card-label">Step 1</p>
          <h2>Add useful signals</h2>
          <p>Upload a resume PDF or manually enter goals, skills, interests, experience, and education.</p>
        </article>
        <article className="info-card card">
          <p className="card-label">Step 2</p>
          <h2>Run the API</h2>
          <p>The frontend sends one combined text profile to the Flask backend for matching.</p>
        </article>
        <article className="info-card card">
          <p className="card-label">Step 3</p>
          <h2>Review matches</h2>
          <p>See the predicted category and ranked O*NET job titles with similarity scores.</p>
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
