import React from 'react'

export default function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`px-3.5 py-2.5 border border-surface-300 rounded-lg w-full text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow ${className}`}
    />
  )
}
