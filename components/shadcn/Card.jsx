import React from 'react'

export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-surface-200/60 shadow-soft ${className}`}>{children}</div>
  )
}
