import React from 'react'

export function Table({ children }) {
  return <div className="overflow-x-auto"><table className="min-w-full">{children}</table></div>
}

export function Thead({ children }) {
  return <thead className="bg-gradient-to-r from-surface-50 to-surface-100/50 text-left text-[11px] font-bold text-surface-500 uppercase tracking-wider">{children}</thead>
}

export function Th({ children, className = '' }) {
  return <th className={`px-5 py-4 ${className}`}>{children}</th>
}

export function Tbody({ children }) {
  return <tbody className="divide-y divide-surface-100/80">{children}</tbody>
}

export function Tr({ children, className = '' }) {
  return <tr className={`transition-all duration-150 hover:bg-primary-50/40 hover:shadow-sm ${className}`}>{children}</tr>
}

export function Td({ children, className = '' }) {
  return <td className={`px-5 py-4 text-sm ${className}`}>{children}</td>
}
