import { Link, NavLink } from 'react-router-dom'

export default function AppNav({ actions }) {
  return (
    <nav className="navbar">
      <Link className="brand" to="/">COMP442 Project</Link>
      <div className="nav-workflow" aria-label="App flow">
        <NavLink to="/" end className={({ isActive }) => `workflow-link${isActive ? ' is-active' : ''}`}>
          Home
        </NavLink>
        <NavLink to="/intake" className={({ isActive }) => `workflow-link${isActive ? ' is-active' : ''}`}>
          Intake
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `workflow-link${isActive ? ' is-active' : ''}`}>
          Recommendations
        </NavLink>
      </div>
      {actions && <div className="nav-actions">{actions}</div>}
    </nav>
  )
}
