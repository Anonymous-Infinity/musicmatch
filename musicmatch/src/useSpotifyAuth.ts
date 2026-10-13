import { useCallback, useEffect, useState } from "react";
import {
  beginSpotifyAuthorization,
  clearSpotifySession,
  handleSpotifyCallback,
  loadSpotifyData,
  type SpotifyData,
} from "./spotify";

export type SpotifyAuthState = {
  status: "checking" | "unauthenticated" | "authenticated" | "error";
  data: SpotifyData | null;
  error: string | null;
};

let initialization: Promise<SpotifyAuthState> | null = null;

async function initialize(): Promise<SpotifyAuthState> {
  try {
    await handleSpotifyCallback();
    const data = await loadSpotifyData();
    return data ? { status: "authenticated", data, error: null } : { status: "unauthenticated", data: null, error: null };
  } catch (error) {
    clearSpotifySession();
    return { status: "error", data: null, error: error instanceof Error ? error.message : "Spotify sign-in failed." };
  }
}

export function useSpotifyAuth() {
  const [state, setState] = useState<SpotifyAuthState>({ status: "checking", data: null, error: null });

  useEffect(() => {
    initialization ??= initialize();
    void initialization.then(setState);
  }, []);

  const connect = useCallback(async () => {
    try {
      setState((current) => ({ ...current, status: "checking", error: null }));
      await beginSpotifyAuthorization();
    } catch (error) {
      setState({ status: "error", data: null, error: error instanceof Error ? error.message : "Spotify sign-in could not start." });
    }
  }, []);

  const disconnect = useCallback(() => {
    clearSpotifySession();
    initialization = null;
    setState({ status: "unauthenticated", data: null, error: null });
  }, []);

  const retry = useCallback(() => {
    initialization = initialize();
    setState({ status: "checking", data: null, error: null });
    void initialization.then(setState);
  }, []);

  return { ...state, connect, disconnect, retry };
}
