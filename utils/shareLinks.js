// Calculator inputs ⇄ query string.
//
// Only values that differ from how the page loads are written, so an untouched
// calculator keeps a clean URL and a shared link carries just the inputs that
// were actually chosen. Everything is handled as strings: the query string has
// no types, and letting each calculator parse its own values back is clearer
// than a coercion layer that has to guess.

/** Build a query string from `fields`, omitting empties and anything unchanged. */
const encodeFields = (fields, defaults = {}) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) {
    const text = value == null ? '' : String(value);
    if (!text) continue;
    if (String(defaults[key] ?? '') === text) continue;
    params.set(key, text);
  }
  return params.toString();
};

/** Pull the recognised keys out of a Next.js `router.query`, ignoring the rest. */
const decodeFields = (query = {}, keys = []) => {
  const found = {};
  for (const key of keys) {
    const value = query[key];
    if (typeof value === 'string' && value !== '') found[key] = value;
  }
  return found;
};

/** Absolute, shareable URL for a set of inputs. */
const buildShareUrl = (origin, pathname, fields, defaults) => {
  const query = encodeFields(fields, defaults);
  return `${origin}${pathname}${query ? `?${query}` : ''}`;
};

module.exports = { encodeFields, decodeFields, buildShareUrl };
