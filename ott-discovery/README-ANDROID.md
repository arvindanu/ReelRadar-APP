# REELRADAR Android build (GitHub Actions)

This migration uses Capacitor to open the existing production Next.js site in Android WebView. It deliberately avoids a second native UI so the existing mobile website remains the visual source of truth.

## Repository setup

1. Push the contents of this project directory to a GitHub repository.
2. Ensure the production website is deployed at `https://reelradar-ott-app.vercel.app` and its Next.js `/api/*` routes are operational. This is the URL already configured as the default in `capacitor.config.ts` and the workflow.
3. If the URL changes, add a GitHub repository **Variable** named `ANDROID_WEB_URL` with the full HTTPS origin. Do not put the TMDB token in this variable.
4. In Vercel, keep `TMDB_ACCESS_TOKEN` (and `TMDB_API_KEY` if your deployment uses it) in Vercel Environment Variables. The APK does not need these secrets because API requests go to the server.
5. In GitHub repository Settings → Secrets and variables → Actions, optionally add `TMDB_ACCESS_TOKEN` for the CI build. Do not use a `NEXT_PUBLIC_` variable for the TMDB token.

## Build an APK

- Every push to `main` runs the workflow.
- Actions → Android APK → Run workflow triggers it manually.
- Pushing a tag such as `v1.0.0` also creates/updates a GitHub Release and attaches available APKs.
- Open the completed workflow run → Artifacts → download `reelradar-debug-apk-*`. Extract the APK and install it on an Android phone. For a debug APK, allow installation from the file manager/browser when Android asks.

The workflow pins Node 22.16.0, Java 21, Capacitor 7.4.3 / Android 7.4.3 / CLI 7.4.3, and Gradle 8.11.1. Android SDK packages are installed by `android-actions/setup-android`. Gradle and npm caches are enabled. The Capacitor Android project is currently generated during the workflow; see the audit document for the remaining repository-contract gap.

## Optional signed release APK

Create a private upload keystore on a trusted machine (this is a one-time signing-key operation):

```bash
keytool -genkeypair -v -keystore reelradar-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias reelradar
base64 -w 0 reelradar-release.jks
```

On macOS, use `base64 < reelradar-release.jks` instead of `base64 -w 0`. Store the resulting base64 string securely and add these GitHub Actions **Secrets**:

- `ANDROID_KEYSTORE_BASE64`: base64 contents of the `.jks` file
- `ANDROID_KEY_ALIAS`: for example `reelradar`
- `ANDROID_KEYSTORE_PASSWORD`: keystore password
- `ANDROID_KEY_PASSWORD`: key password

Never commit the keystore, passwords, or base64 contents. With all four secrets present the workflow builds and signs a release APK in addition to the debug APK. Keep a secure backup of the keystore; losing it can prevent future updates from being signed with the same identity.

## API-key exposure

No TMDB key is added to the Android assets or Capacitor configuration. TMDB calls are made to the existing Next.js API routes on Vercel, where `TMDB_ACCESS_TOKEN` / `TMDB_API_KEY` remain server-side. The APK contains the public website URL, not the TMDB secret. Do not add TMDB credentials to `NEXT_PUBLIC_*` variables.

## If the workflow fails

- `npm ci`: verify `package.json` and `package-lock.json` are committed together and that the lockfile is valid.
- Next.js build: inspect the first TypeScript/build error; confirm any required server environment variables are present in GitHub Secrets and Vercel.
- Capacitor sync / Android build: inspect the generated `android` Gradle output and confirm the configured Capacitor/Gradle versions; rerun the workflow after correcting the first failing step.
- Missing artifact: confirm `assembleDebug` completed and the upload step found `android/app/build/outputs/apk/debug/*.apk`.
- App opens the wrong site: correct the `ANDROID_WEB_URL` repository variable to the deployed Next.js origin, including `https://`.

## Manual phone checklist

- [ ] App launches and displays the same mobile home page as the deployed website.
- [ ] Test every route listed in `docs/ANDROID-MIGRATION-AUDIT.md`.
- [ ] Test search, filters, provider selection, details, wishlist and all cross-page handoffs.
- [ ] Rotate device and test narrow/wide phone layouts, keyboard opening, scrolling and safe areas.
- [ ] Test Android back from nested routes, modal, open menus and keyboard.
- [ ] Test share and clipboard from each feature that offers them.
- [ ] Test Roulette audio after a user gesture.
- [ ] Test YouTube playback, external links and fullscreen.
- [ ] Test DropClock reminders with the app foregrounded, backgrounded and closed (native notifications are not yet guaranteed).
- [ ] Test persistence after force-close and relaunch.
- [ ] Compare same-device screenshots against the website at matching viewport, font scale and display scale.
