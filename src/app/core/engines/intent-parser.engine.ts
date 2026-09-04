import type { TripIntent } from '../models/trip-intent.model';

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

const REGIONS: string[] = ['Europe', 'Asia', 'Africa', 'Americas', 'Oceania'];

// Longer/more specific phrases first so "long weekend" wins over "weekend".
const DURATION_PHRASES: [string, number][] = [
  ['long weekend', 3],
  ['weekend', 3],
  ['a week', 7],
  ['one week', 7],
  ['two weeks', 14],
  ['a fortnight', 14],
];

const STYLE_KEYWORDS = ['romantic', 'relaxing', 'adventure', 'cultural', 'luxury'];
const PREFERENCE_KEYWORDS = ['warm', 'cold', 'coastal', 'quiet', 'beautiful', 'food'];
const INTEREST_KEYWORDS = ['food', 'beaches', 'culture', 'nature', 'nightlife', 'shopping'];

function wordMatch(message: string, word: string): boolean {
  return new RegExp(`\\b${word}\\b`, 'i').test(message);
}

// Explicit numeric durations ("4-day") are a confident signal; phrase-table
// matches ("a long weekend") are a fuzzy approximation and don't count
// toward confidence even though they still resolve durationDays.
function parseDurationDays(message: string): { days: number; explicit: boolean } | undefined {
  const explicit = message.match(/\d+[\s-]?day/i);
  if (explicit) {
    return { days: parseInt(explicit[0], 10), explicit: true };
  }
  for (const [phrase, days] of DURATION_PHRASES) {
    if (message.toLowerCase().includes(phrase)) {
      return { days, explicit: false };
    }
  }
  return undefined;
}

function parseMonth(message: string): number | undefined {
  for (let i = 0; i < MONTH_NAMES.length; i++) {
    if (wordMatch(message, MONTH_NAMES[i])) {
      return i + 1;
    }
  }
  return undefined;
}

function parseBudget(message: string): { amount: number; currency: string } | undefined {
  const symbolMatch = message.match(/€\s?(\d+)/);
  if (symbolMatch) {
    return { amount: parseInt(symbolMatch[1], 10), currency: 'EUR' };
  }
  const wordMatchResult = message.match(/(\d+)\s*(?:euros?|EUR)\b/i);
  if (wordMatchResult) {
    return { amount: parseInt(wordMatchResult[1], 10), currency: 'EUR' };
  }
  return undefined;
}

function parseRegion(message: string): string | undefined {
  return REGIONS.find((region) => wordMatch(message, region));
}

function parseTravelers(message: string): number | undefined {
  const explicit = message.match(/(\d+)\s*(?:travelers?|people|guests?|adults?)\b/i);
  if (explicit) {
    return parseInt(explicit[1], 10);
  }
  if (/\b(?:solo|myself|just me)\b/i.test(message)) {
    return 1;
  }
  return undefined;
}

function matchKeywords(message: string, keywords: string[]): string[] {
  const found: string[] = [];
  for (const keyword of keywords) {
    if (wordMatch(message, keyword) && !found.includes(keyword)) {
      found.push(keyword);
    }
  }
  return found;
}

export function parseIntent(message: string): TripIntent {
  const duration = parseDurationDays(message);
  const durationDays = duration?.days;
  const month = parseMonth(message);
  const budget = parseBudget(message);
  const region = parseRegion(message);
  const travelers = parseTravelers(message);

  const travelStyle = matchKeywords(message, STYLE_KEYWORDS);
  const preferences = matchKeywords(message, PREFERENCE_KEYWORDS);
  const interests = matchKeywords(message, INTEREST_KEYWORDS);

  const missingInformation: string[] = [];
  if (durationDays === undefined) missingInformation.push('dates');
  if (budget === undefined) missingInformation.push('budget');
  if (region === undefined) missingInformation.push('destination');

  let confidence = 0.5;
  if (duration?.explicit) confidence += 0.15;
  if (month !== undefined) confidence += 0.15;
  if (budget !== undefined) confidence += 0.15;
  if (region !== undefined) confidence += 0.15;
  confidence = Math.round(Math.min(confidence, 0.95) * 100) / 100;

  return {
    region,
    durationDays,
    travelers,
    month,
    budget,
    travelStyle,
    preferences,
    interests,
    missingInformation,
    confidence,
  };
}
