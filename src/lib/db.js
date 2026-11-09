// UniGO data layer, backed by Supabase (Auth + Postgres).
//
// The Supabase project may be shared with another app, so UniGO only ever
// signs users up, in and out — it never edits or deletes a login — and only
// touches its own unigo_ tables.
//
// Pages read from an in-memory copy of the signed-in user's data, so the UI
// stays synchronous and instant. Every change is applied locally first and
// then written to the database; a light poll keeps the copy in sync with
// changes made by other people (likes, matches, messages) and other devices.
// The demo community members (seed.js) live in the code and act on the
// client, but everything they do with you is stored in the database too.

import { useSyncExternalStore } from 'react'
import { createClient } from '@supabase/supabase-js'
import { SEED_USERS, seedActivity } from './seed'
import { computeMatch } from './matching'
import { botReply, botSessionResponse } from './bots'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

export const isConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY)
const supabase = isConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null

const BOTS = Object.fromEntries(
  SEED_USERS.filter((u) => !u.isDemo).map(({ likes, ...u }) => [
    u.id,
    { ...u, email: `${u.id.slice(2)}@unigo.app`, onboarded: true, createdAt: Date.now() - 30 * 864e5, isBot: true, botLikes: likes || [] },
  ]),
)

let authId = null
let state = blank()
let version = 0
let pending = 0
let pollTimer = null
const listeners = new Set()

function blank() {
  return { users: { ...BOTS }, swipes: [], matches: [], messages: {}, sessions: [] }
}

const uid = (p) => `${p}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`

function emit() {
  version++
  listeners.forEach((l) => l())
}

function reportError(err) {
  console.error('UniGO:', err)
  window.dispatchEvent(new CustomEvent('unigo:error', { detail: err?.message || String(err) }))
}

// Run a database write without blocking the UI. Polling pauses while writes
// are in flight so it never overwrites a change that hasn't landed yet.
function remote(fn) {
  if (localDemo) return Promise.resolve()
  pending++
  return Promise.resolve()
    .then(fn)
    .then((res) => {
      if (res?.error) throw res.error
      return res
    })
    .catch((err) => {
      reportError(err)
      refresh(true)
    })
    .finally(() => pending--)
}

// ---------- Row mapping ----------
const toSwipe = (r) => ({ from: r.from_id, to: r.to_id, action: r.action, at: Number(r.at) })
const toMatch = (r) => ({ id: r.id, users: [r.user_a, r.user_b], at: Number(r.at) })
const toMessage = (r) => ({ id: r.id, from: r.from_id, text: r.body || '', at: Number(r.at), ...(r.type ? { type: r.type, sessionId: r.session_id } : {}) })
const toSession = (r) => ({ ...r.data, id: r.id, matchId: r.match_id })
const toProfile = (r) => ({ ...r.data, id: r.id, email: r.email })

const swipeRow = (s) => ({ from_id: s.from, to_id: s.to, action: s.action, at: s.at })
const matchRow = (m) => ({ id: m.id, user_a: m.users[0], user_b: m.users[1], at: m.at })
const messageRow = (matchId, m) => ({ id: m.id, match_id: matchId, from_id: m.from, body: m.text, type: m.type || null, session_id: m.sessionId || null, at: m.at })
const sessionRow = ({ id, matchId, ...data }) => ({ id, match_id: matchId, data, at: data.at })

// ---------- Loading & sync ----------
let tick = 0
async function refresh(withProfiles = false) {
  if (!authId || pending || localDemo) return
  const me = authId
  const q = [supabase.from('unigo_swipes').select('*'), supabase.from('unigo_matches').select('*')]
  if (withProfiles) q.push(supabase.from('unigo_profiles').select('id,email,data'))
  const [sw, ma, pr] = await Promise.all(q)
  const err = sw.error || ma.error || pr?.error
  if (err) return reportError(err)
  const matches = ma.data.map(toMatch)
  const ids = matches.map((m) => m.id)
  let msgs = { data: [] }
  let sess = { data: [] }
  if (ids.length) {
    ;[msgs, sess] = await Promise.all([
      supabase.from('unigo_messages').select('*').in('match_id', ids).order('at'),
      supabase.from('unigo_learning_sessions').select('*').in('match_id', ids),
    ])
    if (msgs.error || sess.error) return reportError(msgs.error || sess.error)
  }
  // Discard if the user signed out, or made a change while we were fetching.
  if (authId !== me || pending) return

  const messages = {}
  for (const id of ids) messages[id] = []
  for (const r of msgs.data) (messages[r.match_id] ||= []).push(toMessage(r))
  // Keep any local-only typing/bot messages ordering stable.
  for (const id of ids) messages[id].sort((a, b) => a.at - b.at)

  const users = withProfiles ? { ...BOTS, ...Object.fromEntries(pr.data.map((r) => [r.id, toProfile(r)])) } : state.users
  state = { users, swipes: sw.data.map(toSwipe), matches, messages, sessions: sess.data.map(toSession) }
  emit()
}

