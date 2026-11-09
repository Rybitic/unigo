// UniGO data layer — localStorage "demo mode" backend.
//
// The API is deliberately backend-shaped (users, swipes, matches, messages,
// sessions) so it maps 1:1 onto the tables in supabase/schema.sql.
// The signed-in user lives in sessionStorage (per tab) so two tabs can be two
// different accounts chatting in real time via the `storage` event.

import { useSyncExternalStore } from 'react'
import { SEED_USERS, seedActivity, DEMO_EMAIL, DEMO_PASSWORD } from './seed'
import { computeMatch } from './matching'
import { botReply, botSessionResponse } from './bots'

const KEY = 'unigo:db:v1'
const SESSION_KEY = 'unigo:session'

let state = null
let version = 0
const listeners = new Set()

const uid = (p) => `${p}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-3)}`

async function hash(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function blank() {
  return { users: {}, credentials: {}, swipes: [], matches: [], messages: {}, sessions: [], reads: {}, settings: {} }
}

async function seed() {
  const s = blank()
  for (const u of SEED_USERS) {
    const { likes, ...profile } = u
    s.users[u.id] = { ...profile, email: u.email || `${u.id.slice(2)}@unigo.app`, onboarded: true, createdAt: Date.now() - 30 * 864e5, isBot: !u.isDemo, botLikes: likes || [] }
  }
  const salt = 'demo'
  s.credentials[DEMO_EMAIL] = { userId: 'u_priya', salt, hash: await hash(DEMO_PASSWORD, salt) }
  Object.assign(s, seedActivity())
  return s
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('UniGO: could not persist', e)
  }
}

function commit() {
  persist()
  emit()
}

function emit() {
  version++
  listeners.forEach((l) => l())
}

export async function initDB() {
  state = load()
  if (!state) {
    state = await seed()
    persist()
  }
  // Ask the browser not to evict saved accounts under storage pressure.
  navigator.storage?.persist?.().catch(() => {})
  window.addEventListener('storage', (e) => {
    if (e.key === KEY && e.newValue) {
      state = JSON.parse(e.newValue)
      emit()
    }
  })
}

// Restores the sample community but keeps every registered account and profile.
export async function resetDemo() {
  const accounts = Object.entries(state.credentials)
    .filter(([, c]) => c.userId !== 'u_priya' && state.users[c.userId])
    .map(([email, cred]) => ({ email, cred, user: state.users[cred.userId] }))
  state = await seed()
  for (const { email, cred, user } of accounts) {
    state.credentials[email] = cred
    state.users[cred.userId] = user
  }
  sessionStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(SESSION_KEY)
  commit()
}

// ---------- React binding ----------
const subscribe = (l) => (listeners.add(l), () => listeners.delete(l))
export const useDB = () => useSyncExternalStore(subscribe, () => version)

// ---------- Auth ----------
export function currentUserId() {
  const id = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY)
  return id && state.users[id] ? id : null
}
export const currentUser = () => state.users[currentUserId()] || null

function setSession(id) {
  state.users[id].lastLoginAt = Date.now()
  persist()
  sessionStorage.setItem(SESSION_KEY, id)
  localStorage.setItem(SESSION_KEY, id)
  emit()
}

export async function signUp({ name, email, password }) {
  email = email.trim().toLowerCase()
  if (state.credentials[email]) throw new Error('An account with this email already exists. Try logging in.')
  if (password.length < 6) throw new Error('Password must be at least 6 characters.')
  const id = uid('u')
  const salt = Math.random().toString(36).slice(2)
  state.credentials[email] = { userId: id, salt, hash: await hash(password, salt) }
  state.users[id] = {
    id, email, name: name.trim(), avatar: '', bio: '', headline: '', university: '',
    location: { city: '', country: '' }, teach: [], learn: [], interests: [], format: 'both',
    availability: { days: [], times: [] }, onboarded: false, createdAt: Date.now(),
  }
  persist()
  setSession(id)
  return state.users[id]
}

export async function logIn({ email, password }) {
  email = email.trim().toLowerCase()
  const cred = state.credentials[email]
  if (!cred) throw new Error('No account with this email on this device. Accounts are saved in the browser you signed up in.')
  if ((await hash(password, cred.salt)) !== cred.hash) throw new Error('Incorrect password. Please try again.')
  setSession(cred.userId)
  return state.users[cred.userId]
}

// Accounts registered in this browser, most recently used first.
export function savedAccounts() {
  return Object.values(state.credentials)
    .map((c) => state.users[c.userId])
    .filter((u) => u && !u.isDemo)
    .sort((a, b) => (b.lastLoginAt || b.createdAt) - (a.lastLoginAt || a.createdAt))
}

export const logInDemo = () => logIn({ email: DEMO_EMAIL, password: DEMO_PASSWORD })

export function logOut() {
  sessionStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(SESSION_KEY)
  emit()
}

export async function changePassword(oldPw, newPw) {
  const me = currentUser()
  const cred = state.credentials[me.email]
  if ((await hash(oldPw, cred.salt)) !== cred.hash) throw new Error('Current password is incorrect.')
  if (newPw.length < 6) throw new Error('New password must be at least 6 characters.')
  cred.hash = await hash(newPw, cred.salt)
  commit()
}

