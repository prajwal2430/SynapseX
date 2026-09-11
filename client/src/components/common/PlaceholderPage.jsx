import './PlaceholderPage.css'

export default function PlaceholderPage({ icon: Icon, title, description, tag }) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-inner">
        <div className="placeholder-icon-wrap">
          <Icon size={36} strokeWidth={1.2} className="placeholder-icon" />
          <div className="placeholder-icon-ring" />
        </div>
        <div className="placeholder-text">
          {tag && <span className="placeholder-tag">{tag}</span>}
          <h2 className="placeholder-title">{title}</h2>
          <p className="placeholder-desc">{description}</p>
        </div>
        <div className="placeholder-grid-bg" />
      </div>
    </div>
  )
}
