// Skill catalogue, categories and experience levels.

export const CATEGORIES = {
  tech: { label: 'Tech & Code', color: '#3B82F6', emoji: '💻' },
  data: { label: 'Data & Analytics', color: '#06B6D4', emoji: '📊' },
  design: { label: 'Design & Creative', color: '#EC4899', emoji: '🎨' },
  business: { label: 'Business & Marketing', color: '#F59E0B', emoji: '📈' },
  finance: { label: 'Finance & Money', color: '#10B981', emoji: '💰' },
  comms: { label: 'Communication', color: '#8B5CF6', emoji: '🎤' },
  languages: { label: 'Languages', color: '#EF4444', emoji: '🌍' },
  music: { label: 'Music & Arts', color: '#F97316', emoji: '🎸' },
}

export const SKILLS = {
  Python: 'tech',
  'Web Development': 'tech',
  JavaScript: 'tech',
  'Machine Learning': 'tech',
  'Mobile Apps': 'tech',
  'Data Analytics': 'data',
  Excel: 'data',
  SQL: 'data',
  'Power BI': 'data',
  'UI/UX Design': 'design',
  'Graphic Design': 'design',
  'Video Editing': 'design',
  Photography: 'design',
  Figma: 'design',
  'Digital Marketing': 'business',
  SEO: 'business',
  Copywriting: 'business',
  Entrepreneurship: 'business',
  'Social Media': 'business',
  Finance: 'finance',
  Investing: 'finance',
  Accounting: 'finance',
  'Public Speaking': 'comms',
  'Interview Prep': 'comms',
  Negotiation: 'comms',
  Spanish: 'languages',
  French: 'languages',
  Mandarin: 'languages',
  Guitar: 'music',
  Piano: 'music',
  'Music Production': 'music',
}

export const SKILL_NAMES = Object.keys(SKILLS)

export const categoryOf = (skill) => SKILLS[skill] || 'other'
export const categoryMeta = (skill) =>
  CATEGORIES[categoryOf(skill)] || { label: 'Other', color: '#64748B', emoji: '✨' }

export const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
export const levelIndex = (level) => Math.max(0, LEVELS.indexOf(level)) + 1

export const INTERESTS = [
  'Startups', 'AI', 'Sustainability', 'Travel', 'Fitness', 'Gaming', 'Music', 'Film',
  'Reading', 'Fashion', 'Food', 'Sports', 'Volunteering', 'Crypto', 'Art', 'Podcasts',
]

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const TIMES = ['Morning', 'Afternoon', 'Evening']

export const FORMATS = {
  online: 'Online',
  'in-person': 'In person',
  both: 'Online or in person',
}
