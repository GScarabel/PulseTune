import React, { useState, useRef, useEffect } from "react";
import { Layout, Input, message, Button, Tooltip, Avatar } from "antd";
import {
  FastBackwardOutlined,
  FastForwardOutlined,
  PauseOutlined,
  CaretRightOutlined,
  CodeOutlined,
  UserOutlined,
  CustomerServiceOutlined,
} from "@ant-design/icons";

import AlbumView from "./components/AlbumView";
import AlbumPage from "./components/AlbumPage";
import AdminPanel from "./components/AdminPanel";

import { db } from "./services/firebase";
import { collection, getDocs } from "firebase/firestore";

import "./App.css";

const { Header, Content } = Layout;

const App = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [allMusicas, setAllMusicas] = useState([]);
  const [favoritas, setFavoritas] = useState([]);
  const [listaFiltrada, setListaFiltrada] = useState([]);

  const [currentIndex, setCurrentIndex] = useState(null);
  const [busca, setBusca] = useState("");

  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;

    const handleScroll = () => {
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (lastScrollTop - currentScrollTop > 150 && currentScrollTop <= 50) {
        window.location.reload();
      }

      lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const carregarMusicasDeColecao = async (colecao) => {
    try {
      const albumsSnapshot = await getDocs(collection(db, colecao));
      let todas = [];

      for (const albumDoc of albumsSnapshot.docs) {
        const albumId = albumDoc.id;
        const musicasRef = collection(
          db,
          `${colecao}/${albumId}/${colecao === "albums" ? "media" : "musicas"}`
        );
        const musicasSnapshot = await getDocs(musicasRef);

        const musicasAlbum = musicasSnapshot.docs.map((doc) => ({
          id: doc.id,
          albumId,
          albumType: colecao,
          ...doc.data(),
        }));

        todas.push(...musicasAlbum);
      }

      return todas;
    } catch (error) {
      message.error(`Erro ao carregar músicas da coleção ${colecao}.`);
      return [];
    }
  };

  const carregarTodasMusicas = async () => {
    const musicasAlbums = await carregarMusicasDeColecao("albums");
    const musicasAlbunsCustomizados = await carregarMusicasDeColecao("albunsCustomizados");
    const todasMusicas = [...musicasAlbums, ...musicasAlbunsCustomizados];

    setAllMusicas(todasMusicas);
  };

  useEffect(() => {
    carregarTodasMusicas();
    // eslint-disable-next-line 
  }, []);

  useEffect(() => {
    const favs = allMusicas.filter((m) => m.favorito === true);
    setFavoritas(favs);
  }, [allMusicas]);

  useEffect(() => {
    if (busca.trim() === "") {
      setListaFiltrada(favoritas);
    } else {
      const termo = busca.toLowerCase();

      const musicasAlbums = allMusicas.filter(m => m.albumType === "albums");

      const filtradas = musicasAlbums.filter(
        (m) =>
          (m.nome && m.nome.toLowerCase().includes(termo)) ||
          (m.artista && m.artista.toLowerCase().includes(termo))
      );

      setListaFiltrada(filtradas);
    }
  }, [busca, favoritas, allMusicas]);

  useEffect(() => {
    if (currentIndex !== null && allMusicas[currentIndex]?.audio && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();

      const playAudio = async () => {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.warn("Erro ao tocar áudio:", error);
          setIsPlaying(false);
        }
      };

      playAudio();
      setProgress(0);
      setDuration(0);
    }
    // eslint-disable-next-line 
  }, [currentIndex]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {
        setIsPlaying(false);
        message.error("Erro ao tocar a música.");
      });
    }
  };

  const nextMusic = () => {
    if (allMusicas.length === 0) return;
    setCurrentIndex((prev) => (prev === null ? 0 : (prev + 1) % allMusicas.length));
  };

  const prevMusic = () => {
    if (allMusicas.length === 0) return;
    setCurrentIndex((prev) =>
      prev === null ? allMusicas.length - 1 : (prev - 1 + allMusicas.length) % allMusicas.length
    );
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const onSeek = (e) => {
    const value = e.target.value;
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setProgress(value);
    }
  };

  const onPlayClick = (musica) => {
    if (!musica.audio) {
      message.warning("Esta música não possui áudio disponível.");
      return;
    }

    const index = allMusicas.findIndex(
      (m) =>
        m.id === musica.id &&
        m.albumId === musica.albumId &&
        m.albumType === musica.albumType
    );
    if (index !== -1) setCurrentIndex(index);
  };

  return (
    <Layout>
      <Header className="app-header">
        <div className="header-content">
          <div
            className={isPlaying ? "jump" : ""}
            style={{
              animationDelay: `0s`,
              animationDuration: "0.8s",
              animationIterationCount: "infinite",
              animationName: isPlaying ? "jump" : "none",
              display: "flex",
              alignItems: "center",
            }}
          >
            <img
              src="/favicon.ico"
              alt="Logo"
              style={{
                marginTop: 15,
                width: 40,
                height: 40,
              }}
            />
          </div>

          <Tooltip title={isAdmin ? "Voltar para Músicas" : "Ir para Admin"}>
            {isAdmin ? (
              <CustomerServiceOutlined
                style={{ marginTop: 10 }}
                className="menu-toggle-icon"
                onClick={() => setIsAdmin(false)}
              />
            ) : (
              <UserOutlined
                style={{ marginTop: 10 }}
                className="menu-toggle-icon"
                onClick={() => setIsAdmin(true)}
              />
            )}
          </Tooltip>
        </div>
      </Header>

      <Content style={{ padding: 24 }}>
        {isAdmin ? (
          <AdminPanel />
        ) : (
          <>
            <Input
              placeholder="Buscar música ou artista"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              allowClear
              style={{ marginBottom: 16 }}
            />

            {busca.trim() !== "" ? (
              <AlbumView
                albums={listaFiltrada}
                setCurrentIndex={setCurrentIndex}
                currentIndex={currentIndex}
                onPlayClick={onPlayClick}
              />
            ) : (
              <AlbumPage
                onPlayClick={onPlayClick}
                currentIndex={currentIndex}
                allMusicas={allMusicas}
              />
            )}
          </>
        )}
      </Content>

      {currentIndex !== null && allMusicas[currentIndex]?.audio && (
        <>
          <audio
            ref={audioRef}
            src={allMusicas[currentIndex].audio}
            onTimeUpdate={onTimeUpdate}
            onEnded={nextMusic}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            style={{ display: "none" }}
            preload="metadata"
          />

          <div className="footer-player">
            <div className="now-playing">
              <div className="avatar-wrapper">
                {isPlaying && <div className="avatar-border" />}
                <Avatar
                  size={64}
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#000",
                    verticalAlign: "middle",
                    fontSize: 24,
                    zIndex: 2,
                    position: "relative",
                  }}
                >
                  {allMusicas[currentIndex]?.artista?.charAt(0).toUpperCase() || "?"}
                </Avatar>
              </div>
              <div className="now-playing-info">
                <h3>{allMusicas[currentIndex].nome}</h3>
                <div style={{ marginBottom: 5 }}>
                  <small>{allMusicas[currentIndex].artista}</small>
                </div>
                <input

                  type="range"
                  min="0"
                  max={duration ? duration.toFixed(2) : 0}
                  value={progress}
                  step="0.01"
                  onChange={onSeek}
                  className="progress-bar"
                />
                <div className="player-controls">
                  <Button shape="circle" icon={<FastBackwardOutlined />} onClick={prevMusic} />
                  <Button
                    shape="circle"
                    icon={isPlaying ? <PauseOutlined /> : <CaretRightOutlined />}
                    onClick={togglePlayPause}
                  />
                  <Button shape="circle" icon={<FastForwardOutlined />} onClick={nextMusic} />
                </div>
                <div className="player-footer-signature">
                  <CodeOutlined style={{ marginRight: 8 }} /> Gabriel Scarabel
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default App;