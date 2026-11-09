// Realistic demo community. Skill sets are designed so the demo account
// (Priya) has several genuine reciprocal swaps, a few one-way matches and
// some weak ones — the ranking you see in Discover is computed, not scripted.

const photo = (g, n) => `https://randomuser.me/api/portraits/${g}/${n}.jpg`

export const DEMO_EMAIL = 'priya@unigo.app'
export const DEMO_PASSWORD = 'demo1234'

export const SEED_USERS = [
  {
    id: 'u_priya',
    email: DEMO_EMAIL,
    name: 'Priya Sharma',
    avatar: photo('women', 68),
    headline: 'MSc Data Science @ UCL',
    university: 'University College London',
    bio: 'Data science student who loves turning messy spreadsheets into stories. Building a sustainable fashion startup on the side and need to get much better at marketing and pitching it.',
    location: { city: 'London', country: 'United Kingdom' },
    teach: [
      { skill: 'Python', level: 'Advanced' },
      { skill: 'Data Analytics', level: 'Advanced' },
      { skill: 'SQL', level: 'Intermediate' },
    ],
    learn: [
      { skill: 'Digital Marketing', level: 'Beginner' },
      { skill: 'Public Speaking', level: 'Beginner' },
      { skill: 'UI/UX Design', level: 'Beginner' },
    ],
    interests: ['Startups', 'Sustainability', 'AI', 'Travel'],
    format: 'both',
    availability: { days: ['Tue', 'Wed', 'Thu', 'Sat'], times: ['Evening', 'Afternoon'] },
    isDemo: true,
  },
  {
    id: 'u_alex',
    name: 'Alex Morgan',
    avatar: photo('men', 32),
    headline: 'Growth Marketer @ fintech startup',
    university: "King's College London",
    bio: 'Ran growth for two early-stage startups (0 → 50k users). I can teach you SEO, paid social and content funnels. Trying to get technical so I can stop waiting on the data team.',
    location: { city: 'London', country: 'United Kingdom' },
    teach: [
      { skill: 'Digital Marketing', level: 'Expert' },
      { skill: 'SEO', level: 'Advanced' },
      { skill: 'Social Media', level: 'Advanced' },
    ],
    learn: [
      { skill: 'Python', level: 'Beginner' },
      { skill: 'Data Analytics', level: 'Beginner' },
    ],
    interests: ['Startups', 'Podcasts', 'Fitness', 'Travel'],
    format: 'both',
    availability: { days: ['Mon', 'Wed', 'Thu', 'Sat'], times: ['Evening'] },
    likes: ['u_priya'],
  },
  {
    id: 'u_sofia',
    name: 'Sofia Rossi',
    avatar: photo('women', 44),
    headline: 'Debate champion · Law @ LSE',
    university: 'London School of Economics',
    bio: 'National debating finalist and TEDx speaker coach. I help people stop dreading presentations. Learning data skills so my legal research can be evidence-driven.',
    location: { city: 'London', country: 'United Kingdom' },
    teach: [
      { skill: 'Public Speaking', level: 'Expert' },
      { skill: 'Digital Marketing', level: 'Intermediate' },
      { skill: 'Negotiation', level: 'Advanced' },
    ],
    learn: [
      { skill: 'Data Analytics', level: 'Beginner' },
      { skill: 'Excel', level: 'Intermediate' },
    ],
    interests: ['Reading', 'Travel', 'Volunteering', 'Food'],
    format: 'in-person',
    availability: { days: ['Tue', 'Thu', 'Sat'], times: ['Afternoon', 'Evening'] },
    likes: ['u_priya'],
  },
  {
    id: 'u_maya',
    name: 'Maya Chen',
    avatar: photo('women', 65),
    headline: 'Product Designer · ex-Monzo intern',
    university: 'Royal College of Art',
    bio: 'I design apps people actually enjoy using. Happy to review your portfolio or teach Figma from zero. Want to learn to code my own prototypes and get comfortable on stage.',
    location: { city: 'London', country: 'United Kingdom' },
    teach: [
      { skill: 'UI/UX Design', level: 'Advanced' },
      { skill: 'Graphic Design', level: 'Advanced' },
      { skill: 'Figma', level: 'Expert' },
    ],
    learn: [
      { skill: 'Web Development', level: 'Beginner' },
      { skill: 'Public Speaking', level: 'Intermediate' },
      { skill: 'Python', level: 'Beginner' },
    ],
    interests: ['Art', 'Startups', 'Fashion', 'Sustainability'],
    format: 'both',
    availability: { days: ['Wed', 'Fri', 'Sat', 'Sun'], times: ['Afternoon', 'Evening'] },
    likes: ['u_priya'],
  },
  {
    id: 'u_daniel',
    name: 'Daniel Okafor',
    avatar: photo('men', 75),
    headline: 'Investment Banking Analyst',
    university: 'University of Manchester',
    bio: 'Two years building financial models in Excel at a bulge-bracket bank. I can make you dangerous in Excel and explain finance without the jargon. Want to automate my work with Python.',
    location: { city: 'Manchester', country: 'United Kingdom' },
    teach: [
      { skill: 'Finance', level: 'Expert' },
      { skill: 'Excel', level: 'Expert' },
      { skill: 'Investing', level: 'Advanced' },
    ],
    learn: [
      { skill: 'Python', level: 'Intermediate' },
      { skill: 'Video Editing', level: 'Beginner' },
    ],
    interests: ['Crypto', 'Sports', 'Podcasts', 'Startups'],
    format: 'online',
    availability: { days: ['Sat', 'Sun'], times: ['Morning', 'Afternoon'] },
  },
  {
    id: 'u_liam',
    name: 'Liam Patel',
    avatar: photo('men', 46),
    headline: 'YouTuber · 120k subscribers',
    university: 'University of Birmingham',
    bio: 'I edit videos for creators and run my own tech channel. Premiere, After Effects, storytelling — I got you. Clueless about money and want to learn UX to make better thumbnails & channel art.',
    location: { city: 'Birmingham', country: 'United Kingdom' },
    teach: [
      { skill: 'Video Editing', level: 'Expert' },
      { skill: 'Graphic Design', level: 'Intermediate' },
      { skill: 'Social Media', level: 'Advanced' },
    ],
    learn: [
      { skill: 'Finance', level: 'Beginner' },
      { skill: 'UI/UX Design', level: 'Beginner' },
    ],
    interests: ['Gaming', 'Film', 'Music', 'AI'],
    format: 'online',
    availability: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], times: ['Evening'] },
  },
  {
    id: 'u_hannah',
    name: 'Hannah Kim',
    avatar: photo('women', 12),
    headline: 'Full-stack dev · CS @ Edinburgh',
    university: 'University of Edinburgh',
    bio: 'I build web apps in React and Python, and mentor at a local code club. My designs look like 2003 though — looking for a design mentor in exchange for code mentoring.',
    location: { city: 'Edinburgh', country: 'United Kingdom' },
    teach: [
      { skill: 'Web Development', level: 'Advanced' },
      { skill: 'Python', level: 'Advanced' },
      { skill: 'JavaScript', level: 'Expert' },
    ],
    learn: [
      { skill: 'UI/UX Design', level: 'Beginner' },
      { skill: 'Graphic Design', level: 'Beginner' },
    ],
    interests: ['Gaming', 'AI', 'Reading', 'Music'],
    format: 'online',
    availability: { days: ['Mon', 'Wed', 'Fri', 'Sun'], times: ['Evening', 'Morning'] },
  },
  {
    id: 'u_omar',
    name: 'Omar Haddad',
    avatar: photo('men', 22),
    headline: 'Data Analyst @ Deliveroo',
    university: 'Imperial College London',
    bio: 'I live in SQL and dashboards. I can level up your analytics and Excel. My manager says I need to present my insights better — help me find my voice!',
    location: { city: 'London', country: 'United Kingdom' },
    teach: [
      { skill: 'Data Analytics', level: 'Expert' },
      { skill: 'Excel', level: 'Advanced' },
      { skill: 'Power BI', level: 'Advanced' },
    ],
    learn: [
      { skill: 'Public Speaking', level: 'Beginner' },
      { skill: 'Digital Marketing', level: 'Beginner' },
    ],
    interests: ['Sports', 'Food', 'AI', 'Travel'],
    format: 'both',
    availability: { days: ['Tue', 'Wed', 'Thu'], times: ['Evening'] },
  },
  {
    id: 'u_aisha',
    name: 'Aisha Rahman',
    avatar: photo('women', 90),
    headline: 'Content strategist & spoken-word poet',
    university: 'University of Leeds',
    bio: 'Copywriter by day, poet on stage by night. I can help you write words that sell and speak with confidence. I want to learn Python to analyse what content actually works.',
    location: { city: 'Leeds', country: 'United Kingdom' },
    teach: [
      { skill: 'Copywriting', level: 'Expert' },
      { skill: 'Public Speaking', level: 'Advanced' },
      { skill: 'Digital Marketing', level: 'Intermediate' },
    ],
    learn: [
      { skill: 'Python', level: 'Beginner' },
      { skill: 'UI/UX Design', level: 'Beginner' },
    ],
    interests: ['Reading', 'Music', 'Volunteering', 'Startups'],
    format: 'online',
    availability: { days: ['Tue', 'Thu', 'Sat', 'Sun'], times: ['Evening', 'Afternoon'] },
    likes: ['u_priya'],
  },
  {
    id: 'u_ethan',
    name: 'Ethan Brooks',
    avatar: photo('men', 11),
    headline: 'Accounting & Finance @ Warwick',
    university: 'University of Warwick',
    bio: 'Spreadsheet nerd and ACCA trainee. Will teach you pivot tables, budgeting and personal finance. Building an Etsy store and need help with SEO and design.',
    location: { city: 'Coventry', country: 'United Kingdom' },
    teach: [
      { skill: 'Excel', level: 'Advanced' },
      { skill: 'Accounting', level: 'Advanced' },
      { skill: 'Finance', level: 'Intermediate' },
    ],
    learn: [
      { skill: 'SEO', level: 'Beginner' },
      { skill: 'Graphic Design', level: 'Beginner' },
    ],
    interests: ['Sports', 'Crypto', 'Gaming'],
    format: 'online',
    availability: { days: ['Mon', 'Tue', 'Sun'], times: ['Morning', 'Evening'] },
  },
  {
    id: 'u_chloe',
    name: 'Chloe Martin',
    avatar: photo('women', 33),
    headline: 'Photographer · Spanish tutor',
    university: 'University of Bristol',
    bio: 'Bilingual (grew up in Valencia) and shoot weddings on weekends. Can teach Spanish conversation or photography basics. Learning video editing to move into short films.',
    location: { city: 'Bristol', country: 'United Kingdom' },
    teach: [
      { skill: 'Spanish', level: 'Expert' },
      { skill: 'Photography', level: 'Advanced' },
    ],
    learn: [
      { skill: 'Video Editing', level: 'Intermediate' },
      { skill: 'Web Development', level: 'Beginner' },
    ],
    interests: ['Travel', 'Film', 'Art', 'Food'],
    format: 'both',
    availability: { days: ['Fri', 'Sat', 'Sun'], times: ['Morning', 'Afternoon'] },
  },
  {
    id: 'u_zara',
    name: 'Zara Ahmed',
    avatar: photo('women', 26),
    headline: 'ML Engineer · AI society president',
    university: 'University of Manchester',
    bio: 'Training models by day, running the uni AI society by night. Happy to teach Python and ML fundamentals. Our society needs better marketing — teach me how to grow an audience!',
    location: { city: 'Manchester', country: 'United Kingdom' },
    teach: [
      { skill: 'Machine Learning', level: 'Advanced' },
      { skill: 'Python', level: 'Expert' },
    ],
    learn: [
      { skill: 'Digital Marketing', level: 'Beginner' },
      { skill: 'Video Editing', level: 'Beginner' },
      { skill: 'Public Speaking', level: 'Intermediate' },
    ],
    interests: ['AI', 'Startups', 'Gaming', 'Sustainability'],
    format: 'online',
    availability: { days: ['Wed', 'Thu', 'Sat'], times: ['Evening'] },
  },
  {
    id: 'u_lucas',
    name: 'Lucas Silva',
    avatar: photo('men', 52),
    headline: 'Musician & junior web developer',
    university: 'Goldsmiths, University of London',
    bio: 'Guitarist in a jazz trio, building websites for local bands. I can teach guitar from scratch or basic HTML/CSS. Want to learn Spanish and finally understand investing.',
    location: { city: 'London', country: 'United Kingdom' },
    teach: [
      { skill: 'Guitar', level: 'Expert' },
      { skill: 'Web Development', level: 'Intermediate' },
      { skill: 'Music Production', level: 'Advanced' },
    ],
    learn: [
      { skill: 'Spanish', level: 'Beginner' },
      { skill: 'Investing', level: 'Beginner' },
    ],
    interests: ['Music', 'Film', 'Food', 'Travel'],
    format: 'in-person',
    availability: { days: ['Mon', 'Fri', 'Sun'], times: ['Afternoon'] },
  },
  {
    id: 'u_noah',
    name: 'Noah Williams',
    avatar: photo('men', 64),
    headline: 'Founder · EdTech pre-seed',
    university: 'University of Oxford',
    bio: 'Raised a pre-seed round last year and pitched to 60+ investors. I can teach pitching and startup fundamentals. Need to get hands-on with data so I can read my own metrics.',
    location: { city: 'Oxford', country: 'United Kingdom' },
    teach: [
      { skill: 'Entrepreneurship', level: 'Expert' },
      { skill: 'Public Speaking', level: 'Advanced' },
      { skill: 'Negotiation', level: 'Advanced' },
    ],
    learn: [
      { skill: 'SQL', level: 'Beginner' },
      { skill: 'Data Analytics', level: 'Beginner' },
    ],
    interests: ['Startups', 'AI', 'Podcasts', 'Fitness'],
    format: 'both',
    availability: { days: ['Tue', 'Thu', 'Sat'], times: ['Morning', 'Evening'] },
  },
]

