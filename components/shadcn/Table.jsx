import React from 'react'

export function Table({ children }) {
  return <div className="overflow-x-auto"><table className="min-w-full">{children}</table></div>
}

export function Thead({ children }) {
  return <thead className="bg-slate-50 text-left text-sm">{children}</thead>
}

export function Th({ children, className = '' }) {
  return <th className={`px-4 py-3 font-medium text-slate-600 ${className}`}>{children}</th>
}

export function Tbody({ children }) {
  return <tbody>{children}</tbody>
}

export function Tr({ children, className = '' }) {
  return <tr className={`border-t hover:bg-slate-50 ${className}`}>{children}</tr>
}

export function Td({ children, className = '' }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>
}
