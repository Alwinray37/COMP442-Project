
const fieldGroups = [
  {
    label: 'Full name',
    name: 'fullName',
    type: 'text',
    placeholder: 'Jane Doe',
  },
  {
    label: 'Email',
    name: 'email',
    type: 'email',
    placeholder: 'jane@example.com',
  },
  {
    label: 'Phone',
    name: 'phone',
    type: 'tel',
    placeholder: '(555) 123-4567',
  },
  {
    label: 'Location',
    name: 'location',
    type: 'text',
    placeholder: 'Toronto, ON',
  },
  {
    label: 'Headline',
    name: 'headline',
    type: 'text',
    placeholder: 'Data analyst focused on resume parsing and matching',
  },
]

const textAreas = [
  {
    label: 'Summary',
    name: 'summary',
    placeholder: 'Write a short summary of your background and goals.',
  },
  {
    label: 'Skills',
    name: 'skills',
    placeholder: 'Python, pandas, SQL, data cleaning, React',
  },
  {
    label: 'Experience',
    name: 'experience',
    placeholder: 'Describe your roles, projects, and outcomes.',
  },
  {
    label: 'Education',
    name: 'education',
    placeholder: 'School, degree, graduation year',
  },
  {
    label: 'Links',
    name: 'links',
    placeholder: 'https://github.com/your-handle, https://linkedin.com/in/your-handle',
  },
]

export default function Form({ value, onChange, onSubmit, isSubmitting }) {
  return (
    <form className="resume-form" onSubmit={onSubmit}>
      <div className="form-grid">
        {fieldGroups.map((field) => (
          <label className="field" htmlFor={field.name} key={field.name}>
            <span>{field.label}</span>
            <input
              id={field.name}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              value={value[field.name]}
              onChange={(event) => onChange(field.name, event.target.value)}
            />
          </label>
        ))}
      </div>

      <div className="textarea-grid">
        {textAreas.map((field) => (
          <label className="field field--wide" htmlFor={field.name} key={field.name}>
            <span>{field.label}</span>
            <textarea
              id={field.name}
              name={field.name}
              rows="4"
              placeholder={field.placeholder}
              value={value[field.name]}
              onChange={(event) => onChange(field.name, event.target.value)}
            />
          </label>
        ))}
      </div>

      <button className="submit-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving JSON...' : 'Save resume as JSON'}
      </button>
    </form>
  )
}