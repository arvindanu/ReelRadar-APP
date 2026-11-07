# REELRADAR Android migration audit

## Decision

Use Capacitor 7 with the existing deployed Next.js site loaded in Android System WebView. The current project is a Next.js App Router application with nine server route handlers. A static export cannot preserve those handlers. Bundling the static frontend would therefore break discovery, detail, ActorLens, BingeClock, Collide, DropClock, Roulette, TimeLiner and VibeFlix data flows. The remote-site wrapper preserves the existing deployed rendering and server APIs without a second UI implementation.

Production URL configured: `https://reelradar-ott-app.vercel.app` (can be overridden by the GitHub repository variable `ANDROID_WEB_URL`).

## Route and feature checklist

| Area | Source route/files | Audit status |
|---|---|---|
| Main discovery feed, search, movies/series/documentaries, language and region filters, provider filters, wishlist and detail modal | `/`, `app/page.tsx` | Present in source; served unchanged by remote WebView |
| ActorLens search/profile | `/actorlens`, `/actorlens/[id]`, `app/actorlens/*` | Present; API-backed |
| BingeClock | `/bingeclock`, `app/bingeclock/page.tsx` | Present; local progress and share links use browser storage/share APIs |
| Collide | `/collide`, `app/collide/page.tsx` | Present; share uses Web Share with clipboard fallback |
| DropClock | `/dropclock`, `app/dropclock/*` | Present; release reminders use browser Notifications API (native WebView support not guaranteed) |
| Roulette | `/roulette`, `app/roulette/page.tsx` | Present; uses Web Audio API and localStorage |
| TimeLiner list/detail | `/timeliner`, `/timeliner/[id]`, `app/timeliner/*` | Present; sessionStorage handoff between pages |
| VibeFlix | `/vibeflix`, `app/vibeflix/page.tsx` | Present; localStorage and share/clipboard |
| Server API: ActorLens | `/api/actorlens` | Present; TMDB server token/key |
| Server API: BingeClock | `/api/bingeclock` | Present; TMDB server token/key |
| Server API: Collide | `/api/collide` | Present; TMDB server token/key |
| Server API: details | `/api/details` | Present; TMDB server token/key |
| Server API: discovery | `/api/discover` | Present; TMDB server token/key |
| Server API: DropClock | `/api/dropclock` | Present; TMDB server token/key |
| Server API: Roulette | `/api/roulette` | Present; TMDB server token/key |
| Server API: TimeLiner | `/api/timeliner` | Present; TMDB server token/key |
| Server API: VibeFlix | `/api/vibeflix` | Present; TMDB server token/key |

## UI, assets, libraries and motion

- Framework: Next.js 15 App Router, React 19, TypeScript.
- Styling: `app/globals.css`, `app/actorlens/actorlens.css`, `app/dropclock/dropclock.css`, Tailwind CSS 3.4.17 with extensive custom CSS.
- Icons: `lucide-react` 0.468.0.
- Fonts: DM Sans and Space Grotesk from Google Fonts CSS import.
- Local image asset: `public/reelradar-logo.png`.
- Remote artwork: TMDB image host `image.tmdb.org`; YouTube thumbnails/trailers and external JustWatch/TMDB links are remote.
- Motion found in CSS includes shimmer keyframes, card hover transforms, transitions, and per-card stagger delays. Roulette uses Web Audio API. No separate animation framework was identified in package.json.
- The Android WebView executes the same website code; CSS and responsive breakpoints are not rewritten in this migration.

## Browser capabilities and Android permissions

| Capability | Found usage | Android handling / limitation |
|---|---|---|
| Persistent storage | localStorage in wishlist, VibeFlix, BingeClock and TimeLiner | WebView origin storage; persists for the installed app while app data remains |
| Session storage | cross-route handoff state | WebView sessionStorage |
| Share | `navigator.share` in discovery, ActorLens, BingeClock, Collide and VibeFlix | Android Web Share support depends on WebView/OS; browser clipboard fallback exists in source |
| Clipboard | `navigator.clipboard.writeText` | Secure-context/WebView support dependent; existing fallback/error handling retained |
| Notifications | DropClock `Notification` API and scheduled `setTimeout` | **Not verified / likely unsupported in Android WebView.** Native local notification plugin integration is still required for reliable background reminders; current wrapper must not be represented as having this native capability |
| Audio | Roulette Web Audio API | WebView audio; verify device autoplay/user-gesture behavior |
| Camera / microphone / geolocation | No usage found in scanned application source | No runtime permission is currently requested |
| Downloads / file access | No explicit download attribute or native file API found in scanned source | No storage permission added; test external download links individually |
| Video | YouTube trailer links; no native video component found in scan | External links/WebView playback; fullscreen behavior requires device verification |

## Build and verification status

- [x] Capacitor configuration added with the deployed site URL and app identity.
- [x] GitHub Actions workflow added for main pushes, manual dispatch and `v*` tags.
- [x] Node 22.16.0, Java 21 and Gradle 8.11.1 are pinned in workflow configuration.
- [x] Workflow installs Android SDK, caches npm/Gradle, builds Next.js, generates/syncs Capacitor Android project and builds debug APK.
- [x] Workflow increments Android versionCode from `GITHUB_RUN_NUMBER`.
- [x] Optional release signing and GitHub Release upload configured.
- [ ] Android project files and Gradle wrapper are generated by Capacitor in CI rather than committed in this archive. This is a known deviation from the requested repository contract.
- [ ] A clean GitHub Actions run has not been executed from this environment.
- [ ] Android emulator screenshots and pixel-diff report have not been produced; no Android emulator/SDK is available in this environment.
- [ ] Native back-button, splash screen, status/navigation bars, app icon, notification scheduling, downloads and fullscreen require on-device verification and/or additional native integration.

## Known non-identical or unverified behavior

1. The app loads the live Vercel website, not a bundled offline copy. It requires internet access and the production URL to remain available. Website deployments update the Android app's UI automatically.
2. Google Fonts, TMDB images, YouTube and server APIs remain network resources; offline parity is not possible.
3. DropClock browser notifications are not guaranteed in Android WebView. A Capacitor Local Notifications implementation is needed to guarantee scheduled notifications when the app is backgrounded or closed.
4. Browser Web Share, clipboard, external link routing, audio and video behavior vary by Android System WebView version and need real-device tests.
5. No visual claim of pixel-perfect verification is made until matching website/emulator screenshots are captured at the same viewport/device scale and compared.
