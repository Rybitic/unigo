// UniGO compatibility engine.
//
// Every score is computed from profile data. Weights (total 100):
//   30  Skills I want to learn that they can teach
//   25  Skills they want to learn that I can teach
//   10  Reciprocity bonus (a genuine two-way swap)
//   15  Experience-level fit on the skills being exchanged
//   10  Shared interests and shared learning goals
//   10  Logistics: learning format, location, availability overlap

import { categoryOf, levelIndex, LEVELS } from './skills'

export const WEIGHTS = { learn: 30, teach: 25, reciprocity: 10, level: 15, shared: 10, logistics: 10 }

// How well should a teacher at `t` serve a learner currently at `l`?
function levelFit(t, l) {
  const diff = levelIndex(t) - levelIndex(l)
  if (diff >= 2) return 1
  if (diff === 1) return 0.85
  if (diff === 0) return 0.45
  return 0.15
}

// How well does `teacher` cover what `learner` wants to learn?
function coverage(learner, teacher) {
  const wants = learner.learn || []
  const offers = teacher.teach || []
  const exact = []
  const related = []
  let miss = 1
  for (const w of wants) {
    const t = offers.find((s) => s.skill === w.skill)
    if (t) {
      exact.push({ skill: w.skill, teacherLevel: t.level, learnerLevel: w.level, fit: levelFit(t.level, w.level) })
      miss *= 0.4
      continue
    }
    const rel = offers.find((s) => categoryOf(s.skill) === categoryOf(w.skill))
    if (rel) {
      related.push({ want: w.skill, offer: rel.skill })
      miss *= 0.8
    }
  }
  // Diminishing returns: one exact skill = 60%, two = 84%, three = 94%.
  return { value: 1 - miss, exact, related }
}

function overlap(a = [], b = []) {
  if (!a.length || !b.length) return 0
  const setB = new Set(b)
  const n = a.filter((x) => setB.has(x)).length
  return n / Math.min(a.length, b.length)
}

function formatFit(a, b) {
  if (a === b) return 1
  if (a === 'both' || b === 'both') return 0.9
  return 0
}

function effectiveFormat(a, b) {
  if (a === 'online' || b === 'online') return a === 'in-person' || b === 'in-person' ? 'conflict' : 'online'
  if (a === 'in-person' || b === 'in-person') return 'in-person'
  return 'both'
}

function locationFit(me, them, format) {
  const sameCity = me.location?.city && me.location.city.toLowerCase() === them.location?.city?.toLowerCase()
  const sameCountry = me.location?.country && me.location.country.toLowerCase() === them.location?.country?.toLowerCase()
  const base = sameCity ? 1 : sameCountry ? 0.5 : 0
  // Location barely matters if the swap happens online.
  return format === 'online' ? Math.max(base, 0.8) : base
}

export function computeMatch(me, them) {
  const learn = coverage(me, them) // they teach me
  const teach = coverage(them, me) // I teach them

  const pts = {}
  pts.learn = WEIGHTS.learn * learn.value
  pts.teach = WEIGHTS.teach * teach.value

  const reciprocal = learn.exact.length > 0 && teach.exact.length > 0
  const halfReciprocal =
    (learn.exact.length > 0 && teach.related.length > 0) || (teach.exact.length > 0 && learn.related.length > 0)
  pts.reciprocity = reciprocal ? WEIGHTS.reciprocity : halfReciprocal ? WEIGHTS.reciprocity * 0.4 : 0

  const pairs = [...learn.exact, ...teach.exact]
  pts.level = pairs.length ? WEIGHTS.level * (pairs.reduce((s, p) => s + p.fit, 0) / pairs.length) : 0

  const sharedInterests = (me.interests || []).filter((i) => (them.interests || []).includes(i))
  const sharedGoals = (me.learn || []).map((s) => s.skill).filter((s) => (them.learn || []).some((x) => x.skill === s))
  pts.shared = WEIGHTS.shared * Math.min(1, sharedInterests.length * 0.25 + sharedGoals.length * 0.3)

  const fmt = effectiveFormat(me.format, them.format)
  const fFit = formatFit(me.format, them.format)
  const lFit = locationFit(me, them, fmt)
  const dayFit = overlap(me.availability?.days, them.availability?.days)
  const timeFit = overlap(me.availability?.times, them.availability?.times)
  pts.logistics = 4 * fFit + 3 * lFit + 3 * (0.5 * dayFit + 0.5 * timeFit)

  const raw = Object.values(pts).reduce((a, b) => a + b, 0)
  const score = Math.max(0, Math.min(100, Math.round(raw)))

  const reasons = []
  if (learn.exact.length)
    reasons.push({ type: 'learn', text: `Can teach you ${list(learn.exact.map((e) => e.skill))}` })
  if (teach.exact.length)
    reasons.push({ type: 'teach', text: `Wants to learn ${list(teach.exact.map((e) => e.skill))} — which you teach` })
  if (!learn.exact.length && learn.related.length)
    reasons.push({ type: 'related', text: `Teaches ${learn.related[0].offer}, close to your goal of ${learn.related[0].want}` })
  if (pairs.some((p) => p.fit >= 0.85)) reasons.push({ type: 'level', text: 'Experience levels are a great fit' })
  if (sharedInterests.length) reasons.push({ type: 'interest', text: `Both into ${list(sharedInterests)}` })
  if (sharedGoals.length) reasons.push({ type: 'goal', text: `Also learning ${list(sharedGoals)} — study buddy potential` })
  if (fFit > 0 && lFit === 1 && fmt !== 'online') reasons.push({ type: 'location', text: `Also in ${them.location.city} — meet in person` })
  else if (fmt === 'online' || me.format === 'both') {
    if (fFit > 0) reasons.push({ type: 'format', text: `Happy to swap ${fmt === 'online' ? 'online' : 'online or in person'}` })
  }
  if (fmt === 'conflict') reasons.push({ type: 'warn', text: 'Different learning formats preferred' })

  return {
    score,
    tier: tierFor(score, reciprocal),
    reciprocal,
    breakdown: Object.fromEntries(Object.entries(pts).map(([k, v]) => [k, Math.round(v * 10) / 10])),
    theyTeachMe: learn.exact,
    iTeachThem: teach.exact,
    related: learn.related,
    sharedInterests,
    sharedGoals,
    reasons,
  }
}

export function tierFor(score, reciprocal) {
  if (score >= 78 && reciprocal) return { label: 'Perfect Swap', tone: 'perfect' }
  if (score >= 65) return { label: 'Strong Match', tone: 'strong' }
  if (score >= 45) return { label: 'Good Match', tone: 'good' }
  return { label: 'Worth Exploring', tone: 'explore' }
}

export function rankCandidates(me, users) {
  return users
    .map((u) => ({ user: u, match: computeMatch(me, u) }))
    .sort((a, b) => b.match.reciprocal - a.match.reciprocal || b.match.score - a.match.score)
}

function list(items) {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} & ${items[items.length - 1]}`
}

export const BREAKDOWN_LABELS = {
  learn: 'They teach what you want',
  teach: 'You teach what they want',
  reciprocity: 'Two-way swap bonus',
  level: 'Experience-level fit',
  shared: 'Shared interests & goals',
  logistics: 'Format, location & availability',
}

export { LEVELS }
