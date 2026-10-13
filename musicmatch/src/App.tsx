
import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useSpotifyAuth } from "./useSpotifyAuth";
import "./App.css";

type Page = "discover" | "map" | "matches" | "profile" | "settings";

type Person = {
  id: number;
  name: string;
  age: number;
  distance: number;
  match: number;
  bio: string;
  image: string;
  artists: string[];
  genres: string[];
  tracks: string[];
  likedYou: boolean;
};

const people: Person[] = [
  {
    id: 1,
    name: "Maya",
    age: 20,
    distance: 1.2,
    match: 94,
    bio: "Collecting memories, playlists, and reasons to stay up late.",
    image: "photo-1534528741775-53994a69daeb",
    artists: ["Joji", "Lana Del Rey", "The Weeknd"],
    genres: ["Dream pop", "Indie", "R&B"],
    tracks: ["Glimpse of Us", "Summertime Sadness", "After Hours"],
    likedYou: true,
  },
  {
    id: 2,
    name: "Arjun",
    age: 21,
    distance: 2.4,
    match: 87,
    bio: "Alternative music, late-night drives, and terrible puns.",
    image: "photo-1500648767791-00dcc994a43e",
    artists: ["Radiohead", "Joji", "Cigarettes After Sex"],
    genres: ["Alternative", "Indie", "Rock"],
    tracks: ["No Surprises", "Slow Dancing", "Apocalypse"],
    likedYou: false,
  },
  {
    id: 3,
    name: "Zoya",
    age: 19,
    distance: 3.1,
    match: 82,
    bio: "My playlists know me better than most people do.",
    image: "photo-1524504388940-b1c1722653e1",
    artists: ["Frank Ocean", "SZA", "The Weeknd"],
    genres: ["R&B", "Soul", "Pop"],
    tracks: ["Pink + White", "Snooze", "Die For You"],
    likedYou: true,
  },
  {
    id: 4,
    name: "Rohan",
    age: 20,
    distance: 4.6,
    match: 76,
    bio: "One good album can fix an entire week.",
    image: "photo-1506794778202-cad84cf45f1d",
    artists: ["Arctic Monkeys", "Tame Impala", "Joji"],
    genres: ["Indie rock", "Alternative", "Psychedelic"],
    tracks: ["505", "The Less I Know", "Sanctuary"],
    likedYou: false,
  },
];

const artwork = [
  "photo-1516280440614-37939bbacd81",
  "photo-1470225620780-dba8ba36b745",
  "photo-1511379938547-c1f69419868d",
  "photo-1493225457124-a3eb161ffa5f",
];

function photo(id: string, width = 600) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
}

function Icon({ children }: { children: string }) {
  return <span className="icon" aria-hidden="true">{children}</span>;
}


function usePersistentState<T>(
  key: string,
  initialValue: T,
  isValid: (value: unknown) => value is T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);

      if (stored === null) return initialValue;

      const parsed: unknown = JSON.parse(stored);
      return isValid(parsed) ? parsed : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Private browsing and quota restrictions should not interrupt the demo.
    }
  }, [key, value]);

  return [value, setValue];
}

const isPersonIdArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every(
    (item) => typeof item === "number" && people.some((person) => person.id === item),
  );

const isMessages = (value: unknown): value is Record<number, string[]> =>
  typeof value === "object" && value !== null &&
  Object.values(value).every(
    (conversation) => Array.isArray(conversation) && conversation.every((message) => typeof message === "string"),
  );

const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const isString = (value: unknown): value is string => typeof value === "string";
const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";
const isDiscoveryIndex = (value: unknown): value is number =>
  isNumber(value) && Number.isInteger(value) && value >= 0 && value <= people.length;
const isRadius = (value: unknown): value is number =>
  isNumber(value) && Number.isInteger(value) && value >= 1 && value <= 25;

function clampDiscoveryIndex(value: number) {
  return Math.min(Math.max(0, value), people.length);
}


