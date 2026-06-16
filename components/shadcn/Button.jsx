import React from 'react'
import clsx from 'clsx'

export default function Button({ children, variant = 'default', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.97]'
  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  }
  const variants = {
    default: 'text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-glow hover:shadow-glow-lg focus:ring-primary-400',
    secondary: 'bg-white text-surface-700 hover:bg-surface-50 border-2 border-surface-200 hover:border-surface-300 focus:ring-surface-300 shadow-soft',
    ghost: 'bg-transparent text-surface-600 hover:bg-surface-100 hover:text-surface-800 focus:ring-surface-300',
    destructive: 'text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-200/50 hover:shadow-red-300/50 focus:ring-red-400',
    outline: 'border-2 border-primary-200 text-primary-600 hover:bg-primary-50 hover:border-primary-300 focus:ring-primary-300',
    success: 'text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-glow-green focus:ring-emerald-400',
  }
  return (
    <button className={clsx(base, sizes[size], variants[variant], className)} {...props}>{children}</button>
  )
}
