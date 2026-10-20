# Railmonk for Android (Google Play)

This is a **Trusted Web Activity**: a small Android app that opens
https://railmonk.com full-screen in Chrome, with no browser bar. The app *is*
the website, so:

- **Web changes reach app users the moment you deploy.** New tools, rule
  updates and fixes need no new app build.
- Rebuild the app only when something in `twa-manifest.json` changes: name,
  colours, icons, shortcuts, the share target, or the version for a store
  update.

Generated with Bubblewrap (`@bubblewrap/core` 1.25.0, the same version as the
Sharpmonk app) from `twa-manifest.json`, which is the source of truth. Package
name: **`com.railmonk.app`** (permanent once published).

## What the app gets from the site

- Install icon, splash screen and app shortcuts (long-press the icon: Ticket,
  Journeys, Refund, Chart).
- **Share target:** "Share → Railmonk" from WhatsApp, Gmail, Files or Messages
  sends an e-ticket PDF or a booking SMS to `/share-target`. The service worker
  (`public/sw.js`) answers that on the phone and opens the ticket reader; the
  ticket never reaches a server. The Android intent filters accept
  `application/pdf` and `text/plain`, for both `SEND` and `SEND_MULTIPLE`.
- Offline reading of tickets comes from the website's service worker.

## 1. Deploy the site first

The share target, the ticket reader, the PNG and maskable icons and (later)
the asset links file all need to be live on railmonk.com:

```bash
npm run build && npx wrangler pages deploy out --project-name=railmonk --branch=main
```

## 2. Create your upload key (once)

```bash
keytool -genkeypair -v -keystore android/android.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

It asks for a password and your name. **Back the keystore and its password up
somewhere safe outside this folder.** `*.keystore` is gitignored. With Play
App Signing (the default) Google holds the real signing key, and a lost
upload key can be reset through Play support, but only with some delay.

## 3. Build the app bundle (.aab)

**Android Studio (simplest):** open the `android/` folder, let it sync (accept
the Android SDK licences it offers), then *Build → Generate Signed App Bundle /
APK → Android App Bundle*. Choose `android.keystore`, alias `upload`, build
variant `release`. The bundle lands in `android/app/release/app-release.aab`.

**Or the Bubblewrap CLI** (downloads its own JDK 17 and Android SDK on first
run):

```bash
cd android && npx @bubblewrap/cli@1.25.0 build
```

## 4. Publish on Play Console

1. A developer account at https://play.google.com/console (the one used for
   Sharpmonk works). New *personal* accounts must run a closed test with at
   least 12 testers for 14 days before publishing to production.
2. *Create app* → name "Railmonk", app, free. Category: Travel & Local.
3. Fill in the store listing and the app content forms. For Data safety:
   tickets are read on the device, saved journeys stay in the browser's
   storage, and there are no accounts, so the ticket reader itself collects
   nothing. The site's AdSense and Google Analytics do collect data, and the
   form has to declare them.
4. *Testing → Internal testing → Create release* → upload the `.aab`.
   Play App Signing is on by default; keep it on.

## 5. Link the app to the site (asset links)

Until this is done, the app opens with a thin browser address bar at the top.

1. Play Console → *Test and release → App integrity → App signing*. Copy the
   SHA-256 of the **App signing key certificate**, and of the **Upload key
   certificate** (for builds installed by hand).
2. Add both to `fingerprints` in `twa-manifest.json`:

   ```json
   "fingerprints": [
     { "name": "Play App Signing", "value": "AB:CD:…" },
     { "name": "Upload key", "value": "12:34:…" }
   ]
   ```

   For a local build before Play, the upload key's fingerprint is also shown by
   `keytool -list -v -keystore android/android.keystore -alias upload`.
3. Deploy the site. `scripts/assetlinks.mjs` runs before every build and
   writes https://railmonk.com/.well-known/assetlinks.json from that list.
4. Reopen the app: the address bar is gone. If it isn't, check the file with
   Google's tester at
   https://developers.google.com/digital-asset-links/tools/generator.

## Releasing an update

Most updates are just a site deploy. For an app update: edit
`twa-manifest.json`, raise `appVersionCode` (and `appVersionName`), then
`cd android && npx @bubblewrap/cli@1.25.0 update` to regenerate the project,
and build and upload as above.

## How this project was generated

The live site did not yet serve the PNG icons, so the project was generated
with `@bubblewrap/core`'s `TwaGenerator` against the local export
(`npx serve out -l 4180`), with only the icon URLs pointed at localhost.
Every URL in `twa-manifest.json` and the generated files is railmonk.com.
`bubblewrap update` can be used normally from now on.