export default function App() {
  const spotify = useSpotifyAuth();
  const [page, setPage] = useState<Page>("discover");
  const [index, setIndex] = usePersistentState("musicmatch.discovery-index", 0, isDiscoveryIndex);
  const [liked, setLiked] = usePersistentState("musicmatch.likes", [], isPersonIdArray);
  const [passed, setPassed] = usePersistentState("musicmatch.passes", [], isPersonIdArray);
  const [matches, setMatches] = usePersistentState("musicmatch.matches", [3], isPersonIdArray);
  const [selected, setSelected] = useState<Person | null>(null);
  const [matchPopup, setMatchPopup] = useState<Person | null>(null);
  const [chatPerson, setChatPerson] = useState<Person | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = usePersistentState("musicmatch.messages", {}, isMessages);
  const [name, setName] = usePersistentState("musicmatch.profile-name", "Alex Morgan", isString);
  const [bio, setBio] = usePersistentState("musicmatch.profile-bio", "Finding my people, one song at a time.", isString);
  const [radius, setRadius] = usePersistentState("musicmatch.discovery-radius", 10, isRadius);
  const [visible, setVisible] = usePersistentState("musicmatch.discovery-visible", true, isBoolean);
  const [dark, setDark] = usePersistentState("musicmatch.theme-dark", true, isBoolean);
  const [query, setQuery] = useState("");

  const safeIndex = clampDiscoveryIndex(index);
  const current = people[safeIndex];
  const connectedPeople = people.filter((p) => matches.includes(p.id));
  const nearbyPeople = people.filter((person) => person.distance <= radius);
  const filteredNearbyPeople = nearbyPeople.filter((person) =>
    person.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const spotifyConnected = spotify.status === "authenticated" && spotify.data !== null;
  const profileName = spotify.data?.profile.displayName ?? name;
  const spotifyDisplayName = spotify.data?.profile.displayName ?? "your Spotify account";
  const profileImage = spotify.data?.profile.imageUrl ?? null;
  const topArtists = spotify.data?.topArtists ?? [];
  const recentlyPlayed = spotify.data?.recentlyPlayed ?? [];

  function updateRadius(value: number) {
    const nextRadius = Math.min(25, Math.max(1, value));
    setRadius(nextRadius);
    if (selected && selected.distance > nextRadius) setSelected(null);
  }

  function swipe(direction: "like" | "pass") {
    if (!current) return;

    if (direction === "like") {
      setLiked((old) => old.includes(current.id) ? old : [...old, current.id]);

      if (current.likedYou || matches.includes(current.id)) {
        setMatches((old) => old.includes(current.id) ? old : [...old, current.id]);
        setMatchPopup(current);
      }
    } else {
      setPassed((old) => old.includes(current.id) ? old : [...old, current.id]);
    }

    setSelected(null);
    setIndex((old) => clampDiscoveryIndex(old + 1));
  }

  function openChat(person: Person) {
    setChatPerson(person);
    setPage("matches");
    setMatchPopup(null);
  }

  function sendMessage() {
    if (!message.trim() || !chatPerson) return;

    setMessages((old) => ({
      ...old,
      [chatPerson.id]: [...(old[chatPerson.id] || []), message.trim()],
    }));

    setMessage("");
  }

  const navItems: { id: Page; label: string; icon: string }[] = [
    { id: "discover", label: "Discover", icon: "⌕" },
    { id: "map", label: "Nearby", icon: "◎" },
    { id: "matches", label: "Matches", icon: "♡" },
    { id: "profile", label: "Profile", icon: "◉" },
  ];

  return (
    <div className={`app ${dark ? "theme-dark" : "theme-light"}`}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <aside className="sidebar">
        <button className="brand" onClick={() => setPage("discover")}>
          <span className="brand-mark">♫</span>
          <span>music<span className="brand-accent">match</span></span>
        </button>

        <div className="side-label">YOUR SPACE</div>
        <nav className="side-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? "active" : ""}`}
              onClick={() => {
                setPage(item.id);
                setChatPerson(null);
              }}
            >
              <Icon>{item.icon}</Icon>
              <span>{item.label}</span>
              {item.id === "matches" && matches.length > 0 && (
                <span className="nav-count">{matches.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="spotify-status">
            <span className="status-dot" />
            <div>
              <strong>Spotify</strong>
              <span>{spotify.status === "checking" ? "Checking connection..." : spotifyConnected ? "Connected" : "Demo mode"}</span>
            </div>
            <span className="spotify-symbol">♫</span>
          </div>
          <button className="nav-item" onClick={() => setPage("settings")}>
            <Icon>⚙</Icon>
            <span>Settings</span>
          </button>
          <div className="sidebar-user">
            <div className="avatar avatar-self">{profileImage ? <img src={profileImage} alt="" /> : "A"}</div>
            <div className="user-label">
              <strong>{profileName}</strong>
              <span>{spotifyConnected ? "Spotify connected" : "Demo account"}</span>
            </div>
            <button className="icon-button" aria-label="Settings" onClick={() => setPage("settings")}>···</button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-mark">♫</span> music<span className="brand-accent">match</span>
          </div>
          <div className="breadcrumb">
            <span>MusicMatch</span><span className="muted">/</span>
            <strong>{page === "map" ? "Nearby" : page === "matches" ? "Connections" : page[0].toUpperCase() + page.slice(1)}</strong>
          </div>
          <div className="topbar-right">
            <span className="location-pill"><span className="status-dot" /> Bengaluru, IN</span>
            <button className="icon-button notification" aria-label="Notifications">♧</button>
          </div>
        </header>

        <div className="content">
          {page === "discover" && (
            <section className="discover-layout">
              <div className="discover-heading">
                <div>
                  <div className="eyebrow"><span className="eyebrow-line" /> YOUR NEXT FAVORITE PERSON</div>
                  <h1>Find your <span className="gradient-text">frequency.</span></h1>
                  <p className="subtitle">Meet people who just get your music.</p>
                </div>
                <div className="discover-actions">
                  <div className="radius-chip"><Icon>◎</Icon> Within {radius} km</div>
                  {!spotifyConnected && <div className="spotify-discover-card"><div><strong>{spotify.status === "checking" ? "Connecting to Spotify" : "Make your matches musical"}</strong><span>{spotify.status === "checking" ? "Preparing secure sign-in..." : "Connect Spotify to use your real listening data."}</span>{spotify.error && <span className="spotify-error" role="alert">{spotify.error}</span>}</div><button className="button-primary spotify-connect-button" onClick={spotify.connect} disabled={spotify.status === "checking"}>{spotify.status === "checking" ? "Connecting..." : spotify.status === "error" ? "Try again" : "Connect Spotify"}</button></div>}
                </div>
              </div>

              <div className="discover-grid">
                <div className="swipe-area">
                  {current ? (
                    <div className="profile-card">
                      <div className="card-photo-wrap">
                        <img className="card-photo" src={photo(current.image, 900)} alt={`${current.name}'s profile`} />
                        <div className="photo-shade" />
                        <div className="card-top-pills">
                          <span className="match-pill"><span>♫</span> {current.match}% match</span>
                          <span className="distance-pill">◎ {current.distance} km away</span>
                        </div>
                        <button className="card-more" onClick={() => setSelected(current)} aria-label="View full profile">···</button>
                        <div className="card-person">
                          <div className="online-label"><span className="status-dot" /> MUSICALLY ACTIVE</div>
                          <h2>{current.name}, {current.age}</h2>
                          <p>{current.bio}</p>
                        </div>
                      </div>
                      <div className="card-details">
                        <div className="section-mini-title">YOU BOTH LISTEN TO</div>
                        <div className="artist-row">
                          {current.artists.map((artist, i) => (
                            <div className="artist-chip" key={artist}>
                              <img src={photo(artwork[i % artwork.length], 100)} alt="" />
                              <span>{artist}</span>
                            </div>
                          ))}
                        </div>
                        <div className="genre-row">
                          {current.genres.map((genre) => <span className="genre-tag" key={genre}>{genre}</span>)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-card">
                      <div className="empty-icon">♫</div>
                      <h2>That's everyone for now.</h2>
                      <p>Try another radius or come back later for new people.</p>
                      <button className="button-primary" onClick={() => { setIndex(0); setLiked([]); setPassed([]); }}>Start again</button>
                    </div>
                  )}

                  {current && (
                    <div className="swipe-controls">
                      <button className="swipe-button pass-button" onClick={() => swipe("pass")} aria-label="Pass">✕</button>
                      <button className="rewind-button" onClick={() => setIndex((i) => Math.max(0, i - 1))} aria-label="Previous profile">↶</button>
                      <button className="swipe-button like-button" onClick={() => swipe("like")} aria-label="Like">♥</button>
                    </div>
                  )}
                  <p className="swipe-hint">← PASS <span>·</span> LIKE →</p>
                </div>

                <aside className="discovery-aside">
                  <div className="panel intro-panel">
                    <div className="panel-topline"><span className="music-note">♫</span><span className="live-badge">LIVE DEMO</span></div>
                    <h3>Your taste.<br />Your people.</h3>
                    <p>Compatibility built around the music you actually love.</p>
                    <div className="stat-grid">
                      <div><strong>{liked.length}</strong><span>Liked</span></div>
                      <div><strong>{passed.length}</strong><span>Passed</span></div>
                      <div><strong>{matches.length}</strong><span>Matches</span></div>
                      <div><strong>{people.length - safeIndex}</strong><span>To discover</span></div>
                    </div>
                  </div>

                  <div className="panel taste-panel">
                    <div className="panel-heading"><h3>Your sound</h3><span className="muted">THIS WEEK</span></div>
                    <div className="taste-feature">
                      <img src={photo(artwork[2], 140)} alt="" />
                      <div><span className="muted small">TOP GENRE</span><strong>Alternative R&B</strong><span className="small accent-text">Your current vibe</span></div>
                    </div>
                    <div className="mini-track">
                      <img src={photo(artwork[0], 90)} alt="" />
                      <div><strong>Slow Dancing in the Dark</strong><span>Joji</span></div>
                      <span className="track-note">♫</span>
                    </div>
                    <div className="mini-track">
                      <img src={photo(artwork[1], 90)} alt="" />
                      <div><strong>After Hours</strong><span>The Weeknd</span></div>
                      <span className="track-note">♫</span>
                    </div>
                  </div>

                  <div className="panel tip-panel">
                    <span className="tip-icon">✳</span>
                    <div><strong>A little tip</strong><p>Shared artists are a starting point. The best connections go beyond the numbers.</p></div>
                  </div>
                </aside>
              </div>
            </section>
          )}

          {page === "map" && (
            <section>
              
              <div className="page-heading">
                <div>
                  <div className="eyebrow">YOUR LOCAL SCENE</div>
                  <h1>
                    People in your <span className="gradient-text">orbit.</span>
                  </h1>
                  <p className="subtitle">
                    Find your sound, closer to home.
                  </p>
                </div>

                <div className="distance-control">
                  <div className="distance-heading">
                    <label htmlFor="distance-slider">Search radius</label>
                    <span className="distance-value">{radius} km</span>
                  </div>

                  <input
                    id="distance-slider"
                    className="distance-slider"
                    type="range"
                    min={1}
                    max={25}
                    step={1}
                    value={radius}
                    onChange={(e) => updateRadius(Number(e.target.value))}
                    aria-label="Search radius in kilometres"
                  />

                  <div className="distance-limits">
                    <span>1 km</span>
                    <span>25 km</span>
                  </div>
                </div>
              </div>


              <div className="map-layout">
                <div className="map-canvas">
                  <div className="map-grid" />
                  <div className="map-road road-a" />
                  <div className="map-road road-b" />
                  <div className="map-road road-c" />
                  <div className="map-road road-d" />
                  <div className="map-water" />

                  <div className="map-label label-a">INDIRANAGAR</div>
                  <div className="map-label label-b">ULSOOR LAKE</div>
                  <div className="map-label label-c">MG ROAD</div>
                  <div className="map-label label-d">YOUR AREA</div>

                  <div className="you-marker">
                    <span />
                    <div>YOU</div>
                  </div>

                  {nearbyPeople.map((person) => {
                      const markerIndex = people.findIndex((p) => p.id === person.id);

                      return (
                        <button
                          key={person.id}
                          className={`map-marker marker-${markerIndex} ${
                            selected?.id === person.id ? "selected" : ""
                          }`}
                          onClick={() => setSelected(person)}
                          aria-label={`View ${person.name}`}
                        >
                          <img src={photo(person.image, 100)} alt="" />
                          <span>{person.match}%</span>
                        </button>
                      );
                    })}

                  <div className="map-legend">
                    <span className="status-dot" />
                    People discovering nearby
                  </div>
                </div>

                <div className="nearby-panel panel">
                  <div className="panel-heading">
                    <div>
                      <h3>In your orbit</h3>
                      <p className="small muted">
                         {nearbyPeople.length} people within {radius} km
                      </p>
                    </div>
                    <span className="live-badge">LIVE</span>
                  </div>

                  <div className="search-box">
                    <Icon>⌕</Icon>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search people..."
                    />
                  </div>

                  {filteredNearbyPeople.map((person) => (
                      <button
                        className={`nearby-person ${selected?.id === person.id ? "selected" : ""}`}
                        key={person.id}
                        onClick={() => setSelected(person)}
                      >
                        <img src={photo(person.image, 100)} alt="" />

                        <div className="nearby-info">
                          <strong>
                            {person.name}, {person.age}
                          </strong>
                          <span>{person.distance} km away</span>
                          <span className="small accent-text">
                            {person.artists.slice(0, 2).join(" · ")}
                          </span>
                        </div>

                        <span className="nearby-score">{person.match}%</span>
                      </button>
                    ))}

                  {filteredNearbyPeople.length === 0 && (
                    <div className="empty-state">
                      <p>No people found within {radius} km.</p>
                      <p>Try increasing your search radius or changing your search.</p>
                    </div>
                  )}

                  {selected && (
                    <div className="selected-person">
                      <p className="eyebrow">SELECTED PROFILE</p>
                      <strong>
                        {selected.name} is a {selected.match}% match
                      </strong>
                      <p className="small muted">{selected.bio}</p>

                      <button
                        className="button-primary full-button"
                        onClick={() => {
                          setPage("discover");
                          setIndex(people.findIndex((p) => p.id === selected.id));
                          setSelected(null);
                        }}
                      >
                        View in Discover
                      </button>
                    </div>
                  )}

                  <p className="privacy-note">
                    ◎ Locations are illustrative. Exact coordinates are never shown.
                  </p>
                </div>
              </div>
            </section>
          )}

          {page === "matches" && (
            <section>
              <div className="page-heading"><div><div className="eyebrow">YOUR PEOPLE</div><h1>It's a <span className="gradient-text">connection.</span></h1><p className="subtitle">Good taste brought you here. See where it goes.</p></div></div>
              <div className="matches-layout">
                <div className="panel match-list">
                  <div className="panel-heading"><h3>Your matches <span className="count-pill">{connectedPeople.length}</span></h3></div>
                  {connectedPeople.length === 0 ? <div className="empty-state"><div className="empty-icon">♡</div><h3>Your next connection is out there.</h3><p>Like someone in Discover to start building your matches.</p><button className="button-primary" onClick={() => setPage("discover")}>Discover people</button></div> :
                    connectedPeople.map(person => (
                      <button key={person.id} className={`match-row ${chatPerson?.id === person.id ? "selected" : ""}`} onClick={() => setChatPerson(person)}>
                        <div className="match-avatar"><img src={photo(person.image, 120)} alt="" /><span className="online-dot" /></div>
                        <div className="match-row-info"><strong>{person.name}</strong><span>{(messages[person.id] || ["You matched over music ♫"]).slice(-1)[0]}</span></div>
                        <span className="match-percent">{person.match}%</span>
                      </button>
                    ))
                  }
                </div>
                <div className="panel chat-panel">
                  {chatPerson ? <>
                    <div className="chat-header"><img src={photo(chatPerson.image, 100)} alt="" /><div><strong>{chatPerson.name}</strong><span><span className="status-dot" /> Matched on music · {chatPerson.match}%</span></div><button className="icon-button" onClick={() => setChatPerson(null)}>×</button></div>
                    <div className="chat-messages">
                      <div className="chat-intro"><img src={photo(chatPerson.image, 150)} alt="" /><h3>You and {chatPerson.name}</h3><span>{chatPerson.match}% music compatibility</span><p>You both listen to {chatPerson.artists.slice(0, 2).join(" and ")}.</p></div>
                      <div className="message-bubble theirs">Okay, but what's one song you could listen to forever? <span>Now</span></div>
                      {(messages[chatPerson.id] || []).map((msg, i) => <div className="message-bubble mine" key={`${i}-${msg}`}>{msg}<span>Now</span></div>)}
                    </div>
                    <form className="chat-composer" onSubmit={e => { e.preventDefault(); sendMessage(); }}>
                      <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Say something about the music..." />
                      <button className="send-button" type="submit" disabled={!message.trim()} aria-label="Send message">↑</button>
                    </form>
                  </> : <div className="empty-state"><div className="empty-icon">♫</div><h3>Every connection has a soundtrack.</h3><p>Select a match to open a demo conversation.</p></div>}
                </div>
              </div>
            </section>
          )}

          {page === "profile" && (
            <section>
              <div className="page-heading"><div><div className="eyebrow">YOUR MUSICAL IDENTITY</div><h1>Your world, in <span className="gradient-text">sound.</span></h1><p className="subtitle">{spotifyConnected ? "Your Spotify profile and listening data." : "A little about you, a lot about what you love."}</p></div><button className="button-secondary" onClick={() => { const n = prompt("Display name", name); if (n?.trim()) setName(n.trim()); const b = prompt("Your bio", bio); if (b !== null) setBio(b); }}>✎ Edit profile</button></div>
              <div className="profile-layout">
                <div className="panel profile-hero">
                  <div className="profile-cover" />
                  <div className="profile-identity"><div className="profile-avatar">{profileImage ? <img src={profileImage} alt="Spotify profile" /> : "A"}</div><div className="profile-name"><h2>{profileName}</h2><span>{spotifyConnected ? "Spotify connected" : "@musiclover · Bengaluru"}</span></div><span className="profile-complete">{spotifyConnected ? "SPOTIFY DATA" : "PROFILE PREVIEW"}</span></div>
                  <p className="profile-bio">{bio}</p>
                  <div className="profile-stats"><div><strong>{spotifyConnected ? topArtists.length : 12}</strong><span>Top artists</span></div><div><strong>{spotifyConnected ? recentlyPlayed.length : 38}</strong><span>Recent tracks</span></div><div><strong>{matches.length}</strong><span>Connections</span></div></div>
                </div>
                <div className="panel">
                  <div className="panel-heading"><h3>Your top artists</h3><span className="muted small">{spotifyConnected ? "SPOTIFY · 6 MONTHS" : "DEMO DATA"}</span></div>
                  {spotifyConnected ? (topArtists.length > 0 ? topArtists.map((artist, i) => <div className="rank-row" key={artist.id}><span className="rank-number">0{i + 1}</span>{artist.imageUrl ? <img src={artist.imageUrl} alt="" /> : <span className="artwork-placeholder">♫</span>}<strong>{artist.name}</strong><span className="rank-bars"><i style={{ width: `${95 - i * 13}%` }} /></span></div>) : <p className="empty-music-data">Spotify did not return top artists for this account yet.</p>) : ["Joji", "The Weeknd", "Lana Del Rey", "Frank Ocean", "Radiohead"].map((artist, i) => <div className="rank-row" key={artist}><span className="rank-number">0{i + 1}</span><img src={photo(artwork[i % artwork.length], 100)} alt="" /><strong>{artist}</strong><span className="rank-bars"><i style={{ width: `${95 - i * 13}%` }} /></span></div>)}
                </div>
                <div className="panel">
                  <div className="panel-heading"><h3>On repeat</h3><span className="muted small">{spotifyConnected ? "RECENTLY PLAYED" : "DEMO DATA"}</span></div>
                  {spotifyConnected ? (recentlyPlayed.length > 0 ? recentlyPlayed.map((track) => <div className="mini-track" key={track.id}>{track.imageUrl ? <img src={track.imageUrl} alt="" /> : <span className="artwork-placeholder">♫</span>}<div><strong>{track.name}</strong><span>{track.artists}</span></div><span className="track-note">♫</span></div>) : <p className="empty-music-data">Spotify has no recently played tracks available for this account.</p>) : ["Slow Dancing in the Dark", "After Hours", "No Surprises", "Pink + White"].map((track, i) => <div className="mini-track" key={track}><img src={photo(artwork[i % artwork.length], 100)} alt="" /><div><strong>{track}</strong><span>{["Joji", "The Weeknd", "Radiohead", "Frank Ocean"][i]}</span></div><span className="track-note">♫</span></div>)}
                </div>
                <div className="panel">
                  <div className="panel-heading"><h3>Your genres</h3></div>
                  <div className="genre-cloud">{["Alternative R&B", "Indie", "Dream pop", "Alternative", "Soul", "Lo-fi", "Ambient"].map(g => <span className="genre-tag" key={g}>{g}</span>)}</div>
                </div>
              </div>
            </section>
          )}

          {page === "settings" && (
            <section className="settings-page">
              <div className="page-heading"><div><div className="eyebrow">MAKE IT YOURS</div><h1>Your <span className="gradient-text">space.</span></h1><p className="subtitle">Manage how you discover and connect.</p></div></div>
              <div className="panel settings-panel">
                <div className="settings-section"><h3>Discovery</h3><p>Control who you see and who can find you.</p>
                  <div className="setting-row"><div><strong>Visible to nearby users</strong><span>Let people in your area discover your profile.</span></div><button className={`toggle ${visible ? "on" : ""}`} onClick={() => setVisible(!visible)} aria-label="Toggle discovery visibility"><span /></button></div>
                  <div className="setting-row radius-setting"><div><strong>Discovery radius</strong><span>Choose how far you want to discover.</span></div><div className="settings-radius-control"><label htmlFor="settings-radius">{radius} km</label><input id="settings-radius" className="distance-slider" type="range" min={1} max={25} step={1} value={radius} onChange={e => updateRadius(Number(e.target.value))} /></div></div>
                </div>
                <div className="settings-section"><h3>Appearance</h3><p>Set the mood for your music space.</p>
                  <div className="setting-row"><div><strong>Dark appearance</strong><span>Easy on the eyes, day or night.</span></div><button className={`toggle ${dark ? "on" : ""}`} onClick={() => setDark(!dark)} aria-label="Toggle dark theme"><span /></button></div>
                </div>
                <div className="settings-section"><h3>Music account</h3><p>Your music provider connection.</p>
                  <div className="setting-row"><div className="provider-icon">♫</div><div className="setting-description"><strong>Spotify</strong><span>{spotify.status === "checking" ? "Checking your saved Spotify session..." : spotifyConnected ? `Connected as ${spotifyDisplayName}` : "Not connected · Demo mode remains active"}</span>{spotify.error && <p className="spotify-error" role="alert">{spotify.error}</p>}</div>{spotifyConnected ? <button className="button-secondary spotify-action" onClick={spotify.disconnect}>Disconnect</button> : <button className="button-primary spotify-action" onClick={spotify.connect} disabled={spotify.status === "checking"}>{spotify.status === "error" ? "Try again" : spotify.status === "checking" ? "Connecting..." : "Connect Spotify"}</button>}</div>
                </div>
                <div className="settings-section"><h3>Privacy</h3><p>Demo controls for the future production app.</p>
                  <div className="setting-row"><div><strong>Location privacy</strong><span>Other users should only see approximate distance.</span></div><span className="privacy-enabled">Enabled by design</span></div>
                  <div className="setting-row"><div><strong>Account and data</strong><span>Account deletion and data export will be implemented with the backend.</span></div><span className="coming-soon">NOT CONNECTED</span></div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      <nav className="mobile-nav">
        {navItems.map(item => <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => { setPage(item.id); setChatPerson(null); }}><Icon>{item.icon}</Icon><span>{item.label}</span></button>)}
      </nav>

      {selected && page === "discover" && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="profile-modal panel" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            <img className="modal-photo" src={photo(selected.image, 700)} alt="" />
            <div className="modal-body"><span className="match-pill">{selected.match}% music match</span><h2>{selected.name}, {selected.age}</h2><p>{selected.bio}</p><h4>Top artists</h4><div className="genre-cloud">{selected.artists.map(a => <span className="genre-tag" key={a}>{a}</span>)}</div><h4>Favorite genres</h4><div className="genre-cloud">{selected.genres.map(g => <span className="genre-tag" key={g}>{g}</span>)}</div><button className="button-primary full-button" onClick={() => { setIndex(people.findIndex(p => p.id === selected.id)); setSelected(null); }}>View in Discover</button></div>
          </div>
        </div>
      )}

      {matchPopup && (
        <div className="modal-backdrop" onClick={() => setMatchPopup(null)}>
          <div className="match-modal panel" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setMatchPopup(null)}>×</button>
            <div className="match-sparkle">✳ ♫ ✳</div>
            <div className="match-avatars"><div className="match-you">A</div><img src={photo(matchPopup.image, 200)} alt="" /></div>
            <div className="eyebrow">THE FEELING IS MUTUAL</div>
            <h2>It's a <span className="gradient-text">match.</span></h2>
            <p>You and {matchPopup.name} share a frequency.</p>
            <div className="match-score-large">{matchPopup.match}% <span>music compatibility</span></div>
            <div className="genre-cloud">{matchPopup.artists.slice(0, 2).map(a => <span className="genre-tag" key={a}>{a}</span>)}</div>
            <button className="button-primary full-button" onClick={() => openChat(matchPopup)}>Say hello <span>→</span></button>
            <button className="button-quiet full-button" onClick={() => setMatchPopup(null)}>Keep discovering</button>
          </div>
        </div>
      )}
    </div>
  );
}
