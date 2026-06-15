import React from 'react'
import clsx from 'clsx'

export default function Button({ children, variant = 'default', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]'
  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  }
  const variants = {
    default: 'text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 shadow-glow focus:ring-primary-400',
    secondary: 'bg-surface-100 text-surface-700 hover:bg-surface-200 border border-surface-200 focus:ring-surface-300',
    ghost: 'bg-transparent text-surface-600 hover:bg-surface-100 focus:ring-surface-300',
    destructive: 'text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-200 focus:ring-red-400',
    outline: 'border border-surface-300 text-surface-700 hover:bg-surface-50 focus:ring-surface-300',
  }
  return (
    <button className={clsx(base, sizes[size], variants[variant], className)} {...props}>{children}</button>
  )
}
