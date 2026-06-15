import React from 'react'
import clsx from 'clsx'

export default function Button({ children, variant = 'default', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2',
  }
  const variants = {
    default: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm',
    secondary: 'bg-surface-100 text-surface-700 hover:bg-surface-200 focus:ring-surface-400',
    ghost: 'bg-transparent text-surface-600 hover:bg-surface-100 focus:ring-surface-300',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
    outline: 'border border-surface-300 text-surface-700 hover:bg-surface-50 focus:ring-surface-400',
  }
  return (
    <button className={clsx(base, sizes[size], variants[variant], className)} {...props}>{children}</button>
  )
}
