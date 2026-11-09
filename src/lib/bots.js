// Demo community members reply to messages so the chat can be experienced
// end to end without a second human. Replies use the real match data.

import { computeMatch } from './matching'

const pick = (arr, seed) => arr[Math.abs(seed) % arr.length]
const first = (name) => name.split(' ')[0]

export function botReply(bot, human, history, kind) {
  const m = computeMatch(bot, human) // from the bot's perspective
  const learn = m.theyTeachMe[0]?.skill // what the bot learns from the human
  const teach = m.iTeachThem[0]?.skill // what the bot teaches the human
  const seed = history.length + bot.id.length

  if (kind === 'opener') {
    if (learn && teach)
      return `Hey ${first(human.name)}! 👋 Love this match — I've been wanting to learn ${learn} for ages, and I'd be really happy to teach you ${teach} in return. How does a first session this week sound?`
    if (learn) return `Hi ${first(human.name)}! I'd really love to learn ${learn} from you. What would you like to get out of a swap?`
    if (teach) return `Hey ${first(human.name)}! Happy to help you with ${teach}. What's your current level and what are you aiming for?`
    return `Hi ${first(human.name)}! Great to connect on UniGO 😊 What are you hoping to learn right now?`
  }

  const last = [...history].reverse().find((x) => x.from === human.id && x.text)?.text?.toLowerCase() || ''

  if (/\b(when|time|free|available|schedule|session|meet|call)\b/.test(last)) {
    const days = bot.availability.days.slice(0, 2).join(' or ')
    const time = (bot.availability.times[0] || 'evening').toLowerCase()
    return `I'm usually free ${days} in the ${time}. Hit "Arrange session" up top and pick a slot that works — I'll confirm it straight away 🗓️`
  }
  if (/\b(online|zoom|meet|teams|in person|in-person|coffee|campus|library)\b/.test(last)) {
    return bot.format === 'online'
      ? 'Online works best for me — I can send a Google Meet link.'
      : bot.format === 'in-person'
        ? `I prefer meeting in person if possible — anywhere central in ${bot.location.city}?`
        : 'Either works for me! Online is easiest for a first session, then we can meet up.'
  }
  if (/\b(level|beginner|experience|start|basics|know)\b/.test(last) && teach) {
    return `No worries at all. For ${teach} I usually start with a quick chat about your goals, then we build one small real project together. Way more fun than tutorials.`
  }
  if (/\b(thanks|thank you|cheers|great|awesome|perfect|amazing)\b/.test(last)) {
    return pick(['Anytime! This is exactly why I joined UniGO 🙌', 'Of course! Looking forward to it.', "Can't wait — this is going to be a great swap."], seed)
  }
  if (/\?$/.test(last.trim())) {
    return pick(
      [
        `Good question! Honestly I'd say just jump in — I learnt most of my ${bot.teach[0]?.skill} by doing.`,
        `Hmm, depends a bit on your goals. Want to walk through it in our first session?`,
        `Yes, definitely! I'll prepare a couple of examples before we meet.`,
      ],
      seed,
    )
  }
  return pick(
    [
      learn ? `That's really helpful. Any resources you'd recommend before we start on ${learn}?` : 'Sounds good to me!',
      `Nice. I'll bring some real examples from ${bot.headline?.split('·')[0]?.trim() || 'my work'} so it's practical.`,
      'Love that. Shall we lock in a time?',
      teach ? `Deal. I've got a short ${teach} exercise that would be perfect for you.` : 'Perfect 👍',
    ],
    seed,
  )
}

export function botSessionResponse(bot, s) {
  return `Confirmed ✅ See you ${new Date(`${s.date}T${s.time}`).toLocaleDateString(undefined, { weekday: 'long' })} at ${s.time} for ${s.skill}!`
}
