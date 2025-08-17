import React, { useEffect, useRef, useState } from "react";
import { Card, Empty, Button, Modal, Input, Select, message, Avatar } from "antd";
import { motion } from "framer-motion";
import { PlusOutlined } from "@ant-design/icons";

import {
  db,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
} from "../services/firebase";

import "./AlbumView.css";

const { Option } = Select;

const AlbumView = ({
  albums,
  currentIndex,
  setCurrentIndex,
  toggleFavorito,
  onPlayClick,
}) => {
  const cardRefs = useRef([]);

  const [showModal, setShowModal] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState(null);

  const [albumSelecionado, setAlbumSelecionado] = useState(null);
  const [novoAlbum, setNovoAlbum] = useState("");

  const [listaAlbunsDisponiveis, setListaAlbunsDisponiveis] = useState([]);

  useEffect(() => {
    if (showModal) {
      async function fetchAlbuns() {
        try {
          const albunsRef = collection(db, "albunsCustomizados");
          const snapshot = await getDocs(albunsRef);
          const albuns = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setListaAlbunsDisponiveis(albuns);
        } catch (error) {
          message.error("Erro ao carregar álbuns.");
        }
      }
      fetchAlbuns();
    }
  }, [showModal]);

  useEffect(() => {
    if (currentIndex !== null && cardRefs.current[currentIndex]) {
      cardRefs.current[currentIndex].scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [currentIndex]);

  async function adicionarMusicaAoAlbum(musica, nomeAlbum) {
    try {
      const albunsRef = collection(db, "albunsCustomizados");
      const q = query(albunsRef, where("nome", "==", nomeAlbum));
      const querySnapshot = await getDocs(q);

      let albumId;

      if (querySnapshot.empty) {
        const novoAlbumRef = await addDoc(albunsRef, {
          nome: nomeAlbum,
          createdAt: Timestamp.now(),
        });
        albumId = novoAlbumRef.id;

        setListaAlbunsDisponiveis((prev) => [
          ...prev,
          { id: albumId, nome: nomeAlbum },
        ]);
      } else {
        albumId = querySnapshot.docs[0].id;
      }

      const musicasRef = collection(db, "albunsCustomizados", albumId, "musicas");

      await addDoc(musicasRef, {
        nome: musica.nome || musica.name || "Sem nome",
        artista: musica.artista || "",
        image: musica.image || musica.image || "",
        audio: musica.audio || musica.linkAudio || "",
        criadoEm: Timestamp.now(),
      });

      message.success(`Música adicionada a playlist "${nomeAlbum}" com sucesso!`);
    } catch (error) {
      console.error("Erro ao adicionar música a playlist:", error);
      message.error("Erro ao salvar música no playlist.");
    }
  }

  const renderCards = (data) =>
    data.length === 0 ? (
      <Card>
      <Empty description="Nenhuma música encontrada" />
      </Card>
    ) : (
      data.map((item, index) => (
        <Card style={{marginLeft: 20,}}>
        <motion.div
          key={item.id}
          ref={(el) => (cardRefs.current[index] = el)}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.05 }}
          className="album-motion-card"
        >
          <Card
            style={{ marginLeft: 0, marginRight: 0, position: "relative", marginTop: 0, height: "100%" }}
            hoverable
            className={`album-card ${
              currentIndex !== null && albums[currentIndex]?.id === item.id ? "active" : ""
            }`}
          >
            <div style={{ cursor: "pointer" }} onClick={() => onPlayClick(item)}>
             <Avatar
    size={130}
    style={{
      backgroundColor: "#ffffffff",
      color: "#000",
      fontSize: 28,
    }}
  >
    {(item.artista || item.nome || item.name)?.charAt(0).toUpperCase() || "?"}
  </Avatar>
              <div style={{ padding: "10px", textAlign: "center" }}>
                <div style={{ marginBottom: 8 }}>
                  {item.nome || item.name}
                  <br />
                  <small style={{ fontSize: 12, color: "#888" }}>{item.artista || ""}</small>
                </div>
              </div>
            </div>
<Button
  type="text"
  onClick={(e) => {
    e.stopPropagation();
    setSelectedMusic(item);
    setShowModal(true);
  }}
  className="album-favorite-button"
  icon={<PlusOutlined />}
  aria-label="Adicionar a Playlist"
/>
          </Card>
        </motion.div>
        </Card>
      ))
    );

  return (
    <div className="album-container">
   <div className="album-carousel">{renderCards(albums)}</div>

      <Modal
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={async () => {
          if (!albumSelecionado && !novoAlbum) {
            message.warning("Escolha uma playlist ou crie uma.");
            return;
          }

          const nomeDoAlbum = albumSelecionado || novoAlbum;

          await adicionarMusicaAoAlbum(selectedMusic, nomeDoAlbum);

          setShowModal(false);
          setAlbumSelecionado(null);
          setNovoAlbum("");
        }}
      >
        <p>Escolha uma playlist existente:</p>
        <Select
          style={{ width: "100%" }}
          placeholder="Selecione uma playlist"
          onChange={(value) => {
            setAlbumSelecionado(value);
            setNovoAlbum("");
          }}
          value={albumSelecionado || undefined}
          allowClear
        >
          {listaAlbunsDisponiveis.map((album) => (
            <Option key={album.id} value={album.nome}>
              {album.nome}
            </Option>
          ))}
        </Select>

        <p style={{ marginTop: 20 }}>Ou crie uma nova playlist:</p>
        <Input
          placeholder="Nome da nova playlist"
          value={novoAlbum}
          onChange={(e) => {
            setNovoAlbum(e.target.value);
            setAlbumSelecionado(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default AlbumView;