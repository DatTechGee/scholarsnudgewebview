import React from 'react'

export function Table({ children }) {
  return <div className="overflow-x-auto rounded-lg border border-surface-200/60"><table className="min-w-full">{children}</table></div>
}

export function Thead({ children }) {
  return <thead className="bg-surface-50 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">{children}</thead>
}

export function Th({ children, className = '' }) {
  return <th className={`px-4 py-3.5 ${className}`}>{children}</th>
}

export function Tbody({ children }) {
  return <tbody className="divide-y divide-surface-100">{children}</tbody>
}

export function Tr({ children, className = '' }) {
  return <tr className={`hover:bg-surface-50 transition-colors ${className}`}>{children}</tr>
}

export function Td({ children, className = '' }) {
  return <td className={`px-4 py-3.5 text-sm ${className}`}>{children}</td>
}