function startPolling() {
  stopPolling()
  pollTimer = setInterval(() => {
    if (document.hidden) return
    tick++
    refresh(tick % 5 === 0)
  }, 4000)
}
function stopPolling() {
  clearInterval(pollTimer)
  pollTimer = null
}

async function enterSession(user) {
  authId = user.id
  await refresh(true)
  if (!state.users[authId]) {
    // First sign-in for this account: create its profile.
    const profile = newProfile(user.email, user.user_metadata?.name || user.email.split('@')[0])
    state.users[authId] = profile
    const { error } = await supabase.from('unigo_profiles').insert({ id: authId, email: user.email, data: strip(profile) })
    if (error && error.code !== '23505') throw error
    await refresh(true)
  }
  startPolling()
  emit()
}

function leaveSession() {
  authId = null
  stopPolling()
  state = blank()
  emit()
}

export async function initDB() {
  let demo = false
  try {
    demo = sessionStorage.getItem(DEMO_KEY) === '1'
  } catch {}
  if (demo) return startDemo()
  if (!supabase) return
  const { data } = await supabase.auth.getSession()
  if (data.session) {
    try {
      await enterSession(data.session.user)
    } catch (err) {
      reportError(err)
    }
  }
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT' && !localDemo) leaveSession()
  })
  document.addEventListener('visibilitychange', () => !document.hidden && refresh(true))
}

// ---------- React binding ----------
const subscribe = (l) => (listeners.add(l), () => listeners.delete(l))
export const useDB = () => useSyncExternalStore(subscribe, () => version)

// ---------- Auth ----------
export const currentUserId = () => (authId && state.users[authId] ? authId : null)
export const currentUser = () => state.users[currentUserId()] || null

function newProfile(email, name) {
  return {
    id: authId, email, name: name.trim(), avatar: '', bio: '', headline: '', university: '',
    location: { city: '', country: '' }, teach: [], learn: [], interests: [], format: 'both',
    availability: { days: [], times: [] }, onboarded: false, createdAt: Date.now(), settings: {}, reads: {},
  }
}

const strip = ({ id, email, ...data }) => data

function friendly(err) {
  const m = err?.message || ''
  if (/invalid login credentials/i.test(m)) return new Error('Incorrect email or password.')
  if (/already registered|already exists/i.test(m)) return new Error('An account with this email already exists. Try logging in.')
  if (/email not confirmed/i.test(m)) return new Error('Please confirm your email address first — check your inbox.')
  if (/password/i.test(m) && /6/.test(m)) return new Error('Password must be at least 6 characters.')
  if (/failed to fetch|network/i.test(m)) return new Error("Can't reach the server. Check your internet connection and try again.")
  return new Error(m || 'Something went wrong. Please try again.')
}

function requireBackend() {
  if (!supabase) throw new Error('The database is not connected yet.')
}

export async function signUp({ name, email, password }) {
  requireBackend()
  email = email.trim().toLowerCase()
  if (password.length < 6) throw new Error('Password must be at least 6 characters.')
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name: name.trim() } } })
  if (error) throw friendly(error)
  // With email confirmation on, Supabase returns a user with no identities for an existing email.
  if (data.user && !data.user.identities?.length) throw new Error('An account with this email already exists. Try logging in.')
  if (!data.session) throw new Error('Account created! Check your email to confirm it, then log in.')
  await enterSession(data.user)
  return currentUser()
}

export async function logIn({ email, password }) {
  requireBackend()
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
  if (error) throw friendly(error)
  await enterSession(data.user)
  return currentUser()
}

// The demo is a sample account that lives only in this browser tab: it shows
// a lived-in history (matches, chats, sessions) and nothing it does is saved.
const DEMO_KEY = 'unigo:demo'
let localDemo = false
export const isLocalDemo = () => localDemo

