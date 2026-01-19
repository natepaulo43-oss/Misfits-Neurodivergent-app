# Vercel Deployment Notes

1. Install dependencies inside the `misfits` workspace before building:
   ```bash
   npm install --prefix misfits
   ```
2. Build the static site used by Vercel:
   ```bash
   npm run vercel-build --prefix misfits
   ```
3. Deploy from the repo root with Vercel CLI (or hook the GitHub repo to Vercel):
   ```bash
   vercel --prod
   ```
4. Ensure `.env` values required by Expo/Firebase are configured in Vercel project settings (e.g., `EXPO_PUBLIC_FIREBASE_*`).
5. For SPA routing support, the provided `vercel.json` rewrites all paths to `index.html`.
