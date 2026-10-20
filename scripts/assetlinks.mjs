// Writes public/.well-known/assetlinks.json, which proves to Android that the
// Play Store app (android/) and railmonk.com belong together. Without it the
// app still opens, but shows a browser address bar at the top.
//
// The certificate fingerprints live in android/twa-manifest.json under
// "fingerprints" — the Play App Signing key from Play Console (App integrity
// → App signing), and the upload key for testing builds installed by hand.
// See android/README.md. With none listed, no file is written.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const twa = JSON.parse(readFileSync("android/twa-manifest.json", "utf8"));
const prints = (twa.fingerprints ?? []).map((f) => f.value).filter(Boolean);
const out = "public/.well-known/assetlinks.json";

if (prints.length === 0) {
  rmSync(out, { force: true });
} else {
  mkdirSync("public/.well-known", { recursive: true });
  const statement = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: { namespace: "android_app", package_name: twa.packageId, sha256_cert_fingerprints: prints },
    },
  ];
  writeFileSync(out, JSON.stringify(statement, null, 2) + "\n");
}
