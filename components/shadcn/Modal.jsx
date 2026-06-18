import React from 'react'

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md animate-fade-in p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-premium max-w-lg w-full max-h-[85vh] overflow-auto animate-scale-in border border-surface-200/60" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <h3 className="text-lg font-bold text-surface-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