export function deleteAccount() {
  const id = currentUserId()
  const me = state.users[id]
  delete state.credentials[me.email]
  delete state.users[id]
  const gone = state.matches.filter((m) => m.users.includes(id)).map((m) => m.id)
  state.matches = state.matches.filter((m) => !gone.includes(m.id))
  gone.forEach((m) => delete state.messages[m])
  state.swipes = state.swipes.filter((s) => s.from !== id && s.to !== id)
  state.sessions = state.sessions.filter((s) => !gone.includes(s.matchId))
  logOut()
  commit()
}

// ---------- Profiles ----------
export const getUser = (id) => state.users[id]
export const allUsers = () => Object.values(state.users)

export function updateProfile(patch) {
  const id = currentUserId()
  state.users[id] = { ...state.users[id], ...patch }
  commit()
}

export function profileCompletion(u) {
  const checks = [
    ['Add a profile photo', !!u.avatar],
    ['Write a short bio', (u.bio || '').length >= 30],
    ['Add your location', !!u.location?.city],
    ['Add your university or headline', !!(u.university || u.headline)],
    ['Add a skill you can teach', u.teach.length > 0],
    ['Add a skill you want to learn', u.learn.length > 0],
    ['Set your availability', u.availability.days.length > 0],
    ['Pick some interests', u.interests.length >= 2],
  ]
  const done = checks.filter((c) => c[1]).length
  return { pct: Math.round((done / checks.length) * 100), checks }
}

// ---------- Swipes & matches ----------
const swipeOf = (from, to) => state.swipes.find((s) => s.from === from && s.to === to)

export function matchBetween(a, b) {
  return state.matches.find((m) => m.users.includes(a) && m.users.includes(b))
}

export function myMatches() {
  const id = currentUserId()
  return state.matches
    .filter((m) => m.users.includes(id))
    .map((m) => ({ ...m, other: state.users[m.users.find((u) => u !== id)] }))
    .filter((m) => m.other)
    .sort((a, b) => lastActivity(b) - lastActivity(a))
}

function lastActivity(m) {
  const msgs = state.messages[m.id] || []
  return msgs.length ? msgs[msgs.length - 1].at : m.at
}

// Would this bot like the user back? Explicit seeded likes, or a genuine
// compatibility check from the bot's own perspective.
function botLikes(bot, me) {
  if (bot.botLikes?.includes(me.id)) return true
  const m = computeMatch(bot, me)
  return m.score >= 55 || (m.reciprocal && m.score >= 45)
}

export function discoverQueue() {
  const me = currentUser()
  const swiped = new Set(state.swipes.filter((s) => s.from === me.id).map((s) => s.to))
  return allUsers().filter((u) => u.id !== me.id && u.onboarded && state.settings[u.id]?.discoverable !== false && !swiped.has(u.id) && !matchBetween(me.id, u.id))
}

// Profiles that liked me and I haven't answered (bots "like" lazily based on compatibility).
export function incomingLikes() {
  const me = currentUser()
  if (!me) return []
  return allUsers().filter((u) => {
    if (u.id === me.id || !u.onboarded || matchBetween(me.id, u.id) || swipeOf(me.id, u.id)) return false
    if (swipeOf(u.id, me.id)?.action === 'like') return true
    return u.isBot && u.botLikes?.includes(me.id)
  })
}

export function sentLikes() {
  const id = currentUserId()
  return state.swipes
    .filter((s) => s.from === id && s.action === 'like' && !matchBetween(id, s.to))
    .map((s) => ({ ...s, user: state.users[s.to] }))
    .filter((s) => s.user)
}

/** Returns the new match if this swipe created one. */
export function swipe(toId, action) {
  const me = currentUser()
  state.swipes = state.swipes.filter((s) => !(s.from === me.id && s.to === toId))
  state.swipes.push({ from: me.id, to: toId, action, at: Date.now() })
  let match = null
  if (action === 'like') {
    const other = state.users[toId]
    const theyLike = swipeOf(toId, me.id)?.action === 'like' || (other.isBot && botLikes(other, me))
    if (theyLike && !matchBetween(me.id, toId)) {
      if (other.isBot && !swipeOf(toId, me.id)) state.swipes.push({ from: toId, to: me.id, action: 'like', at: Date.now() })
      match = { id: uid('m'), users: [me.id, toId], at: Date.now() }
      state.matches.push(match)
      state.messages[match.id] = []
      if (other.isBot) scheduleBot(match.id, toId, 'opener', 4000)
    }
  }
  commit()
  return match
}

export function undoSwipe(toId) {
  const id = currentUserId()
  state.swipes = state.swipes.filter((s) => !(s.from === id && s.to === toId))
  commit()
}

export function clearPasses() {
  const id = currentUserId()
  state.swipes = state.swipes.filter((s) => !(s.from === id && s.action === 'pass'))
  commit()
}

