export type SpotifyProfile = {
  displayName: string;
  imageUrl: string | null;
  profileUrl: string | null;
};

export type SpotifyArtist = {
  id: string;
  name: string;
  imageUrl: string | null;
};

export type SpotifyTrack = {
  id: string;
  name: string;
  artists: string;
  imageUrl: string | null;
};

export type SpotifyData = {
  profile: SpotifyProfile;
  topArtists: SpotifyArtist[];
  recentlyPlayed: SpotifyTrack[];
};

type TokenSet = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

const ACCOUNTS_URL = "https://accounts.spotify.com";
const API_URL = "https://api.spotify.com/v1";
const TOKEN_KEY = "musicmatch.spotify.tokens";
const VERIFIER_KEY = "musicmatch.spotify.pkce.verifier";
const STATE_KEY = "musicmatch.spotify.pkce.state";
const SCOPES = ["user-read-private", "user-top-read", "user-read-recently-played"];

export class SpotifyConfigurationError extends Error {}

function getConfiguration() {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID?.trim();
  const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI?.trim();

  if (!clientId) {
    throw new SpotifyConfigurationError("Spotify is not configured. Add VITE_SPOTIFY_CLIENT_ID to your local .env file.");
  }

  if (!redirectUri) {
    throw new SpotifyConfigurationError("Spotify is not configured. Add VITE_SPOTIFY_REDIRECT_URI to your local .env file.");
  }

  let parsedRedirectUri: URL;
  try {
    parsedRedirectUri = new URL(redirectUri);
  } catch {
    throw new SpotifyConfigurationError("VITE_SPOTIFY_REDIRECT_URI must be an absolute URL registered in the Spotify dashboard.");
  }

  const isSecure = parsedRedirectUri.protocol === "https:";
  const isLocalLoopback = parsedRedirectUri.protocol === "http:" && parsedRedirectUri.hostname === "127.0.0.1";
  if (!isSecure && !isLocalLoopback) {
    throw new SpotifyConfigurationError("Spotify requires HTTPS redirect URIs, except http://127.0.0.1 for local development. Use the exact URI registered in the dashboard.");
  }

  return { clientId, redirectUri };
}

function getSessionItem(key: string) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    throw new SpotifyConfigurationError("Browser storage is unavailable, so Spotify sign-in cannot safely continue.");
  }
}

function setSessionItem(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    throw new SpotifyConfigurationError("Browser storage is unavailable, so Spotify sign-in cannot safely continue.");
  }
}

function removeSessionItem(key: string) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Signing out should still clear in-memory UI state.
  }
}

function randomString(length: number) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
}

async function codeChallenge(verifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function parseTokens(value: string | null): TokenSet | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed === "object" && parsed !== null &&
      "accessToken" in parsed && typeof parsed.accessToken === "string" &&
      "refreshToken" in parsed && typeof parsed.refreshToken === "string" &&
      "expiresAt" in parsed && typeof parsed.expiresAt === "number"
    ) {
      return parsed as TokenSet;
    }
  } catch {
    // Treat malformed session data as a signed-out session.
  }
  return null;
}

function saveTokens(response: TokenResponse, previousRefreshToken?: string): TokenSet {
  if (!response.access_token || !response.expires_in) {
    throw new Error("Spotify did not return a usable access token. Please try connecting again.");
  }
  const refreshToken = response.refresh_token ?? previousRefreshToken;
  if (!refreshToken) {
    throw new Error("Spotify did not return a refresh token. Please reconnect your account.");
  }
  const tokens = {
    accessToken: response.access_token,
    refreshToken,
    expiresAt: Date.now() + response.expires_in * 1000,
  };
  setSessionItem(TOKEN_KEY, JSON.stringify(tokens));
  return tokens;
}

async function responseError(response: Response) {
  let detail = "";
  try {
    const body: unknown = await response.json();
    if (typeof body === "object" && body !== null) {
      const message = "error_description" in body ? body.error_description : "error" in body ? body.error : undefined;
      if (typeof message === "string") detail = message;
      if (typeof message === "object" && message !== null && "message" in message && typeof message.message === "string") detail = message.message;
    }
  } catch {
    // Spotify responses are not guaranteed to be JSON.
  }
  return detail || response.statusText || "Spotify returned an unexpected error.";
}

