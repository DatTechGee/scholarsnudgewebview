import React from 'react'
import clsx from 'clsx'

export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-surface-100 text-surface-700',
    success: 'bg-accent-50 text-accent-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-primary-50 text-primary-700',
    outline: 'bg-transparent border border-surface-300 text-surface-600',
  }
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
