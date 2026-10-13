# MusicMatch

MusicMatch is a React and TypeScript music-discovery demo. Its social discovery and matching data remains local demo data. Connecting Spotify adds the authenticated listener's actual Spotify profile, top artists, and recently played tracks to the Profile screen.

## Run locally

```powershell
npm.cmd install
Copy-Item .env.example .env
npm.cmd run dev -- --host 127.0.0.1
```

Use the URL printed by Vite. The default example is `http://127.0.0.1:5173/`; Vite's SPA fallback also serves the OAuth callback path.

## Spotify configuration

Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), then configure `.env` (which is ignored by Git):

```dotenv
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/callback
```

In the dashboard, add **the exact same value** as `VITE_SPOTIFY_REDIRECT_URI` to the app's Redirect URIs. Protocol, host, port, path, case, and trailing slash must match. Spotify accepts HTTPS redirect URIs, with `http://127.0.0.1` allowed for local development; do not use `localhost` for a new Spotify integration.

This browser-only app uses Authorization Code with PKCE and never needs or reads a Spotify client secret. It requests only `user-read-private`, `user-top-read`, and `user-read-recently-played`.

Development Mode currently requires a Premium app owner and allows up to five allowlisted Spotify users. Add each tester in Dashboard → your app → Settings → Users Management. A user can complete login but receive `403` API responses until allowlisted.

## Checks

```powershell
npm.cmd run lint
npm.cmd run build
```

OAuth requires a real dashboard registration and browser session to test end-to-end. The UI reports configuration, authorization, permission, rate-limit, and token-refresh failures without logging tokens.
