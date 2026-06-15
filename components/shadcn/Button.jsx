import React from 'react'
import clsx from 'clsx'

export default function Button({ children, variant = 'default', className = '', ...props }) {
  const base = 'inline-flex items-center px-4 py-2 rounded-md text-sm font-medium'
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
    destructive: 'bg-red-600 text-white hover:bg-red-700'
  }
  return (
    <button className={clsx(base, variants[variant], className)} {...props}>{children}</button>
  )
}
