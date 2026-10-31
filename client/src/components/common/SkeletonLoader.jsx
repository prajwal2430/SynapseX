import React from 'react'
import './SkeletonLoader.css'

export default function SkeletonLoader({ type = 'card', count = 3, height, width }) {
  if (type === 'table') {
    return (
      <div className="skeleton-table-wrap">
        <div className="skeleton-table-header skeleton" />
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-table-row skeleton" />
        ))}
      </div>
    )
  }

  if (type === 'timeline') {
    return (
      <div className="skeleton-timeline-wrap">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-timeline-item">
            <div className="skeleton-glyph skeleton" />
            <div className="skeleton-timeline-card skeleton" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="skeleton-card skeleton" 
          style={{ height: height || '140px', width: width || '100%' }} 
        />
      ))}
    </div>
  )
}
