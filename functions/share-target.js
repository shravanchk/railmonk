// Cloudflare Pages Function — the share target's safety net.
//
// Shares into installed Railmonk are answered by the service worker on the
// phone (public/sw.js) and never reach the network. This only runs when that
// worker was not there to answer: storage was cleared, the browser evicted it,
// or the app was opened for the first time straight from a share. Without it
// the reader would land on a 405 page.
//
// It does not read the request body. Whatever was shared is discarded unread,
// and the reader is told it did not arrive (`?shared=lost`) so it can ask for
// the file or SMS again — by then the worker is installed and the retry stays
// on the device.

export const onRequestPost = ({ request }) =>
  Response.redirect(new URL('/rail/ticket-reader?shared=lost', request.url).toString(), 303);

// A GET here is someone following a stale link; send them to the reader.
export const onRequestGet = ({ request }) => Response.redirect(new URL('/rail/ticket-reader', request.url).toString(), 302);
