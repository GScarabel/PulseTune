import React, { useState, useEffect } from "react";
import {
  Input,
  Button,
  message,
  Table,
  Popconfirm,
  Divider,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import {
  db,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from "../services/firebase";
import YouTubeSearchRedirect from "./YouTubeSearchRedirect";

const AdminPanel = () => {
  const [artistName, setArtistName] = useState("");
  const [songName, setSongName] = useState("");
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [search, setSearch] = useState("");

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchAllSongs();
  }, []);

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredSongs(songs);
    } else {
      const term = search.toLowerCase();
      const filtered = songs.filter(
        (song) =>
          song.nome.toLowerCase().includes(term) ||
          song.artista.toLowerCase().includes(term)
      );
      setFilteredSongs(filtered);
    }
  }, [search, songs]);

  const fetchAllSongs = async () => {
    const albumsSnapshot = await getDocs(collection(db, "albums"));
    let all = [];

    for (const albumDoc of albumsSnapshot.docs) {
      const albumId = albumDoc.id;
      const mediaSnapshot = await getDocs(
        collection(db, `albums/${albumId}/media`)
      );

      mediaSnapshot.forEach((docSnap) => {
        all.push({ ...docSnap.data(), id: docSnap.id, albumId });
      });
    }

    setSongs(all);
    setFilteredSongs(all);
  };

  const handleDelete = async (record) => {
    try {
      await deleteDoc(doc(db, `albums/${record.albumId}/media/${record.id}`));
      message.success("Música deletada com sucesso");
      fetchAllSongs();
    } catch (error) {
      console.error(error);
      message.error("Erro ao deletar");
    }
  };


  const handleYouTubeDownload = async () => {
    if (!youtubeUrl) return message.warning("Cole uma URL do YouTube");
    if (!artistName || !songName)
      return message.warning("Preencha o nome do cantor e da música");

    setIsDownloading(true);

    try {
      const response = await fetch("", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      if (!response.ok)
        throw new Error(`Erro no servidor: ${response.statusText}`);

      const data = await response.json();

      if (!data.url || !/^https?:\/\//.test(data.url)) {
        return message.error("URL inválida recebida do servidor.");
      }

      await saveSongToFirestore(data.url);

      message.success("Música do YouTube salva com sucesso!");
      setYoutubeUrl("");
      setArtistName("");
      setSongName("");
      fetchAllSongs();
    } catch (err) {
      console.error("Erro no download/upload:", err);
      message.error("Erro no download/upload: " + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  async function saveSongToFirestore(audioUrl) {
    const albumQuery = query(collection(db, "albums"), where("artista", "==", artistName));
    const albumSnapshot = await getDocs(albumQuery);

    let albumId;
    if (!albumSnapshot.empty) {
      albumId = albumSnapshot.docs[0].id;
    } else {
      const newAlbumRef = await addDoc(collection(db, "albums"), {
        artista: artistName,
        createdAt: new Date(),
      });
      albumId = newAlbumRef.id;
    }

    await addDoc(collection(db, `albums/${albumId}/media`), {
      nome: songName,
      artista: artistName,
      audio: audioUrl,
      image: "",
      createdAt: new Date(),
    });
  }

  const columns = [
    {
      title: "Nome",
      dataIndex: "nome",
      key: "nome",
      align: "center",
    },
    {
      title: "Artista",
      dataIndex: "artista",
      key: "artista",
      align: "center",
    },
    {
      title: "Ações",
      key: "acoes",
      align: "center",
      render: (_, record) => (
        <Popconfirm
          title="Tem certeza que deseja deletar?"
          onConfirm={() => handleDelete(record)}
        >
          <Button type="primary" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <YouTubeSearchRedirect />

      <Input
        placeholder="Nome do cantor"
        value={artistName}
        onChange={(e) => setArtistName(e.target.value)}
        style={{ marginBottom: 10, marginTop: -10 }}
      />
      <Input
        placeholder="Nome da música"
        value={songName}
        onChange={(e) => setSongName(e.target.value)}
        style={{ marginBottom: 10 }}
      />

      <Input
        placeholder="Cole a URL do YouTube aqui"
        value={youtubeUrl}
        onChange={(e) => setYoutubeUrl(e.target.value)}
        style={{ marginBottom: 10 }}
      />

      <Button
        type="primary"
        loading={isDownloading}
        onClick={handleYouTubeDownload}
        style={{ marginBottom: 10 }}
      >
        Fazer Upload
      </Button>

      <Divider />

      <Input.Search
        placeholder="Buscar música ou artista"
        allowClear
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 10 }}
      />

      <div style={{ overflowX: "auto", marginBottom: 150 }}>
        <Table
          columns={columns}
          dataSource={filteredSongs}
          rowKey={(record) => `${record.albumId}-${record.id}`}
          pagination={{ pageSize: 3 }}
        />
      </div>
    </div>
  );
};

export default AdminPanel;