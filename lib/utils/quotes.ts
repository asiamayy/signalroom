// Quote verification — anything the product presents as a "verbatim" quote
// must actually appear in the source text it claims to come from. LLMs
// paraphrase; a customer who ctrl-F's a quote and can't find it loses trust
// permanently, so unverifiable quotes are dropped rather than displayed.

// Case-, punctuation- and whitespace-insensitive so cosmetic differences
// (smart quotes, trailing periods, line breaks) don't reject a real quote.
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function quoteInText(quote: string, sourceText: string): boolean {
  if (!quote || !sourceText) return false
  const src = normalize(sourceText)
  if (!src) return false

  // Ellipsized quotes ("start ... end") verify each segment independently
  const segments = quote
    .split(/\.{3}|…/)
    .map(normalize)
    .filter(seg => seg.length > 0)

  if (segments.length === 0) return false
  return segments.every(seg => src.includes(seg))
}

export function filterVerifiedQuotes(quotes: unknown, sourceText: string): string[] {
  if (!Array.isArray(quotes)) return []
  return quotes.filter((q): q is string => typeof q === 'string' && quoteInText(q, sourceText))
}
