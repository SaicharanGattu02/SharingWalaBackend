/**
 * Lightweight Elastic-style multi-field fuzzy search, typo-tolerant matching,
 * and relevance ranking utility for Trip Budget Planner destinations.
 */

const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (value) => {
  const norm = normalizeText(value);
  return norm ? norm.split(' ') : [];
};

/**
 * Bounded Levenshtein edit distance (early exit when distance exceeds maxDist).
 */
export const boundedLevenshtein = (a, b, maxDist = 2) => {
  if (a === b) return 0;
  const lenA = a.length;
  const lenB = b.length;
  if (Math.abs(lenA - lenB) > maxDist) return maxDist + 1;
  if (lenA === 0) return lenB;
  if (lenB === 0) return lenA;

  let prev = new Array(lenB + 1);
  let curr = new Array(lenB + 1);
  for (let j = 0; j <= lenB; j++) prev[j] = j;

  for (let i = 1; i <= lenA; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    const chA = a.charCodeAt(i - 1);

    for (let j = 1; j <= lenB; j++) {
      const cost = chA === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }

    if (rowMin > maxDist) return maxDist + 1;
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }

  return prev[lenB];
};

/**
 * Score a single token against a normalized field string.
 * Returns 0 if no match, or a positive score for exact / prefix / substring / fuzzy match.
 */
const scoreTokenAgainstField = (token, fieldText) => {
  if (!token || !fieldText) return 0;
  if (fieldText === token) return 120;

  const fieldWords = fieldText.split(' ');
  let best = 0;

  for (const word of fieldWords) {
    if (!word) continue;
    if (word === token) {
      best = Math.max(best, 100);
    } else if (word.startsWith(token)) {
      best = Math.max(best, 80);
    } else if (token.length >= 3 && word.includes(token)) {
      best = Math.max(best, 60);
    } else if (token.length >= 4) {
      const maxEdits = token.length >= 7 ? 2 : 1;
      const dist = boundedLevenshtein(token, word, maxEdits);
      if (dist <= maxEdits) {
        best = Math.max(best, dist === 1 ? 45 : 30);
      }
    }
  }

  if (best === 0 && token.length >= 3 && fieldText.includes(token)) {
    best = 50;
  }

  return best;
};

/**
 * Score a destination item against a search query across weighted fields.
 * @param {Object} item
 * @param {string} rawQuery
 * @param {Array<{key: string, boost: number}>} fields
 * @returns {{ score: number, matchedFields: string[] }}
 */
export const scoreSearchItem = (item, rawQuery, fields) => {
  const queryNorm = normalizeText(rawQuery);
  if (!queryNorm) return { score: 1, matchedFields: [] };

  const tokens = tokenize(queryNorm);
  if (tokens.length === 0) return { score: 1, matchedFields: [] };

  let totalScore = 0;
  const matchedFields = new Set();
  const matchedTokens = new Set();

  for (const { key, boost } of fields) {
    const rawVal = item?.[key];
    const fieldText = Array.isArray(rawVal)
      ? normalizeText(rawVal.join(' '))
      : normalizeText(rawVal);

    if (!fieldText) continue;

    // Full-phrase boost
    if (fieldText === queryNorm) {
      totalScore += 150 * boost;
      matchedFields.add(key);
      tokens.forEach((t) => matchedTokens.add(t));
      continue;
    }
    if (fieldText.startsWith(queryNorm)) {
      totalScore += 110 * boost;
      matchedFields.add(key);
    } else if (queryNorm.length >= 3 && fieldText.includes(queryNorm)) {
      totalScore += 80 * boost;
      matchedFields.add(key);
    }

    for (const token of tokens) {
      const tokenScore = scoreTokenAgainstField(token, fieldText);
      if (tokenScore > 0) {
        totalScore += tokenScore * boost;
        matchedFields.add(key);
        matchedTokens.add(token);
      }
    }
  }

  // Require all query tokens to match when there are multiple tokens (unless single token or strong match)
  if (tokens.length > 1 && matchedTokens.size < tokens.length) {
    if (matchedTokens.size === 0) return { score: 0, matchedFields: [] };
    // Penalize partial token matches rather than dropping completely if >50% tokens matched
    if (matchedTokens.size / tokens.length < 0.5) {
      return { score: 0, matchedFields: [] };
    }
    totalScore *= matchedTokens.size / tokens.length;
  }

  return {
    score: Math.round(totalScore * 100) / 100,
    matchedFields: Array.from(matchedFields),
  };
};

/**
 * Suggest closest destination names ("Did you mean ...?") when a search yields few/no results.
 */
export const buildSearchSuggestions = (items, rawQuery, limit = 5) => {
  const q = normalizeText(rawQuery);
  if (!q) return [];

  const scored = items
    .map((item) => {
      const name = normalizeText(item.name);
      const dist = boundedLevenshtein(q, name, 4);
      const starts = name.startsWith(q.slice(0, 2)) ? -1 : 0;
      return { item, rank: dist + starts };
    })
    .filter((x) => x.rank <= 4)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit);

  return scored.map((x) => x.item.name);
};
