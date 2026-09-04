import { parseIntent } from './intent-parser.engine';

describe('parseIntent', () => {
  it('extracts duration, month, budget, style and region', () => {
    const intent = parseIntent('I want a romantic 4-day trip somewhere warm in Europe in October under €900.');
    expect(intent.durationDays).toBe(4);
    expect(intent.month).toBe(10);
    expect(intent.budget).toEqual({ amount: 900, currency: 'EUR' });
    expect(intent.travelStyle).toContain('romantic');
    expect(intent.preferences).toContain('warm');
    expect(intent.region).toBe('Europe');
    expect(intent.confidence).toBeGreaterThan(0.5);
  });

  it('parses "long weekend" and "a week" as day counts', () => {
    expect(parseIntent('a long weekend somewhere beautiful').durationDays).toBe(3);
    expect(parseIntent('a week in Asia').durationDays).toBe(7);
  });

  it('returns low confidence and missingInformation for a vague request', () => {
    const intent = parseIntent('I want somewhere beautiful for a long weekend');
    expect(intent.missingInformation.length).toBeGreaterThan(0);
    expect(intent.confidence).toBeLessThan(0.6);
  });

  it('never invents a budget or region that was not mentioned', () => {
    const intent = parseIntent('somewhere nice');
    expect(intent.budget).toBeUndefined();
    expect(intent.region).toBeUndefined();
  });

  it('populates both preferences and interests when "food" is mentioned', () => {
    const intent = parseIntent('a trip focused on great food');
    expect(intent.preferences).toContain('food');
    expect(intent.interests).toContain('food');
  });

  it('parses explicit traveler counts and leaves travelers undefined otherwise', () => {
    expect(parseIntent('a trip for 4 travelers to Asia').travelers).toBe(4);
    expect(parseIntent('somewhere nice').travelers).toBeUndefined();
  });
});