function startDemo() {
  localDemo = true
  stopPolling()
  const { likes, ...priya } = SEED_USERS.find((u) => u.isDemo)
  const act = seedActivity()
  authId = priya.id
  state = blank()
  state.users[authId] = { ...priya, onboarded: true, createdAt: Date.now(), settings: {}, reads: act.reads[authId] || {} }
  state.swipes = act.swipes
  state.matches = act.matches
  state.messages = act.messages
  state.sessions = act.sessions
  try {
    sessionStorage.setItem(DEMO_KEY, '1')
  } catch {}
  emit()
}

export async function logInDemo() {
  if (supabase) await supabase.auth.signOut()
  startDemo()
  return currentUser()
}

export async function logOut() {
  const wasDemo = localDemo
  localDemo = false
  try {
    sessionStorage.removeItem(DEMO_KEY)
  } catch {}
  leaveSession()
  if (!wasDemo) await supabase?.auth.signOut()
}

export async function deleteAccount() {
  if (currentUser()?.isDemo) throw new Error("The shared demo account can't be deleted.")
  const { error } = await supabase.rpc('unigo_delete_my_account')
  if (error) throw friendly(error)
  await logOut()
}

// ---------- Profiles ----------
export const getUser = (id) => state.users[id]
export const allUsers = () => Object.values(state.users)

let profileTimer = null
function saveProfile() {
  if (localDemo) return
  if (profileTimer) clearTimeout(profileTimer)
  else pending++
  profileTimer = setTimeout(() => {
    profileTimer = null
    pending--
    const me = state.users[authId]
    if (me) remote(() => supabase.from('unigo_profiles').update({ data: strip(me), updated_at: new Date().toISOString() }).eq('id', authId))
  }, 600)
}