async function requestTokens(payload: URLSearchParams, previousRefreshToken?: string) {
  const response = await fetch(`${ACCOUNTS_URL}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload,
  });
  if (!response.ok) {
    const detail = await responseError(response);
    if (/invalid client|invalid_client/i.test(detail)) {
      throw new Error("Spotify rejected this client ID. Confirm VITE_SPOTIFY_CLIENT_ID belongs to the app whose redirect URI is registered in the Spotify dashboard.");
    }
    if (/redirect/i.test(detail)) {
      throw new Error("Spotify rejected the redirect URI. It must exactly match a redirect URI in the Spotify dashboard, including protocol, port, path, and trailing slash.");
    }
    throw new Error(`Spotify sign-in failed: ${detail}`);
  }
  return saveTokens(await response.json() as TokenResponse, previousRefreshToken);
}

async function refreshTokens(tokens: TokenSet) {
  const { clientId } = getConfiguration();
  return requestTokens(new URLSearchParams({
    client_id: clientId,
    grant_type: "refresh_token",
    refresh_token: tokens.refreshToken,
  }), tokens.refreshToken);
}

async function validTokens() {
  const tokens = parseTokens(getSessionItem(TOKEN_KEY));
  if (!tokens) return null;
  if (tokens.expiresAt > Date.now() + 30_000) return tokens;
  try {
    return await refreshTokens(tokens);
  } catch {
    clearSpotifySession();
    return null;
  }
}

async function spotifyFetch(path: string, tokens: TokenSet, retry = true): Promise<Response> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });
  if (response.status === 401 && retry) {
    const refreshed = await refreshTokens(tokens);
    return spotifyFetch(path, refreshed, false);
  }
  return response;
}

async function getJson<T>(path: string, tokens: TokenSet): Promise<T> {
  const response = await spotifyFetch(path, tokens);
  if (!response.ok) {
    const detail = await responseError(response);
    if (response.status === 403) {
      throw new Error("Spotify denied this data request. In Development Mode, add this Spotify account to the app allowlist and confirm the app owner has Premium.");
    }
    if (response.status === 429) {
      throw new Error("Spotify is rate limiting this app. Please wait a moment and try again.");
    }
    throw new Error(`Spotify data request failed: ${detail}`);
  }
  return response.json() as Promise<T>;
}

type MeResponse = { display_name: string | null; images: { url: string }[]; external_urls?: { spotify?: string } };
type ArtistResponse = { items: { id: string; name: string; images: { url: string }[] }[] };
type RecentResponse = { items: { played_at: string; track: { id: string; name: string; artists: { name: string }[]; album: { images: { url: string }[] } } }[] };

export async function loadSpotifyData() {
  const tokens = await validTokens();
  if (!tokens) return null;
  const [profile, artists, recentlyPlayed] = await Promise.all([
    getJson<MeResponse>("/me", tokens),
    getJson<ArtistResponse>("/me/top/artists?limit=5&time_range=medium_term", tokens),
    getJson<RecentResponse>("/me/player/recently-played?limit=4", tokens),
  ]);
  return {
    profile: {
      displayName: profile.display_name || "Spotify listener",
      imageUrl: profile.images[0]?.url ?? null,
      profileUrl: profile.external_urls?.spotify ?? null,
    },
    topArtists: artists.items.map((artist) => ({ id: artist.id, name: artist.name, imageUrl: artist.images[0]?.url ?? null })),
    recentlyPlayed: recentlyPlayed.items.map(({ track, played_at: playedAt }) => ({
      id: `${track.id}-${playedAt}`,
      name: track.name,
      artists: track.artists.map((artist) => artist.name).join(", "),
      imageUrl: track.album.images[0]?.url ?? null,
    })),
  } satisfies SpotifyData;
}

export async function beginSpotifyAuthorization() {
  const { clientId, redirectUri } = getConfiguration();
  const verifier = randomString(96);
  const state = randomString(32);
  setSessionItem(VERIFIER_KEY, verifier);
  setSessionItem(STATE_KEY, state);
  const url = new URL(`${ACCOUNTS_URL}/authorize`);
  url.search = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: SCOPES.join(" "),
    state,
    code_challenge_method: "S256",
    code_challenge: await codeChallenge(verifier),
  }).toString();
  window.location.assign(url.toString());
}

export async function handleSpotifyCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const oauthError = params.get("error");
  if (!code && !oauthError) return false;

  const receivedState = params.get("state");
  const expectedState = getSessionItem(STATE_KEY);
  cleanCallbackUrl();
  if (!expectedState || !receivedState || receivedState !== expectedState) {
    throw new Error("Spotify sign-in could not be verified. Please start the connection again.");
  }
  removeSessionItem(STATE_KEY);

  if (oauthError) {
    throw new Error(oauthError === "access_denied" ? "Spotify authorization was cancelled." : `Spotify authorization failed: ${oauthError}`);
  }

  if (!code) {
    throw new Error("Spotify did not return an authorization code. Please start the connection again.");
  }

  const verifier = getSessionItem(VERIFIER_KEY);
  removeSessionItem(VERIFIER_KEY);
  if (!verifier) {
    throw new Error("The Spotify sign-in verifier is missing. Please start the connection again in this browser tab.");
  }

  const { clientId, redirectUri } = getConfiguration();
  await requestTokens(new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  }));
  return true;
}

function cleanCallbackUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.searchParams.delete("error");
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
}

export function clearSpotifySession() {
  removeSessionItem(TOKEN_KEY);
  removeSessionItem(VERIFIER_KEY);
  removeSessionItem(STATE_KEY);
}
