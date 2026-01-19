# Vercel Deployment Notes

## Dashboard Configuration (Build & Development Settings)

Configure these settings in your Vercel project dashboard under **Settings → Build & Development Settings**:

- **Framework Preset**: Other
- **Root Directory**: `misfits`
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## Environment Variables

In **Settings → Environment Variables**, add all Firebase config variables:
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

## Deployment

1. Connect your GitHub repository to Vercel
2. Vercel will auto-deploy on push to main branch
3. Or deploy manually via CLI:
   ```bash
   vercel --prod
   ```

## Notes

- The `vercel.json` file only contains SPA rewrites (all routes → `index.html`)
- Build commands are configured in the dashboard to enable zero-config deployment
- Do NOT add `builds`, `installCommand`, `buildCommand`, or `outputDirectory` to `vercel.json` as they override dashboard settings