export function updateProfile(patch) {
  state.users[authId] = { ...state.users[authId], ...patch }
  emit()
  saveProfile()
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

// Would this demo member like the user back? Explicit seeded likes for the
// demo account, or a genuine compatibility check from the bot's perspective.
function botLikes(bot, me) {
  if (me.isDemo && bot.botLikes?.includes('u_priya')) return true
  const m = computeMatch(bot, me)
  return m.score >= 55 || (m.reciprocal && m.score >= 45)
}

export function discoverQueue() {
  const me = currentUser()
  const swiped = new Set(state.swipes.filter((s) => s.from === me.id).map((s) => s.to))
  return allUsers().filter((u) => u.id !== me.id && u.onboarded && u.settings?.discoverable !== false && !swiped.has(u.id) && !matchBetween(me.id, u.id))
}

// Profiles that liked me and I haven't answered.
export function incomingLikes() {
  const me = currentUser()
  if (!me) return []
  return allUsers().filter((u) => {
    if (u.id === me.id || !u.onboarded || matchBetween(me.id, u.id) || swipeOf(me.id, u.id)) return false
    if (swipeOf(u.id, me.id)?.action === 'like') return true
    return u.isBot && me.isDemo && u.botLikes?.includes('u_priya')
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
  const mine = { from: me.id, to: toId, action, at: Date.now() }
  state.swipes = state.swipes.filter((s) => !(s.from === me.id && s.to === toId))
  state.swipes.push(mine)
  const rows = [swipeRow(mine)]
  let match = null
  if (action === 'like') {
    const other = state.users[toId]
    const theyLike = swipeOf(toId, me.id)?.action === 'like' || (other.isBot && botLikes(other, me))
    if (theyLike && !matchBetween(me.id, toId)) {
      if (other.isBot && !swipeOf(toId, me.id)) {
        const back = { from: toId, to: me.id, action: 'like', at: Date.now() }
        state.swipes.push(back)
        rows.push(swipeRow(back))
      }
      match = { id: uid('m'), users: [me.id, toId], at: Date.now() }
      state.matches.push(match)
      state.messages[match.id] = []
      if (other.isBot) scheduleBot(match.id, toId, 'opener', 4000)
    }
  }
  emit()
  remote(async () => {
    const r = await supabase.from('unigo_swipes').upsert(rows)
    if (r.error || !match) return r
    return supabase.from('unigo_matches').insert(matchRow(match))
  })
  return match
}

export function undoSwipe(toId) {
  const id = currentUserId()
  state.swipes = state.swipes.filter((s) => !(s.from === id && s.to === toId))
  emit()
  remote(() => supabase.from('unigo_swipes').delete().eq('from_id', id).eq('to_id', toId))
}

export function clearPasses() {
  const id = currentUserId()
  state.swipes = state.swipes.filter((s) => !(s.from === id && s.action === 'pass'))
  emit()
  remote(() => supabase.from('unigo_swipes').delete().eq('from_id', id).eq('action', 'pass'))
}

export function unmatch(matchId) {
  const id = currentUserId()
  const m = state.matches.find((x) => x.id === matchId)
  if (!m) return
  const other = m.users.find((u) => u !== id)
  state.matches = state.matches.filter((x) => x.id !== matchId)
  delete state.messages[matchId]
  state.sessions = state.sessions.filter((s) => s.matchId !== matchId)
  const pass = { from: id, to: other, action: 'pass', at: Date.now() }
  state.swipes = state.swipes.filter((s) => !(s.from === id && s.to === other))
  state.swipes.push(pass)
  emit()
  remote(async () => {
    const r = await supabase.from('unigo_matches').delete().eq('id', matchId)
    return r.error ? r : supabase.from('unigo_swipes').upsert(swipeRow(pass))
  })
}

// ---------- Messages ----------
export const messagesFor = (matchId) => state.messages[matchId] || []
export const getMatch = (matchId) => state.matches.find((m) => m.id === matchId)

function pushMessage(matchId, msg) {
  ;(state.messages[matchId] ||= []).push(msg)
  remote(() => supabase.from('unigo_messages').insert(messageRow(matchId, msg)))
}

export function sendMessage(matchId, text, extra = {}) {
  const me = currentUserId()
  const msg = { id: uid('msg'), from: me, text, at: Date.now(), ...extra }
  pushMessage(matchId, msg)
  markRead(matchId)
  const other = state.users[getMatch(matchId).users.find((u) => u !== me)]
  if (other?.isBot && !extra.type) scheduleBot(matchId, other.id, 'reply', 1800 + Math.random() * 2200)
  return msg
}

export function markRead(matchId) {
  const me = state.users[authId]
  if (!me) return
  const last = messagesFor(matchId).slice(-1)[0]
  if (last && (me.reads?.[matchId] || 0) >= last.at) return
  me.reads = { ...(me.reads || {}), [matchId]: Date.now() }
  emit()
  saveProfile()
}

export function unreadCount(matchId) {
  const me = currentUser()
  const seen = me?.reads?.[matchId] || 0
  return messagesFor(matchId).filter((m) => m.from !== me?.id && m.at > seen).length
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
      pushMessage(matchId, { id: uid('msg'), from: botId, text: botReply(bot, human, messagesFor(matchId), kind), at: Date.now() })
      emit()
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
  const msg = { id: uid('msg'), from: me, text: '', at: Date.now(), type: 'session', sessionId: s.id }
  ;(state.messages[matchId] ||= []).push(msg)
  // The session row must exist before the chat message that points at it.
  remote(async () => {
    const r = await supabase.from('unigo_learning_sessions').insert(sessionRow(s))
    return r.error ? r : supabase.from('unigo_messages').insert(messageRow(matchId, msg))
  })
  emit()
  const other = state.users[partner]
  if (other?.isBot) {
    setTimeout(() => {
      const live = getSession(s.id)
      if (!live || live.status !== 'proposed') return
      setSessionStatus(s.id, 'confirmed')
      pushMessage(matchId, { id: uid('msg'), from: partner, text: botSessionResponse(other, live), at: Date.now() })
      emit()
    }, 3500)
  }
  return s
}

export function setSessionStatus(id, status) {
  const s = getSession(id)
  if (!s) return
  s.status = status
  emit()
  remote(() => supabase.from('unigo_learning_sessions').update({ data: sessionRow(s).data }).eq('id', id))
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

// ---------- Settings (stored on the profile) ----------
const DEFAULT_SETTINGS = { reciprocalFirst: true, emailNotifs: true, matchNotifs: true, messageNotifs: true, discoverable: true }
export const getSettings = () => ({ ...DEFAULT_SETTINGS, ...(currentUser()?.settings || {}) })
export function updateSettings(patch) {
  updateProfile({ settings: { ...getSettings(), ...patch } })
}
