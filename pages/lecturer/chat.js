import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Badge from '../../components/shadcn/Badge'
import Input from '../../components/shadcn/Input'
import { getConversations, getMessages, sendMessage, broadcastMessage, getUnreadCount, searchUsers, markMessagesRead, getLecturerCourses } from '../../services/api'

function formatTime(d) {
  if (!d) return ''
  const date = new Date(d)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  if (sameDay) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const thisYear = date.getFullYear() === now.getFullYear()
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', ...(thisYear ? {} : { year: 'numeric' }) })
}

export default function LecturerChat() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [conversations, setConversations] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [broadcastBody, setBroadcastBody] = useState('')
  const [broadcastCourse, setBroadcastCourse] = useState('')
  const [courses, setCourses] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNewChat, setShowNewChat] = useState(false)
  const messagesEndRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    setToken(t)
    if (!t) { setLoading(false); return }
    loadData(t)
    getLecturerCourses(t).then(d => setCourses(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [])).catch(() => {})
    pollRef.current = setInterval(() => {
      getUnreadCount(t).then(r => setUnreadCount(r?.unread_count || 0)).catch(() => {})
    }, 15000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const loadData = async (t) => {
    const tk = t || token
    try {
      const [conv, unread] = await Promise.all([
        getConversations(tk),
        getUnreadCount(tk),
      ])
      setConversations(Array.isArray(conv) ? conv : [])
      setUnreadCount(unread?.unread_count || 0)
    } catch (_) {}
    finally { setLoading(false) }
  }

  const loadMessages = useCallback(async (user) => {
    if (!user || !token) return
    setSelectedUser(user)
    try {
      const data = await getMessages(user.id, token)
      setMessages(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [])
      await markMessagesRead(user.id, token)
      loadData(token)
    } catch (_) { setMessages([]) }
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [token])

  const handleSend = async () => {
    if (!input.trim() || !selectedUser || busy) return
    setBusy(true)
    try {
      const msg = await sendMessage(selectedUser.id, input.trim(), token)
      setMessages(prev => [...prev, msg])
      setInput('')
      loadData(token)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (_) { setError('Failed to send message.') }
    finally { setBusy(false) }
  }

  const handleBroadcast = async () => {
    if (!broadcastBody.trim() || !broadcastCourse || busy) return
    setBusy(true)
    try {
      await broadcastMessage(Number(broadcastCourse), broadcastBody.trim(), token)
      setShowBroadcast(false); setBroadcastBody(''); setBroadcastCourse('')
    } catch (_) { setError('Broadcast failed.') }
    finally { setBusy(false) }
  }

  const handleSearch = async (q) => {
    setSearchQuery(q)
    if (q.length < 2) { setSearchResults([]); return }
    try {
      const users = await searchUsers(q, token)
      setSearchResults(Array.isArray(users) ? users : [])
    } catch (_) { setSearchResults([]) }
  }

  const startNewChat = (user) => {
    setShowNewChat(false); setSearchQuery(''); setSearchResults([])
    const exists = conversations.find(c => c.user?.id === user.id)
    if (!exists) setConversations(prev => [{ user, last_message: null, unread_count: 0 }, ...prev])
    loadMessages(user)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  if (!token) {
    return <Layout><Card className="p-8 text-center"><p className="text-slate-500 mb-4">Please sign in first.</p><button onClick={() => router.push('/login')} className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white">Sign In</button></Card></Layout>
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Messages</h1>
          <p className="text-slate-500 text-sm flex items-center gap-2">
            Chat with students and colleagues
            {unreadCount > 0 && <Badge variant="danger" className="text-[10px]">{unreadCount} unread</Badge>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBroadcast(true)}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all flex items-center gap-1.5"
          ><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg> Broadcast</button>
          <button onClick={() => setShowNewChat(true)}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all flex items-center gap-1.5"
          ><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg> New Chat</button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-red-700 text-sm">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 font-bold">&times;</button>
        </div>
      )}

      <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[400px]">
        {/* Conversations sidebar */}
        <div className="w-80 shrink-0 flex flex-col rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <Input value={searchQuery} onChange={(e) => handleSearch(e.target.value)} placeholder="Search users..." className="pl-10 text-sm" />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1 max-h-40 overflow-auto">
                {searchResults.map(u => (
                  <button key={u.id} onClick={() => startNewChat(u)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 text-left transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {u.name?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-700 truncate">{u.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{u.email} · {u.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-3xl mb-3">💬</div>
                <p className="text-sm text-slate-400">No conversations yet.</p>
                <p className="text-xs text-slate-400 mt-1">Search for a user to start chatting.</p>
              </div>
            ) : conversations.map((conv, i) => (
              <button key={conv.user?.id || i} onClick={() => { if (conv.user) loadMessages(conv.user) }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 border-b border-slate-50 ${selectedUser?.id === conv.user?.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold text-sm">
                    {conv.user?.name?.charAt(0) || '?'}
                  </div>
                  {conv.unread_count > 0 && (
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                      {conv.unread_count}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800 truncate">{conv.user?.name || 'Unknown'}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">{formatTime(conv.last_message?.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs text-slate-500 truncate flex-1">{conv.last_message?.body || 'No messages yet'}</span>
                    {conv.last_message?.sender_id === selectedUser?.id && <span className="text-[10px] text-slate-400">· {conv.last_message?.type}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col rounded-2xl bg-white border border-slate-200 overflow-hidden">
          {selectedUser ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                  {selectedUser.name?.charAt(0) || '?'}
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">{selectedUser.name}</div>
                  <div className="text-[10px] text-slate-400">{selectedUser.email} · {selectedUser.role}</div>
                </div>
                <div className="ml-auto flex gap-1">
                  <button onClick={async () => { await loadMessages(selectedUser) }}
                    className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Refresh">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  </button>
                </div>
              </div>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="text-3xl mb-3">💬</div>
                    <p className="text-sm text-slate-400">No messages yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Send a message to start the conversation.</p>
                  </div>
                ) : messages.map((msg, i) => {
                  const isMine = msg.sender_id === selectedUser?.id
                  return (
                    <div key={msg.id || i} className={`flex ${isMine ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMine ? 'bg-slate-100 text-slate-800 rounded-bl-sm' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-sm shadow-sm'}`}>
                        <div className="whitespace-pre-wrap break-words">{msg.body}</div>
                        <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMine ? 'text-slate-400' : 'text-blue-200'}`}>
                          {formatTime(msg.created_at)}
                          {msg.type === 'broadcast' && <Badge variant={isMine ? 'info' : 'default'} className="text-[8px]">broadcast</Badge>}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
              {/* Input */}
              <div className="px-4 py-3 border-t border-slate-100 bg-white">
                <div className="flex items-end gap-2">
                  <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Type your message..." rows={1}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 transition-all min-h-[44px] max-h-32"
                  />
                  <button onClick={handleSend} disabled={busy || !input.trim()}
                    className="h-11 w-11 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-40 shrink-0"
                  ><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19V9m0 0l-3 3m3-3l3 3" /></svg></button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-4">💬</div>
                <p className="text-lg font-bold text-slate-600">Select a conversation</p>
                <p className="text-sm text-slate-400 mt-1">Choose a person from the sidebar or search for someone.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Broadcast Modal */}
      {showBroadcast && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowBroadcast(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center text-purple-600 text-lg">📢</div>
              <div>
                <h3 className="font-bold text-slate-800">Broadcast Message</h3>
                <p className="text-xs text-slate-400">Send a message to all enrolled students in a course</p>
              </div>
              <button onClick={() => setShowBroadcast(false)} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">&times;</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1.5 text-slate-700">Course</label>
                <select value={broadcastCourse} onChange={(e) => setBroadcastCourse(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-200"
                >
                  <option value="">Select a course...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.title || ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5 text-slate-700">Message</label>
                <textarea value={broadcastBody} onChange={(e) => setBroadcastBody(e.target.value)} rows={4}
                  placeholder="Type your broadcast message..." className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-200" />
              </div>
              <button onClick={handleBroadcast} disabled={busy || !broadcastBody.trim() || !broadcastCourse}
                className="w-full py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-40"
              >{busy ? 'Sending...' : 'Send Broadcast'}</button>
            </div>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowNewChat(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 text-lg">👤</div>
              <div>
                <h3 className="font-bold text-slate-800">New Conversation</h3>
                <p className="text-xs text-slate-400">Search for a user to message</p>
              </div>
              <button onClick={() => setShowNewChat(false)} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">&times;</button>
            </div>
            <Input value={searchQuery} onChange={(e) => handleSearch(e.target.value)} placeholder="Search by name or email..." className="mb-3" />
            <div className="max-h-60 overflow-auto space-y-1">
              {searchResults.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">Type at least 2 characters to search.</p>
              ) : searchResults.map(u => (
                <button key={u.id} onClick={() => startNewChat(u)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 text-left transition-all"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {u.name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-700">{u.name}</div>
                    <div className="text-xs text-slate-400">{u.email} · {u.role}</div>
                  </div>
                  <Badge variant="info" className="text-[10px]">{u.role}</Badge>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
