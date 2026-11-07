import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.reelradar.app',
  appName: 'REELRADAR',
  webDir: 'www',
  server: {
    // The production Next.js site hosts the UI and server-side /api routes.
    // Override with the ANDROID_WEB_URL environment variable when building.
    url: process.env.ANDROID_WEB_URL || 'https://reelradar-ott-app.vercel.app',
    cleartext: false,
    allowNavigation: ['reelradar-ott-app.vercel.app'],
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};
export default config;
