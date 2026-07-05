/** Demo seed data — used when MOCK_MODE=true or Supabase unavailable */

export const DEMO_CREATOR_ID = 'demo-creator-001';
export const DEMO_USER_ID = 'demo-reader-001';

export const seedStories = [
  {
    id: 'story-001',
    title: 'మనసులో మిగిలిన మాట',
    description: 'ఒక ప్రేమ కథ — హృదయానికి దగ్గరైన కథ.',
    genre: 'romance',
    cover_url: null,
    chapter_count: 6,
    total_readers: 1240,
    views_this_week: 340,
    release_schedule: 'weekly',
    release_day_of_week: 1,
    release_time_of_day: '18:00:00',
    is_published: true,
    created_at: '2026-06-01T10:00:00Z',
    creators: { pen_name: 'లక్ష్మీ దేవి', avatar_url: null },
  },
  {
    id: 'story-002',
    title: 'ఇల్లు — కుటుంబం — కథ',
    description: 'తల్లి, తండ్రి, మూడు తరాల కథ.',
    genre: 'family_drama',
    cover_url: null,
    chapter_count: 5,
    total_readers: 890,
    views_this_week: 210,
    release_schedule: 'biweekly',
    is_published: true,
    created_at: '2026-06-10T10:00:00Z',
    creators: { pen_name: 'సుధా రాణి', avatar_url: null },
  },
  {
    id: 'story-003',
    title: 'రహస్యం లో రహస్యం',
    description: 'చివరి అధ్యాయం వరకు ఊహించలేని మలుపు.',
    genre: 'suspense',
    cover_url: null,
    chapter_count: 8,
    total_readers: 2100,
    views_this_week: 520,
    release_schedule: 'weekly',
    is_published: true,
    created_at: '2026-05-20T10:00:00Z',
    creators: { pen_name: 'రాజేష్ కుమార్', avatar_url: null },
  },
];

const chapterContent = {
  1: `ఆ రోజు ఉదయం, ఆకాశం మేఘాలతో నిండి ఉంది. చిన్న పల్లెటూరి చుట్టూ మిరియాల వాసన వీచింది. అమ్మమ్మ చెప్పే కథలు ఇంకా చెవుల్లో మోగుతున్నాయి.

"నువ్వు ఎప్పుడు పెద్ద అవుతావు?" అమ్మమ్మ అడిగారు. నేను నవ్వాను. పెద్దది అవ్వడం అంటే ఏమిటో నాకు తెలియదు. కానీ ఏదో మార్పు వస్తోందని అనిపించింది.

వీధిలో పిల్లలు ఆడుకుంటున్నారు. ఒక అమ్మాయి నా వైపు చూసి నవ్వింది. నా గుండె ఒక్కసారిగా వేగంగా కొట్టుకుంది.`,
  2: `రెండవ రోజు, ఆ అమ్మాయి పేరు తెలిసింది — అనన్య. పేరు వినగానే ఏదో మధురమైన భావన కలిగింది.

అనన్య తన తల్లితో మార్కెట్‌కు వెళ్తోంది. నేను వెనుకనుండి చూస్తూ ఉన్నాను. అది తప్పా? నాకు తెలియదు.

సాయంత్రం వర్షం పడింది. అనన్య తడిసిన చీరలో నాకు కనిపించింది — అందంగా, అసహ్యంగా కాదు, ఏదో ప్రశాంతంగా.`,
  3: `మూడవ అధ్యాయం — మా మొదటి మాట. అనన్య నాతో మాట్లాడింది. కేవలం హాయ్ అంతే. కానీ ఆ హాయ్ నా రోజంతా మార్చేసింది.

"నువ్వు ఇక్కడ ఎప్పుడిప్పుడు వస్తావు?" అని అడిగింది. నేను ఏమో అన్నాను. నవ్వింది. నేను కూడా నవ్వాను.

ఆ రాత్రి నేను నిద్రపోలేక లేచి ఉన్నాను. నక్షత్రాలు ఆకాశంలో మిణుకుతున్నాయి. అనన్య గురించి ఆలోచిస్తూ.`,
  4: `నాల్గవ అధ్యాయం — మొదటి సంఘటన. అనన్య తన పుస్తకం మర్చిపోయింది. నేను దానిని తిరిగి ఇచ్చాను.

"ధన్యవాదాలు," అంది. కళ్లలో ఒక విశేషం. నేను అర్థం చేసుకోలేకపోయాను — ప్రేమా? కృతజ్ఞతా?

తర్వాత రోజు, అనన్య నా వీధిలో నిలబడి ఉంది. నన్ను ఎదురు చూస్తోంది. నా గుండె మళ్లీ వేగంగా.`,
  5: `అయిదవ అధ్యాయం — మొదటి నిజమైన సంభాషణ. గంటలు గడిచాయి. మేము కూర్చుని మాట్లాడాము — పుస్తకాలు, సినిమాలు, పల్లెటూరి జీవితం.

"నాకు ఇక్కడ ఎవరూ లేరు," అంది అనన్య. "నువ్వు మాత్రం ఉన్నావు."

ఆ మాట నా హృదయాన్ని తాకింది. నేను చేతి పట్టుకున్నాను. ఆమె వదలలేదు.`,
  6: `ఆరవ అధ్యాయం — కొత్త ప్రారంభం. సూర్యోదయం. అనన్య మరియు నేను — కలిసి నడుస్తున్నాము.

"ఇక ముందు ప్రతి రోజు," అంది. నేను తల అనూన్ణాను.

జీవితం మార్చబడుతోంది. ఒక మాట, ఒక చిరునవ్వు, ఒక చేతి పట్టుకోవడం — ఇవే చాలు కొన్నిసార్లు.`,
};

