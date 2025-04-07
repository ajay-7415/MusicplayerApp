import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ColorThief from "colorthief";
import "./index.css";
import './responsive.css'

const songsData = [
  {
    id: 0,
    title: "Lost in Echoes",
    artistName: "Aurora Lane",
    thumbnail: "https://picsum.photos/id/237/300/300",
    musicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: "3:45",
  },
  {
    id: 1,
    title: "Neon Skyline",
    artistName: "SkyRider",
    thumbnail: "https://picsum.photos/id/1025/300/300",
    musicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: "4:05",
  },
];

const MusicPlayer = ({ view }) => {
  const [currentSongId, setCurrentSongId] = useState(songsData[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bgColor, setBgColor] = useState("#121212");
  const [favorites, setFavorites] = useState([]);
  const [recent, setRecent] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const audioRef = useRef(null);
  const coverImgRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const getFilteredSongs = () => {
    let list = songsData;
    if (view === "favorites") {
      list = songsData.filter((song) => favorites.includes(song.id));
    } else if (view === "recent") {
      list = recent.map((id) => songsData.find((song) => song.id === id)).filter(Boolean);
    }
    return list.filter((song) =>
      song.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredSongs = getFilteredSongs();
  const currentSong = songsData.find((s) => s.id === currentSongId);

  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
    const recs = JSON.parse(sessionStorage.getItem("recent") || "[]");
    setFavorites(favs);
    setRecent(recs);
  }, []);

useEffect(() => {
  if (audioRef.current) {
    audioRef.current.load();
    if (isPlaying) {
      audioRef.current
        .play()
        .catch((err) => console.error("Playback error:", err));
    }
  }
}, [currentSongId]);


  useEffect(() => {
    const channel = new BroadcastChannel("music-player");
    channel.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === "PLAY") {
        setCurrentSongId(payload);
        setIsPlaying(true);
      }
    };
    return () => channel.close();
  }, []);

  useEffect(() => {
    setProgress(0);
  }, [currentSongId]);

  const updateBackgroundColor = () => {
    if (coverImgRef.current && coverImgRef.current.complete) {
      try {
        const colorThief = new ColorThief();
        const color = colorThief.getColor(coverImgRef.current);
        console.log(bgColor,'bgcolor');
        
        // setBgColor(
        //   `linear-gradient(to bottom right, rgb(${color[0]},${color[1]},${color[2]}), #121212)`
        // );
        setBgColor(`rgb(${color[0]}, ${color[1]}, ${color[2]})`);

      } catch (e) {
        console.error("Color extraction failed:", e);
      }
    }
  };
  useEffect(() => {
  const img = coverImgRef.current;
  if (!img) return;

  const handleLoad = () => {
    updateBackgroundColor();
  };

  img.addEventListener("load", handleLoad);

  // If image is already cached and complete, trigger it manually
  if (img.complete) {
    updateBackgroundColor();
  }

  return () => {
    img.removeEventListener("load", handleLoad);
  };
}, [currentSongId]);

  const toggleFavorite = (id) => {
    let newFavs = [...favorites];
    if (newFavs.includes(id)) {
      newFavs = newFavs.filter((i) => i !== id);
    } else {
      newFavs.push(id);
    }
    setFavorites(newFavs);
    localStorage.setItem("favorites", JSON.stringify(newFavs));
  };

  const playSong = (id) => {
   console.log(id,'id');
   
    const song = songsData.find((s) => s.id === id);
    if (!song) return;
    setCurrentSongId(id);
    setIsPlaying(true);
    const updatedRecent = [id, ...recent.filter((i) => i !== id)].slice(0, 10)
    setRecent(updatedRecent);
    sessionStorage.setItem("recent", JSON.stringify(updatedRecent));

    const bc = new BroadcastChannel("music-player");
    bc.postMessage({ type: "PLAY", payload: id });
    bc.close();
  };

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(console.error);
    }
  }, [currentSongId]);

  const togglePlayPause = () => {
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const nextSong = () => {
    const visibleIndexes = filteredSongs.map((s) => s.id);
    const currPos = visibleIndexes.indexOf(currentSongId);
    const nextId = visibleIndexes[(currPos + 1) % visibleIndexes.length];
    setCurrentSongId(nextId);
  };

  const prevSong = () => {
    const visibleIndexes = filteredSongs.map((s) => s.id);
    const currPos = visibleIndexes.indexOf(currentSongId);
    const prevId = visibleIndexes[(currPos - 1 + visibleIndexes.length) % visibleIndexes.length];
    setCurrentSongId(prevId);
  };

  const handleTimeUpdate = () => {
    const percent =
      (audioRef.current.currentTime / audioRef.current.duration) * 100;
    setProgress(percent);
  };

  return (
  <>
    <div
      className="background-blur"
      style={{ backgroundImage: `url(${currentSong.thumbnail})` }}
    ></div>
    <div className="background-overlay" style={{ background: bgColor }}></div>

    <div className="app">
      <div className="container">
        <aside className="sidebar">
          <h2>Spotify</h2>
          <nav>
            <ul>
              <li
                className={view === "foryou" ? "active" : ""}
                onClick={() => navigate("/foryou")}
              >
                For You
              </li>
              <li
                className={view === "favorites" ? "active" : ""}
                onClick={() => navigate("/favorites")}
              >
                Favourites
              </li>
              <li
                className={view === "recent" ? "active" : ""}
                onClick={() => navigate("/recent")}
              >
                Recently Played
              </li>
            </ul>
          </nav>
        </aside>

        <main className="content">
          <div className="main-section">
            <header>
              <h2>
                {view === "favorites"
                  ? "Favourites"
                  : view === "recent"
                  ? "Recently Played"
                  : "For You"}
              </h2>
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search Song, Artist"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </header>

            <ul className="song-list">
              {filteredSongs.map((song) => (
                <div onClick={() => playSong(song.id)} key={song.id}>
                  <li
                    className={`song ${
                      song.id === currentSongId ? "active" : ""
                    }`}
                  >
                    <img
                      src={song.thumbnail}
                      alt={song.title}
                      crossOrigin="anonymous"
                    />
                    <div className="song-info">
                      <h3>{song.title}</h3>
                      <p>{song.artistName}</p>
                    </div>
                    <div className="song-actions">
                      <span>{song.duration}</span>
                      <button onClick={() => toggleFavorite(song.id)}>
                        {favorites.includes(song.id) ? "❤️" : "🤍"}
                      </button>
                    </div>
                  </li>
                </div>
              ))}
            </ul>
          </div>

          <aside className="now-playing-side">
            <div className="now-playing-art">
              <img
                ref={coverImgRef}
                src={currentSong.thumbnail}
                alt="Now Playing Cover"
                crossOrigin="anonymous"
              />
            </div>
            <h3>Now Playing</h3>
            <p>
              <strong>{currentSong.title}</strong> - {currentSong.artistName}
            </p>
            <div className="now-playing">
              <img src={currentSong.thumbnail} alt="Mini" crossOrigin="anonymous" />
              <div>
                <h3>{currentSong.title}</h3>
                <p>{currentSong.artistName}</p>
              </div>
            </div>
            <div className="controls">
              <button onClick={prevSong}>⏮</button>
              <button onClick={togglePlayPause}>{isPlaying ? "⏸" : "▶"}</button>
              <button onClick={nextSong}>⏭</button>
            </div>
            <div className="volume">
              <button
                onClick={() => (audioRef.current.muted = !audioRef.current.muted)}
              >
                🔊
              </button>
            </div>
            <div className="progress-bar">
              <div className="progress" style={{ width: `${progress}%` }}></div>
            </div>
          </aside>
        </main>
      </div>

      <audio
        ref={audioRef}
        src={currentSong.musicUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={nextSong}
      />
    </div>
  </>
);

  

};

export default MusicPlayer;
