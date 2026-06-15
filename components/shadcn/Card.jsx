import React from 'react'

export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border rounded-md p-4 shadow-sm ${className}`}>{children}</div>
  )
}
