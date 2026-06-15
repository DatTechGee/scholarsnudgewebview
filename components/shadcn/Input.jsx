import React from 'react'

export default function Input({ icon, className = '', ...props }) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-primary-500/10 flex items-center justify-center">
          {icon}
        </div>
      )}
      <input
        {...props}
        className={`w-full h-[52px] rounded-xl border-2 bg-surface-50/80 px-4 text-sm font-medium text-surface-800 placeholder:text-surface-400 focus:outline-none focus:border-primary-400 focus:bg-white transition-all ${icon ? 'pl-12' : ''} ${className}`}
      />
    </div>
  )
}