// Existing activity for the demo account so the product feels lived in.
export function seedActivity(now = Date.now()) {
  const h = 3600e3
  const d = 24 * h
  const day = (offset, hour) => {
    const t = new Date(now + offset * d)
    t.setHours(hour, 0, 0, 0)
    return t
  }
  const iso = (t) => t.toISOString().slice(0, 10)
  const hm = (t) => t.toTimeString().slice(0, 5)

  const pastSession = day(-5, 18)
  const nextSession = day(2, 18)

  return {
    matches: [
      { id: 'm_sofia', users: ['u_priya', 'u_sofia'], at: now - 9 * d },
      { id: 'm_daniel', users: ['u_priya', 'u_daniel'], at: now - 3 * d },
      { id: 'm_omar', users: ['u_priya', 'u_omar'], at: now - 6 * h },
    ],
    swipes: [
      { from: 'u_priya', to: 'u_sofia', action: 'like', at: now - 9 * d },
      { from: 'u_sofia', to: 'u_priya', action: 'like', at: now - 10 * d },
      { from: 'u_priya', to: 'u_daniel', action: 'like', at: now - 3 * d },
      { from: 'u_daniel', to: 'u_priya', action: 'like', at: now - 3 * d },
      { from: 'u_priya', to: 'u_omar', action: 'like', at: now - 6 * h },
      { from: 'u_omar', to: 'u_priya', action: 'like', at: now - 7 * h },
    ],
    messages: {
      m_sofia: [
        { id: 'x1', from: 'u_sofia', text: 'Hi Priya! Saw you want to work on public speaking — and I desperately need someone to make data less scary 😅 Swap?', at: now - 9 * d + 2 * h },
        { id: 'x2', from: 'u_priya', text: 'Yes!! That sounds perfect. I have a pitch competition next month and I freeze every time.', at: now - 9 * d + 3 * h },
        { id: 'x3', from: 'u_sofia', text: "Classic. We'll fix that. Want to meet at the LSE library café on Thursday evening?", at: now - 9 * d + 4 * h },
        { id: 'x4', from: 'u_priya', text: "Done. I'll bring my laptop and we can do a pivot-table crash course after 🙌", at: now - 9 * d + 5 * h },
        { id: 'x5', from: 'u_priya', type: 'session', sessionId: 's_past', at: now - 8 * d },
        { id: 'x6', from: 'u_sofia', text: 'That was so fun. Your “power pose before the pitch” homework is due Sunday 😄', at: now - 5 * d + 3 * h },
        { id: 'x7', from: 'u_sofia', type: 'session', sessionId: 's_next', at: now - 1 * d },
        { id: 'x8', from: 'u_sofia', text: 'Booked our next one — this time you present your startup deck to me for 3 minutes, no notes!', at: now - 1 * d + 60e3 },
      ],
      m_daniel: [
        { id: 'y1', from: 'u_daniel', text: 'Hey Priya, my whole job is copy-pasting between spreadsheets. Could you show me how to automate it with pandas?', at: now - 3 * d + h },
        { id: 'y2', from: 'u_priya', text: 'Ha, that is literally what pandas was made for. Send me an example file (anonymised!) and we can do a session this weekend.', at: now - 3 * d + 2 * h },
        { id: 'y3', from: 'u_daniel', text: "Legend. In return I'll teach you how to read a balance sheet — useful for your startup.", at: now - 2 * d },
      ],
      m_omar: [],
    },
    sessions: [
      {
        id: 's_past', matchId: 'm_sofia', proposer: 'u_priya', partner: 'u_sofia',
        skill: 'Public Speaking', teacher: 'u_sofia', learner: 'u_priya',
        date: iso(pastSession), time: hm(pastSession), duration: 90, format: 'in-person',
        place: 'LSE Library Café', note: 'Pitch basics + pivot tables', status: 'completed', at: now - 8 * d,
      },
      {
        id: 's_next', matchId: 'm_sofia', proposer: 'u_sofia', partner: 'u_priya',
        skill: 'Public Speaking', teacher: 'u_sofia', learner: 'u_priya',
        date: iso(nextSession), time: hm(nextSession), duration: 60, format: 'in-person',
        place: 'LSE Library Café', note: '3-minute deck run-through', status: 'confirmed', at: now - 1 * d,
      },
    ],
    reads: { u_priya: { m_sofia: now - 1 * d - 60e3, m_daniel: now - 2.5 * d } },
  }
}
