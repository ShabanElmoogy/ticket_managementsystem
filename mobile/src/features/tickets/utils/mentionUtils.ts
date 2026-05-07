/**
 * mentionUtils.ts — Pure @mention extraction and formatting utilities.
 *
 * No side effects, no React hooks, no API calls.
 */

// ─────────────────────────────────────────────────────────────────────────────
// extractMentions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts @name mentions from a text string.
 *
 * Matches `@word` patterns (single-word names using \w+ — word characters only).
 * Returns an array of names WITHOUT the leading @ symbol.
 *
 * Example:
 *   extractMentions("Hello @alice and @bob!")
 *   // → ['alice', 'bob']
 */
export function extractMentions(text: string): string[] {
  const matches = text.match(/@(\w+)/g);
  if (!matches) return [];
  return matches.map((m) => m.slice(1)); // strip leading '@'
}

// ─────────────────────────────────────────────────────────────────────────────
// formatMentions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats an array of user names as "@name1 @name2 ..." string.
 *
 * Each name is prefixed with @ and joined with a single space.
 *
 * Example:
 *   formatMentions(['alice', 'bob'])
 *   // → '@alice @bob'
 *
 * Round-trip property (for single-word names):
 *   extractMentions(formatMentions(names)) deepEquals names
 */
export function formatMentions(users: string[]): string {
  return users.map((name) => `@${name}`).join(' ');
}
