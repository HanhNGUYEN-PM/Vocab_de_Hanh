<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1xaSPZyZy9uHDSa1Jb5HB2Y3Gg4WfcyJL

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Automatic cloud sync deployment

The application stores your vocabulary in a lightweight cloud bucket powered by [dweet.io](https://dweet.io/). There is no
additional infrastructure to deploy: once the site is hosted (for example on Vercel), every device will read from and write
to the same bucket.

To make the bucket unique to your deployment, define the environment variable `VITE_CLOUD_STORAGE_THING` with any short,
URL-friendly name (for example `mon-vocabulaire`). Set it both when running locally (`.env.local`) and in your hosting
provider's dashboard. During build time the value is injected automatically into both the React bundle and the standalone
HTML page.

If you encounter the message « Impossible de contacter le service de synchronisation automatique pour l'instant. », verify
that:

- The device has internet access and can reach `https://dweet.io` (some corporate or mobile networks block it).
- The environment variable `VITE_CLOUD_STORAGE_THING` resolves to the same value across every deployment (Vercel, local
  builds, and the downloaded HTML file). When unset, the app falls back to `vocab-de-hanh-database`.
- Your vocabulary list is not excessively large—payloads are compressed, but reducing unused entries keeps the sync requests
  fast and reliable.
