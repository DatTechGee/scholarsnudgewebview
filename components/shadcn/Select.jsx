import React from 'react'

export default function Select({ options, value, onChange, placeholder, icon, className = '' }) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-primary-500/10 flex items-center justify-center pointer-events-none z-10">
          {icon}
        </div>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-[52px] rounded-xl border-2 bg-surface-50/80 px-4 text-sm font-medium text-surface-800 focus:outline-none focus:border-primary-400 focus:bg-white transition-all appearance-none cursor-pointer ${icon ? 'pl-12' : ''} ${className}`}
      >
        {placeholder ? <option value="" className="text-surface-400">{placeholder}</option> : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    </div>
  )
}
