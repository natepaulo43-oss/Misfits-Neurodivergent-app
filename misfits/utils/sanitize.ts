/**
 * Central input sanitization utility.
 *
 * All user-controlled strings written to Firestore should pass through one of
 * the helpers below. The helpers:
 *   - strip HTML/script tags so data can never be interpreted as markup if it
 *     is ever rendered outside of React Native's safe <Text> elements (e.g.
 *     web admin dashboards, exported CSVs, emails);
 *   - remove ASCII control characters that can break rendering or logs;
 *   - trim surrounding whitespace;
 *   - enforce a maximum character length server-side, regardless of what the
 *     client claims.
 *
 * Firestore is a NoSQL document store, so there is no SQL-injection risk, but
 * these helpers ensure no raw user input is ever trusted, including when it
 * is fed back into queries via `where(...)` clauses.
 */

export const MAX_LENGTHS = {
  // Auth / identity
  name: 80,
  email: 254,
  password: 128,
  // Short profile fields
  shortLine: 120,
  city: 80,
  state: 80,
  role: 120,
  age: 3,
  url: 2048,
  tag: 40,
  id: 128,
  // Long-form free text
  bio: 1000,
  notes: 2000,
  message: 1000,
  body: 10000,
} as const;

/**
 * Remove anything that looks like an HTML/XML tag (<...>).
 * Character escaping (&amp; &#39; etc.) is intentionally omitted: all
 * sanitized strings are stored in Firestore and rendered by React Native
 * <Text> components, which treat every character literally. Escaping here
 * would cause apostrophes, ampersands, and quotes to appear as raw HTML
 * entities in the UI. HTML-context escaping is the responsibility of any
 * web consumer (e.g. admin dashboard) at render time, not at storage time.
 */
const stripHtml = (input: string): string =>
  input.replace(/<[^>]*>/g, '');

/**
 * Remove ASCII control characters (0x00-0x1F except \t \n \r) and 0x7F.
 * Preserves Unicode letters/marks.
 */
const stripControlChars = (input: string, allowNewlines: boolean): string => {
  if (allowNewlines) {
    // Keep \n (0x0A) and \r (0x0D) and \t (0x09)
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }
  return input.replace(/[\x00-\x1F\x7F]/g, '');
};

/**
 * Sanitize a single-line user string. Trims, strips HTML, removes control
 * characters and newlines, and enforces a maximum length.
 */
export const sanitizeText = (input: unknown, maxLength: number): string => {
  if (typeof input !== 'string') return '';
  let out = input.trim();
  out = stripControlChars(out, false);
  out = stripHtml(out);
  if (out.length > maxLength) {
    out = out.slice(0, maxLength);
  }
  return out;
};

/**
 * Sanitize a multi-line user string (bios, notes, messages). Preserves
 * newlines but strips HTML and control chars and enforces max length.
 */
export const sanitizeMultiline = (input: unknown, maxLength: number): string => {
  if (typeof input !== 'string') return '';
  let out = input.replace(/^\s+|\s+$/g, '');
  out = stripControlChars(out, true);
  out = stripHtml(out);
  // Collapse runs of >2 blank lines to 2 to avoid abuse
  out = out.replace(/\n{3,}/g, '\n\n');
  if (out.length > maxLength) {
    out = out.slice(0, maxLength);
  }
  return out;
};

/**
 * Return a sanitized string or `undefined` when the input is empty after
 * sanitization. Handy when writing optional Firestore fields.
 */
export const sanitizeOptional = (
  input: unknown,
  maxLength: number,
  multiline = false,
): string | undefined => {
  const out = multiline
    ? sanitizeMultiline(input, maxLength)
    : sanitizeText(input, maxLength);
  return out.length > 0 ? out : undefined;
};

/**
 * Sanitize an email address. Lower-cases, trims, strips HTML, caps length,
 * and validates basic shape. Returns '' if the shape is invalid so callers
 * can reject early.
 */
export const sanitizeEmail = (input: unknown): string => {
  if (typeof input !== 'string') return '';
  const trimmed = stripHtml(
    stripControlChars(input.trim().toLowerCase(), false),
  ).slice(0, MAX_LENGTHS.email);
  // Basic RFC-5322-lite shape; real validation happens server-side by Firebase.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return '';
  return trimmed;
};

/**
 * Validate and sanitize a URL. Only http(s) and mailto schemes are permitted.
 */
export const sanitizeUrl = (input: unknown): string => {
  if (typeof input !== 'string') return '';
  const trimmed = input.trim().slice(0, MAX_LENGTHS.url);
  if (!trimmed) return '';
  // Reject obviously dangerous schemes before URL parsing.
  if (/^\s*(javascript|data|vbscript|file):/i.test(trimmed)) return '';
  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) return '';
    return parsed.toString();
  } catch {
    return '';
  }
};

/**
 * Sanitize an identifier (Firestore doc id or similar). Only alphanumerics,
 * underscores, and hyphens are allowed.
 */
export const sanitizeId = (input: unknown): string => {
  if (typeof input !== 'string') return '';
  const trimmed = input.trim().slice(0, MAX_LENGTHS.id);
  return /^[A-Za-z0-9_-]+$/.test(trimmed) ? trimmed : '';
};

/**
 * Sanitize an array of tags or short strings.
 */
export const sanitizeTagList = (
  input: unknown,
  maxItems: number = 50,
  maxItemLength: number = MAX_LENGTHS.tag,
): string[] => {
  if (!Array.isArray(input)) return [];
  const cleaned: string[] = [];
  for (const raw of input) {
    const s = sanitizeText(raw, maxItemLength);
    if (s) cleaned.push(s);
    if (cleaned.length >= maxItems) break;
  }
  return cleaned;
};
