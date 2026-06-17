import { useEffect, useState, useCallback, useRef } from 'react'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Badge from '../../components/shadcn/Badge'
import Button from '../../components/shadcn/Button'
import Input from '../../components/shadcn/Input'
import { getConversations, getMessages, sendMessage, getUnreadCount, markMessagesRead, searchUsers } from '../../services/api'

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function StudentChat() {
  const [token, setToken] = useState('')
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [unread, setUnread] = useState(0)
  const [showNewChat, setShowNewChat] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)

  const getToken = useCallback(() => {
    const t = typeof window !== 'undefined' ? window.localStorage.getItem('admin_token') || '' : ''
    setToken(t)
    return t
  }, [])

  const loadConversations = useCallback(async (t) => {
    if (!t) return
    try {
      const convs = await getConversations(t)
      setConversations(Array.isArray(convs) ? convs : [])
    } catch (e) { console.warn('Failed to load conversations:', e) }
    finally { setLoading(false) }
  }, [])

  const loadUnread = useCallback(async (t) => {
    if (!t) return
    try {
      const count = await getUnreadCount(t)
      setUnread(count)
    } catch (e) {}
  }, [])

  useEffect(() => {
    const t = getToken()
    if (t) { loadConversations(t); loadUnread(t) }
    else setLoading(false)
  }, [getToken, loadConversations, loadUnread])

  useEffect(() => {
    if (!token) return
    const interval = setInterval(() => loadUnread(token), 15000)
    return () => clearInterval(interval)
  }, [token, loadUnread])

  const openConversation = async (conv) => {
    setActiveConv(conv)
    try {
      const msgs = await getMessages(token, conv.id)
      setMessages(Array.isArray(msgs) ? msgs : [])
      await markMessagesRead(token, conv.id)
      loadUnread(token)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 200)
    } catch (e) { console.warn('Failed to load messages:', e) }
  }

  const handleSend = async () => {
    if (!text.trim() || !activeConv || sending) return
    setSending(true)
    try {
      await sendMessage(token, { receiver_id: activeConv.id, message: text.trim() })
      setText('')
      const msgs = await getMessages(token, activeConv.id)
      setMessages(Array.isArray(msgs) ? msgs : [])
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 200)
    } catch (e) { console.warn('Send failed:', e) }
    finally { setSending(false) }
  }

  const handleSearch = async (q) => {
    setSearchQuery(q)
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    try {
      const users = await searchUsers(token, q)
      setSearchResults(Array.isArray(users) ? users : [])
    } catch (e) { console.warn('Search failed:', e) }
    finally { setSearching(false) }
  }

  const startNewChat = async (u) => {
    setShowNewChat(false)
    setSearchQuery('')
    setSearchResults([])
    setActiveConv({ id: u.id, name: u.name, email: u.email, role: u.role })
    try {
      const msgs = await getMessages(token, u.id)
      setMessages(Array.isArray(msgs) ? msgs : [])
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 200)
    } catch (e) { console.warn('Failed:', e) }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  if (!token) {
    return <Layout><Card className="p-8 text-center"><p className="text-slate-500">Please sign in first.</p></Card></Layout>
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-7rem)] gap-4">
        {/* Conversation sidebar */}
        <div className="w-80 shrink-0 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-800 text-sm">Messages</h2>
              {unread > 0 && <Badge variant="danger" className="text-[10px]">{unread}</Badge>}
            </div>
            <button onClick={() => setShowNewChat(!showNewChat)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary-600 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>

          {showNewChat && (
            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search lecturers..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-primary-400"
              />
              {searching ? (
                <div className="text-xs text-slate-400 text-center py-3">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="mt-2 space-y-1">
                  {searchResults.map(u => (
                    <button key={u.id} onClick={() => startNewChat(u)} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-primary-50 transition-all text-left">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold text-xs">{u.name?.charAt(0) || '?'}</div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-700 truncate">{u.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{u.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div className="text-xs text-slate-400 text-center py-3">No users found</div>
              ) : null}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-3/4" />
                    <div className="h-2 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 px-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
                <p className="text-sm text-slate-500 font-medium">No conversations</p>
                <p className="text-xs text-slate-400 mt-1">Tap + to message your lecturer</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className={`w-full flex items-center gap-3 p-4 transition-all text-left border-b border-slate-50 hover:bg-slate-50 ${activeConv?.id === conv.id ? 'bg-primary-50/50 border-l-2 border-l-primary-500' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 bg-gradient-to-br ${activeConv?.id === conv.id ? 'from-primary-500 to-secondary-600' : 'from-slate-400 to-slate-500'}`}>
                    {conv.name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${activeConv?.id === conv.id ? 'font-bold text-primary-700' : 'font-semibold text-slate-700'}`}>{conv.name}</span>
                      {conv.last_message_at && <span className="text-[10px] text-slate-400 shrink-0">{formatTime(conv.last_message_at)}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-slate-500 truncate">{conv.last_message || (conv.role === 'lecturer' ? 'Lecturer' : 'Student')}</span>
                      {conv.unread_count > 0 && (
                        <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{conv.unread_count}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-700">Your Messages</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-xs">Select a conversation or start a new one to message your lecturer about attendance issues.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-r from-slate-50 to-white">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold text-sm">{activeConv.name?.charAt(0) || '?'}</div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{activeConv.name}</h3>
                  <p className="text-[11px] text-slate-500 font-medium">{activeConv.email} · {activeConv.role || 'User'}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/50">
                {messages.map(msg => {
                  const userData = typeof window !== 'undefined' ? JSON.parse(window.localStorage.getItem('user_data') || '{}') : {}
                  const isMine = String(msg.sender_id) === String(userData?.id)
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${isMine ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-br-md' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm'}`}>
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                        <p className={`text-[10px] mt-1.5 font-medium ${isMine ? 'text-primary-200' : 'text-slate-400'}`}>{formatTime(msg.created_at)}</p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="px-5 py-4 border-t border-slate-100 bg-white">
                <div className="flex gap-3 items-end">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-primary-400 focus:bg-white resize-none transition-all"
                    style={{ minHeight: 44, maxHeight: 120 }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!text.trim() || sending}
                    className="w-11 h-11 rounded-2xl bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 shadow-sm"
                  >
                    {sending ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
