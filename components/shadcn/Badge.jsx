import React from 'react'
import clsx from 'clsx'

export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-surface-100 text-surface-700 border border-surface-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-red-50 text-red-700 border border-red-200',
    info: 'bg-primary-50 text-primary-700 border border-primary-200',
    outline: 'bg-transparent border border-surface-300 text-surface-600',
    premium: 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white',
  }
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide', variants[variant], className)}>
      {children}
    </span>
  )
}
