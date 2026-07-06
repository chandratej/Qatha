/** OpenAI Moderation provider — internal only; called by moderation gateway. */

const OPENAI_MODERATION_URL = 'https://api.openai.com/v1/moderations';
const OPENAI_MODERATION_MODEL = 'omni-moderation-latest';

function flaggedCategories(categories = {}) {
  return Object.entries(categories)
    .filter(([, flagged]) => flagged)
    .map(([name]) => name.replace(/_/g, ' '));
}

export async function moderateWithOpenAI(text, apiKey) {
  const res = await fetch(OPENAI_MODERATION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: text,
      model: OPENAI_MODERATION_MODEL,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI Moderation API error: ${res.status}`);
  }

  const data = await res.json();
  const result = data?.results?.[0];
  if (!result) {
    throw new Error('OpenAI Moderation API returned no results');
  }

  if (!result.flagged) {
    return { isSafe: true, flaggedReason: '' };
  }

  const categories = flaggedCategories(result.categories);
  return {
    isSafe: false,
    flaggedReason: categories.length > 0 ? categories.join(', ') : 'policy violation',
  };
}