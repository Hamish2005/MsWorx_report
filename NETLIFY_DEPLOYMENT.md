# Netlify Deployment

This dashboard should deploy as a Next.js app, not as a static export, because it uses server-side API routes to call SkyPrep without exposing the API key to the browser.

## Build settings

Netlify will read these from `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `.next`
- Node version: `20`
- Plugin: `@netlify/plugin-nextjs`

## Environment variables

Set these in Netlify under Site configuration > Environment variables:

```text
SKYPREP_API_KEY=your_real_skyprep_api_key
SKYPREP_ACCOUNT_KEY=vincentianuniversity.org
DASHBOARD_ACCESS_CODE=choose_a_private_dashboard_code
DASHBOARD_SESSION_SECRET=use_a_long_random_value
```

Optional fallback report IDs:

```text
SKYPREP_USERS_REPORT_ID=576212
SKYPREP_COURSES_REPORT_ID=576211
```

The app normally discovers the newest saved reports by name, so the fallback IDs are only used if discovery fails for the latest report.

## Notes

- Do not add `.env` to Netlify or Git. Enter the same values through Netlify's environment variable UI.
- The first live refresh may take longer because Netlify has to start the serverless function and then SkyPrep has to return the saved report CSV files.
- If the first refresh times out on a lower Netlify plan, reload and try again. The app caches successful report aggregates server-side for 15 minutes.