export function getSeedChapters(storyId) {
  const story = seedStories.find((s) => s.id === storyId);
  if (!story) return [];

  return Array.from({ length: story.chapter_count }, (_, i) => {
    const num = i + 1;
    const titles = ['ఆరంభం', 'మొదటి నవ్వు', 'రహస్యం', 'ఎదురుచూపు', 'కనుబొల్ల', 'కొత్త ప్రారంభం'];
    return {
      id: `${storyId}-ch-${num}`,
      story_id: storyId,
      chapter_number: num,
      title: titles[num - 1] || `అధ్యాయం ${num}`,
      content: chapterContent[num] || chapterContent[1],
      estimated_read_time_minutes: 12,
      view_count: Math.floor(1200 / num),
      status: 'published',
    };
  });
}

export function getSeedChapter(storyId, chapterNumber) {
  const chapters = getSeedChapters(storyId);
  return chapters.find((c) => c.chapter_number === chapterNumber) || null;
}

export function getSeedDiscover(genre) {
  const filtered = seedStories.filter((s) => s.genre === genre);
  const trending = [...filtered].sort((a, b) => b.views_this_week - a.views_this_week).slice(0, 10);
  const newReleases = [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
  return { genre, trending, new_releases: newReleases };
}

export function getSeedDashboard() {
  const creatorSharePct = 60;
  const priceInr = 99;
  const perSubEarning = (priceInr * creatorSharePct) / 100;

  const earningsByStory = [
    { story_id: 'story-001', title: seedStories[0].title, total_readers: 1240, subscribers: 3, earnings_this_month: perSubEarning * 3 },
    { story_id: 'story-003', title: seedStories[2].title, total_readers: 2100, subscribers: 1, earnings_this_month: perSubEarning * 1 },
    { story_id: 'story-002', title: seedStories[1].title, total_readers: 890, subscribers: 0, earnings_this_month: 0 },
  ];

  const earningsThisMonth = earningsByStory.reduce((s, e) => s + e.earnings_this_month, 0);
  const totalSubscribers = earningsByStory.reduce((s, e) => s + e.subscribers, 0);

  return {
    earnings_this_month: earningsThisMonth,
    total_earnings: 2376,
    total_subscribers: totalSubscribers,
    expected_payout_date: '2026-07-15',
    expected_payout_amount: earningsThisMonth,
    revenue_share_pct: creatorSharePct,
    platform_share_pct: 100 - creatorSharePct,
    creator_earnings_per_subscription_inr: perSubEarning,
    payout_schedule: '15th of each month',
    week_over_week_growth_pct: 12,
    earnings_by_story: earningsByStory,
    stories: seedStories.map((s) => ({
      id: s.id,
      title: s.title,
      total_readers: s.total_readers,
      views_this_week: s.views_this_week,
      chapter_count: s.chapter_count,
      subscribers: earningsByStory.find((e) => e.story_id === s.id)?.subscribers ?? 0,
      earnings_this_month: earningsByStory.find((e) => e.story_id === s.id)?.earnings_this_month ?? 0,
    })),
    subscriber_history: [
      { month: '2026-04', count: 0 },
      { month: '2026-05', count: 1 },
      { month: '2026-06', count: totalSubscribers },
    ],
  };
}

export function getSeedAnalytics(storyId) {
  const chapters = getSeedChapters(storyId);
  const chapterStats = chapters.map((c, i) => ({
    chapter_id: c.id,
    story_id: storyId,
    chapter_number: c.chapter_number,
    title: c.title,
    total_views: c.view_count,
    completion_rate: Math.max(50, 98 - i * 8),
    avg_scroll_pct: Math.max(45, 95 - i * 10),
  }));

  const dropOffInsights = [];
  for (let i = 1; i < chapterStats.length; i++) {
    const prev = chapterStats[i - 1];
    const curr = chapterStats[i];
    const viewDrop = prev.total_views > 0
      ? Math.round(100 * (prev.total_views - curr.total_views) / prev.total_views)
      : 0;
    const completionDrop = prev.completion_rate - curr.completion_rate;
    if (viewDrop >= 15 || completionDrop >= 12) {
      dropOffInsights.push({
        chapter_number: curr.chapter_number,
        view_drop_pct: viewDrop,
        completion_drop_pct: completionDrop,
        avg_scroll_pct: curr.avg_scroll_pct,
        suggestion: curr.avg_scroll_pct < 70
          ? `Most readers stopped around ${100 - curr.avg_scroll_pct}% into Chapter ${curr.chapter_number}. Consider shorter paragraphs or a stronger hook.`
          : `Chapter ${curr.chapter_number} loses ${viewDrop}% of readers vs. the previous chapter. Review pacing and cliffhanger strength.`,
      });
    }
  }

  return {
    story: seedStories.find((s) => s.id === storyId),
    chapters: chapterStats,
    subscribers_gained: 0,
    drop_off_insights: dropOffInsights,
  };
}