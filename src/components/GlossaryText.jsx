import { GLOSSARY_TOKENS } from '../data/glossary';
import Term from './Term';

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ARABIC = /[\u0600-\u06FF]/;

// One regex from the curated tokens. Latin tokens use \b boundaries; Arabic
// tokens use Arabic-letter lookarounds (so we match whole words only).
const PARTS = [...GLOSSARY_TOKENS]
  .sort((a, b) => b.token.length - a.token.length)
  .map(({ token }) => {
    const body = escape(token);
    return ARABIC.test(token)
      ? `(?<![\\u0600-\\u06FF])${body}(?![\\u0600-\\u06FF])`
      : `\\b${body}\\b`;
  });
const RE = new RegExp(PARTS.join('|'), 'gi');
const TOKEN_TO_ID = new Map(GLOSSARY_TOKENS.map(({ id, token }) => [token.toLowerCase(), id]));

/**
 * Render a string with glossary terms wrapped in <Term> (clickable). Use for
 * i18n / data strings that cannot hold JSX directly. Driven by the manual
 * data/glossary.js dictionary — no arbitrary detection.
 */
export default function GlossaryText({ text, as: Tag = 'span' }) {
  if (!text) return null;
  const nodes = [];
  let last = 0;
  let match;
  let key = 0;
  RE.lastIndex = 0;
  while ((match = RE.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const id = TOKEN_TO_ID.get(match[0].toLowerCase());
    nodes.push(
      <Term key={`term-${key++}`} id={id}>
        {match[0]}
      </Term>,
    );
    last = match.index + match[0].length;
    if (match[0].length === 0) RE.lastIndex += 1;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <Tag>{nodes.length ? nodes : text}</Tag>;
}