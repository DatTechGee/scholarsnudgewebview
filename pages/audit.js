import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Card from '../components/shadcn/Card'
import Badge from '../components/shadcn/Badge'
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/shadcn/Table'

export default function Audit() {
  const [token, setToken] = useState('')
  const [logs, setLogs] = useState([])

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    setToken(t)
  }, [])

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-slate-500">Change history for users, sessions, and locations</p>
        </div>
      </div>

      {!token ? (
        <Card className="p-8 text-center text-slate-400">Enter your admin token in the Users page first.</Card>
      ) : (
        <Card className="p-5">
          <p className="text-slate-500">Audit log integration pending backend endpoint. Check back after `/api/admin/audit-logs` is available.</p>
        </Card>
      )}
    </Layout>
  )
}
