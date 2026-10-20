// Whether, and how, this browser can install Railmonk as an app.
//
//   'prompt' — Chrome, Edge or Samsung Internet offered an install prompt.
//   'ios'    — iPhone or iPad: installing is Share → Add to Home Screen, and
//              no browser there offers a prompt.
//   'none'   — already installed (or running as the Play Store app), or the
//              browser cannot install web apps.
//
// The listener is registered when this module first loads. The footer imports
// it, so that is on the first page: the browser fires beforeinstallprompt once,
// early, and does not repeat it for a page that missed it.

import { useSyncExternalStore } from 'react';

let deferred = null;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Hold it for our button instead of Chrome's own mini-infobar.
    e.preventDefault();
    deferred = e;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    emit();
  });
}

const state = () => {
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (standalone) return 'none';
  if (deferred) return 'prompt';
  const ua = window.navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1);
  return ios ? 'ios' : 'none';
};

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useInstallState = () => useSyncExternalStore(subscribe, state, () => 'none');

/** Is Railmonk running as an installed app right now? */
export const isInstalled = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);

/** Show the browser's install prompt. */
export const promptInstall = async () => {
  const e = deferred;
  if (!e) return;
  deferred = null;
  await e.prompt().catch(() => {});
  emit();
};