export function unmatch(matchId) {
  const id = currentUserId()
  const m = state.matches.find((x) => x.id === matchId)
  if (!m) return
  const other = m.users.find((u) => u !== id)
  state.matches = state.matches.filter((x) => x.id !== matchId)
  delete state.messages[matchId]
  state.sessions = state.sessions.filter((s) => s.matchId !== matchId)
  state.swipes = state.swipes.filter((s) => !(s.from === id && s.to === other))
  state.swipes.push({ from: id, to: other, action: 'pass', at: Date.now() })
  commit()
}

// ---------- Messages ----------
export const messagesFor = (matchId) => state.messages[matchId] || []
export const getMatch = (matchId) => state.matches.find((m) => m.id === matchId)

export function sendMessage(matchId, text, extra = {}) {
  const me = currentUserId()
  const msg = { id: uid('msg'), from: me, text, at: Date.now(), ...extra }
  ;(state.messages[matchId] ||= []).push(msg)
  markRead(matchId, false)
  commit()
  const other = state.users[getMatch(matchId).users.find((u) => u !== me)]
  if (other?.isBot && !extra.type) scheduleBot(matchId, other.id, 'reply', 1800 + Math.random() * 2200)
  return msg
}

export function markRead(matchId, save = true) {
  const me = currentUserId()
  ;(state.reads[me] ||= {})[matchId] = Date.now()
  if (save) commit()
}

export function unreadCount(matchId) {
  const me = currentUserId()
  const seen = state.reads[me]?.[matchId] || 0
  return messagesFor(matchId).filter((m) => m.from !== me && m.at > seen).length
}

export const totalUnread = () => myMatches().reduce((n, m) => n + unreadCount(m.id), 0)

// Typing indicator state (not persisted).
export const typing = {}

const pendingBots = new Set()
function scheduleBot(matchId, botId, kind, delay) {
  const key = `${matchId}:${kind}`
  if (pendingBots.has(key)) return
  pendingBots.add(key)
  setTimeout(() => {
    typing[matchId] = botId
    emit()
    setTimeout(() => {
      pendingBots.delete(key)
      delete typing[matchId]
      const m = getMatch(matchId)
      if (!m) return emit()
      const bot = state.users[botId]
      const human = state.users[m.users.find((u) => u !== botId)]
      const text = botReply(bot, human, messagesFor(matchId), kind)
      ;(state.messages[matchId] ||= []).push({ id: uid('msg'), from: botId, text, at: Date.now() })
      commit()
    }, kind === 'opener' ? 2600 : 1800)
  }, delay)
}

// ---------- Learning sessions ----------
export const sessionsFor = (matchId) => state.sessions.filter((s) => s.matchId === matchId)
export const getSession = (id) => state.sessions.find((s) => s.id === id)

export function mySessions() {
  const id = currentUserId()
  return state.sessions
    .filter((s) => s.proposer === id || s.partner === id)
    .map((s) => ({ ...s, other: state.users[s.proposer === id ? s.partner : s.proposer] }))
    .filter((s) => s.other)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
}

export function proposeSession(matchId, data) {
  const me = currentUserId()
  const m = getMatch(matchId)
  const partner = m.users.find((u) => u !== me)
  const s = { id: uid('s'), matchId, proposer: me, partner, status: 'proposed', at: Date.now(), ...data }
  state.sessions.push(s)
  sendMessage(matchId, '', { type: 'session', sessionId: s.id })
  const other = state.users[partner]
  if (other?.isBot) {
    setTimeout(() => {
      const live = getSession(s.id)
      if (!live || live.status !== 'proposed') return
      live.status = 'confirmed'
      ;(state.messages[matchId] ||= []).push({ id: uid('msg'), from: partner, text: botSessionResponse(other, live), at: Date.now() })
      commit()
    }, 3500)
  }
  return s
}

export function setSessionStatus(id, status) {
  const s = getSession(id)
  if (!s) return
  s.status = status
  commit()
}

export function learningProgress(userId = currentUserId()) {
  const u = state.users[userId]
  const done = state.sessions.filter((s) => s.status === 'completed')
  const learnt = u.learn.map((l) => {
    const ss = done.filter((s) => s.learner === userId && s.skill === l.skill)
    const minutes = ss.reduce((a, s) => a + Number(s.duration || 0), 0)
    return { skill: l.skill, level: l.level, sessions: ss.length, minutes, goalMinutes: 600 }
  })
  const taught = done.filter((s) => s.teacher === userId)
  return {
    learnt,
    taughtSessions: taught.length,
    taughtMinutes: taught.reduce((a, s) => a + Number(s.duration || 0), 0),
    learntMinutes: done.filter((s) => s.learner === userId).reduce((a, s) => a + Number(s.duration || 0), 0),
  }
}

// ---------- Settings ----------
const DEFAULT_SETTINGS = { reciprocalFirst: true, showInPerson: true, showOnline: true, emailNotifs: true, matchNotifs: true, messageNotifs: true, showLocation: true, discoverable: true }
export const getSettings = () => ({ ...DEFAULT_SETTINGS, ...(state.settings[currentUserId()] || {}) })
export function updateSettings(patch) {
  state.settings[currentUserId()] = { ...getSettings(), ...patch }
  commit()
}

export const isReady = () => !!state
