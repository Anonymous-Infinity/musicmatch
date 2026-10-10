
import { useState } from "react";
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

export default function App() {
  const [page, setPage] = useState<Page>("discover");
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState<number[]>([]);
  const [passed, setPassed] = useState<number[]>([]);
  const [matches, setMatches] = useState<number[]>([3]);
  const [selected, setSelected] = useState<Person | null>(null);
  const [matchPopup, setMatchPopup] = useState<Person | null>(null);
  const [chatPerson, setChatPerson] = useState<Person | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Record<number, string[]>>({});
  const [name, setName] = useState("Alex Morgan");
  const [bio, setBio] = useState("Finding my people, one song at a time.");
  const [radius, setRadius] = useState(10);
  const [visible, setVisible] = useState(true);
  const [dark, setDark] = useState(true);
  const [query, setQuery] = useState("");

  const current = people[index];
  const connectedPeople = people.filter((p) => matches.includes(p.id));

  function swipe(direction: "like" | "pass") {
    if (!current) return;

    if (direction === "like") {
      setLiked((old) => [...old, current.id]);

      if (current.likedYou || matches.includes(current.id)) {
        setMatches((old) => old.includes(current.id) ? old : [...old, current.id]);
        setMatchPopup(current);
      }
    } else {
      setPassed((old) => [...old, current.id]);
    }

    setSelected(null);
    setIndex((old) => old + 1);
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
              <span>Demo mode</span>
            </div>
            <span className="spotify-symbol">♫</span>
          </div>
          <button className="nav-item" onClick={() => setPage("settings")}>
            <Icon>⚙</Icon>
            <span>Settings</span>
          </button>
          <div className="sidebar-user">
            <div className="avatar avatar-self">A</div>
            <div className="user-label">
              <strong>{name}</strong>
              <span>Free account</span>
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
                <div className="radius-chip"><Icon>◎</Icon> Within {radius} km</div>
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
                      <div><strong>{matches.length}</strong><span>Matches</span></div>
                      <div><strong>{people.length - index}</strong><span>To discover</span></div>
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
                <div><div className="eyebrow">YOUR LOCAL SCENE</div><h1>People in your <span className="gradient-text">orbit.</span></h1><p className="subtitle">Find your sound, closer to home.</p></div>
                <label className="radius-select">Radius
                  <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                    <option value={2}>2 km</option><option value={5}>5 km</option><option value={10}>10 km</option><option value={25}>25 km</option>
                  </select>
                </label>
              </div>
              <div className="map-layout">
                <div className="map-canvas">
                  <div className="map-grid" />
                  <div className="map-road road-a" /><div className="map-road road-b" /><div className="map-road road-c" /><div className="map-road road-d" />
                  <div className="map-water" />
                  <div className="map-label label-a">INDIRANAGAR</div><div className="map-label label-b">ULSOOR LAKE</div><div className="map-label label-c">MG ROAD</div><div className="map-label label-d">YOUR AREA</div>
                  <div className="you-marker"><span /><div>YOU</div></div>
                  {people.map((person, i) => (
                    <button
                      key={person.id}
                      className={`map-marker marker-${i} ${selected?.id === person.id ? "selected" : ""}`}
                      onClick={() => setSelected(person)}
                      aria-label={`View ${person.name}`}
                    >
                      <img src={photo(person.image, 100)} alt="" />
                      <span>{person.match}%</span>
                    </button>
                  ))}
                  <div className="map-legend"><span className="status-dot" /> People discovering nearby</div>
                </div>
                <div className="nearby-panel panel">
                  <div className="panel-heading"><div><h3>In your orbit</h3><p className="small muted">{people.length} people in this demo</p></div><span className="live-badge">LIVE</span></div>
                  <div className="search-box"><Icon>⌕</Icon><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people..." /></div>
                  {people.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).map((person) => (
                    <button className={`nearby-person ${selected?.id === person.id ? "selected" : ""}`} key={person.id} onClick={() => setSelected(person)}>
                      <img src={photo(person.image, 100)} alt="" />
                      <div className="nearby-info"><strong>{person.name}, {person.age}</strong><span>{person.distance} km away</span><span className="small accent-text">{person.artists.slice(0, 2).join(" · ")}</span></div>
                      <span className="nearby-score">{person.match}%</span>
                    </button>
                  ))}
                  {selected && (
                    <div className="selected-person">
                      <p className="eyebrow">SELECTED PROFILE</p><strong>{selected.name} is a {selected.match}% match</strong>
                      <p className="small muted">{selected.bio}</p>
                      <button className="button-primary full-button" onClick={() => { setPage("discover"); setIndex(people.findIndex(p => p.id === selected.id)); setSelected(null); }}>View in Discover</button>
                    </div>
                  )}
                  <p className="privacy-note">◎ Locations are illustrative. Exact coordinates are never shown.</p>
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
              <div className="page-heading"><div><div className="eyebrow">YOUR MUSICAL IDENTITY</div><h1>Your world, in <span className="gradient-text">sound.</span></h1><p className="subtitle">A little about you, a lot about what you love.</p></div><button className="button-secondary" onClick={() => { const n = prompt("Display name", name); if (n?.trim()) setName(n.trim()); const b = prompt("Your bio", bio); if (b !== null) setBio(b); }}>✎ Edit profile</button></div>
              <div className="profile-layout">
                <div className="panel profile-hero">
                  <div className="profile-cover" />
                  <div className="profile-identity"><div className="profile-avatar">A</div><div className="profile-name"><h2>{name}</h2><span>@musiclover · Bengaluru</span></div><span className="profile-complete">PROFILE PREVIEW</span></div>
                  <p className="profile-bio">{bio}</p>
                  <div className="profile-stats"><div><strong>12</strong><span>Top artists</span></div><div><strong>38</strong><span>Top tracks</span></div><div><strong>{matches.length}</strong><span>Connections</span></div></div>
                </div>
                <div className="panel">
                  <div className="panel-heading"><h3>Your top artists</h3><span className="muted small">DEMO DATA</span></div>
                  {["Joji", "The Weeknd", "Lana Del Rey", "Frank Ocean", "Radiohead"].map((artist, i) => <div className="rank-row" key={artist}><span className="rank-number">0{i + 1}</span><img src={photo(artwork[i % artwork.length], 100)} alt="" /><strong>{artist}</strong><span className="rank-bars"><i style={{ width: `${95 - i * 13}%` }} /></span></div>)}
                </div>
                <div className="panel">
                  <div className="panel-heading"><h3>On repeat</h3><span className="muted small">TOP TRACKS</span></div>
                  {["Slow Dancing in the Dark", "After Hours", "No Surprises", "Pink + White"].map((track, i) => <div className="mini-track" key={track}><img src={photo(artwork[i % artwork.length], 100)} alt="" /><div><strong>{track}</strong><span>{["Joji", "The Weeknd", "Radiohead", "Frank Ocean"][i]}</span></div><span className="track-note">♫</span></div>)}
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
                  <div className="setting-row"><div><strong>Discovery radius</strong><span>Choose how far you want to discover.</span></div><select value={radius} onChange={e => setRadius(Number(e.target.value))}><option value={2}>2 km</option><option value={5}>5 km</option><option value={10}>10 km</option><option value={25}>25 km</option></select></div>
                </div>
                <div className="settings-section"><h3>Appearance</h3><p>Set the mood for your music space.</p>
                  <div className="setting-row"><div><strong>Dark appearance</strong><span>Easy on the eyes, day or night.</span></div><button className={`toggle ${dark ? "on" : ""}`} onClick={() => setDark(!dark)} aria-label="Toggle dark theme"><span /></button></div>
                </div>
                <div className="settings-section"><h3>Music account</h3><p>Your music provider connection.</p>
                  <div className="setting-row"><div className="provider-icon">♫</div><div className="setting-description"><strong>Spotify</strong><span>Not connected · Demo mode</span></div><span className="coming-soon">INTEGRATION LATER</span></div>
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
