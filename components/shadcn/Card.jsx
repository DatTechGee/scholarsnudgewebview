import React from 'react'

export default function Card({ children, className = '', glass = false }) {
  return (
    <div className={`${glass ? 'glass-card' : 'card-base'} ${className}`}>{children}</div>
  )
}
