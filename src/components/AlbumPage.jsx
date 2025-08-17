import React, { useEffect, useState } from "react";
import {
  Card,
  Empty,
  message,
  List,
  Typography,
  Breadcrumb,
  Modal,
  Select,
  Input,
} from "antd";
import {
  HomeOutlined,
  MinusOutlined,
  FolderOutlined,
  DeleteOutlined,
  HeartOutlined,
  HeartFilled,
  CustomerServiceOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  collection,
  getDocs,
  db,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
  addDoc,
  Timestamp,
} from "../services/firebase";
import { motion } from "framer-motion";
import { useMediaQuery } from "react-responsive";

const { Text } = Typography;
const { Option } = Select;
const AlbumPage = ({ onPlayClick, currentIndex, allMusicas }) => {
  const [albuns, setAlbuns] = useState([]);
  const [albumSelecionado, setAlbumSelecionado] = useState(null);
  const [musicasDoAlbum, setMusicasDoAlbum] = useState([]);
  // eslint-disable-next-line
  const [nomeAlbumSelecionado, setNomeAlbumSelecionado] = useState("");
  // eslint-disable-next-line
  const isMobile = useMediaQuery({ maxWidth: 768 });


  const [showModal, setShowModal] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [playlistSelecionada, setPlaylistSelecionada] = useState(null);
  const [novaPlaylist, setNovaPlaylist] = useState("");
  const [listaAlbunsDisponiveis, setListaAlbunsDisponiveis] = useState([]);

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
    if (albumSelecionado) {
      carregarMusicas(albumSelecionado);
      const album = albuns.find((a) => a.id === albumSelecionado);
      setNomeAlbumSelecionado(album?.nome || "");
    } else {
      setMusicasDoAlbum([]);
    }
    // eslint-disable-next-line
  }, [albumSelecionado]);



  useEffect(() => {
    async function fetchAlbuns() {
      try {
        const albunsRef = collection(db, "albunsCustomizados");
        const snapshot = await getDocs(albunsRef);
        const albunsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const todasMusicasAlbum = {
          id: "todas-musicas",
          nome: (
            <CustomerServiceOutlined
              className="icone-todas-musicas"
              style={{ marginTop: 20, fontSize: 30 }}
            />
          ),
        };

        const favoritosAlbum = {
          id: "favoritos",
          nome: (
            <HeartOutlined
              className="icone-favoritos"
              style={{ marginTop: 20, fontSize: 30 }}
            />
          ),
        };

        setAlbuns([todasMusicasAlbum, favoritosAlbum, ...albunsData]);
      } catch (error) {
        message.error("Erro ao carregar álbuns.");
      }
    }
    fetchAlbuns();
  }, []);

  async function carregarMusicas(albumId) {
    try {
      let musicas = [];

      if (albumId === "todas-musicas") {
        const allKeys = new Set();

        const albumsSnapshot = await getDocs(collection(db, "albums"));
        for (const albumDoc of albumsSnapshot.docs) {
          const musicasRef = collection(db, "albums", albumDoc.id, "media");
          const musicasSnapshot = await getDocs(musicasRef);
          const musicasAlbum = musicasSnapshot.docs.map((doc) => {
            const data = doc.data();
            const key = `${data.nome?.toLowerCase()}-${data.artista?.toLowerCase()}`;
            allKeys.add(key);
            return {
              id: doc.id,
              albumId: albumDoc.id,
              albumType: "albums",
              ...data,
            };
          });
          musicas.push(...musicasAlbum);
        }

        const customSnapshot = await getDocs(collection(db, "albunsCustomizados"));
        for (const albumDoc of customSnapshot.docs) {
          const musicasRef = collection(
            db,
            "albunsCustomizados",
            albumDoc.id,
            "musicas"
          );
          const musicasSnapshot = await getDocs(musicasRef);
          for (const docSnap of musicasSnapshot.docs) {
            const data = docSnap.data();
            const key = `${data.nome?.toLowerCase()}-${data.artista?.toLowerCase()}`;
            if (!allKeys.has(key)) {
              musicas.push({
                id: docSnap.id,
                albumId: albumDoc.id,
                albumType: "albunsCustomizados",
                ...data,
              });
              allKeys.add(key);
            }
          }
        }
      } else if (albumId === "favoritos") {
        const albumsSnapshot = await getDocs(collection(db, "albums"));
        for (const albumDoc of albumsSnapshot.docs) {
          const musicasRef = collection(db, "albums", albumDoc.id, "media");
          const musicasSnapshot = await getDocs(musicasRef);
          for (const docSnap of musicasSnapshot.docs) {
            const data = docSnap.data();
            if (data.favorito === true) {
              musicas.push({
                id: docSnap.id,
                albumId: albumDoc.id,
                albumType: "albums",
                ...data,
              });
            }
          }
        }
      } else {
        const musicasRef = collection(
          db,
          "albunsCustomizados",
          albumId,
          "musicas"
        );
        const snapshot = await getDocs(musicasRef);
        musicas = snapshot.docs.map((doc) => ({
          id: doc.id,
          albumId,
          albumType: "albunsCustomizados",
          ...doc.data(),
        }));
      }

      setMusicasDoAlbum(musicas);
    } catch (error) {
      message.error("Erro ao carregar músicas do álbum.");
    }
  }

  const toggleFavorito = async (musica) => {
    if (musica.albumType !== "albums") {
      message.warning("Favoritos só disponíveis para músicas do álbum oficial.");
      return;
    }
    try {
      const musicaRef = doc(
        db,
        "albums",
        musica.albumId,
        "media",
        musica.id
      );
      await updateDoc(musicaRef, { favorito: !musica.favorito });

      setMusicasDoAlbum((prev) =>
        prev.map((m) =>
          m.id === musica.id ? { ...m, favorito: !m.favorito } : m
        )
      );

      message.success(
        `Música ${musica.favorito ? "removida dos" : "adicionada aos"} favoritos`
      );
    } catch (error) {
      console.error("Erro ao atualizar favorito:", error);
      message.error("Erro ao atualizar favorito.");
    }
  };

  const removerMusicaDoAlbum = async (albumId, musicaId) => {
    try {
      await deleteDoc(
        doc(db, "albunsCustomizados", albumId, "musicas", musicaId)
      );
      message.success("Música removida com sucesso!");
      setMusicasDoAlbum((prev) => prev.filter((m) => m.id !== musicaId));
    } catch (error) {
      console.error("Erro ao remover música:", error);
      message.error("Erro ao remover música.");
    }
  };

  const deletarAlbum = async (albumId) => {
    try {
      const musicasRef = collection(
        db,
        "albunsCustomizados",
        albumId,
        "musicas"
      );
      const snapshot = await getDocs(musicasRef);

      const deletePromises = snapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, "albunsCustomizados", albumId, "musicas", docSnap.id))
      );
      await Promise.all(deletePromises);

      await deleteDoc(doc(db, "albunsCustomizados", albumId));
      message.success("Playlist deletada com sucesso!");

      setAlbuns((prev) => prev.filter((a) => a.id !== albumId));

      if (albumSelecionado === albumId) {
        setAlbumSelecionado(null);
        setMusicasDoAlbum([]);
      }
    } catch (error) {
      console.error("Erro ao deletar álbum:", error);
      message.error("Erro ao deletar álbum.");
    }
  };

  useEffect(() => {
    if (albumSelecionado) {
      carregarMusicas(albumSelecionado);
      const album = albuns.find((a) => a.id === albumSelecionado);
      setNomeAlbumSelecionado(album?.nome || "");
    } else {
      setMusicasDoAlbum([]);
    }
    // eslint-disable-next-line
  }, [albumSelecionado]);



  return (
    <div style={{ marginTop: 40, padding: "0 20px" }}>
      {albumSelecionado ? (
        <>
          <Breadcrumb
            style={{ marginBottom: 16, marginTop: -40 }}
            items={[
              {
                title: (
                  <span
                    onClick={() => setAlbumSelecionado(null)}
                    style={{ cursor: "pointer" }}
                  >
                    <HomeOutlined />
                  </span>
                ),
              },
              {
                title: (
                  <span>
                    <FolderOutlined />
                  </span>
                ),
              },
            ]}
          />

          {musicasDoAlbum.length === 0 ? (
            <Empty description="Nenhuma música neste álbum" />
          ) : (

            <List
              style={{
                maxHeight: isMobile ? "calc(75vh - 200px)" : "calc(80vh - 200px)",
                overflowY: "auto"
              }}
              dataSource={musicasDoAlbum}
              renderItem={(musica, index) => (
                <motion.div
                  key={musica.id}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <List.Item
                    style={{
                      cursor: "pointer",
                      position: "relative",
                      background:
                        musica.id === allMusicas[currentIndex]?.id &&
                          musica.albumId === allMusicas[currentIndex]?.albumId
                          ? "rgba(0, 21, 41, 0.95)"
                          : "#ffffff",
                      borderRadius: 8,
                      padding: "12px 20px",
                      marginBottom: 8,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      onClick={() => {
                        onPlayClick(musica);
                      }}
                    >
                      <Text
                        strong
                        style={{
                          color:
                            musica.id === allMusicas[currentIndex]?.id &&
                              musica.albumId === allMusicas[currentIndex]?.albumId
                              ? "#ffffff"
                              : "#000000",
                        }}
                      >
                        {musica.nome}
                      </Text>
                      <br />
                      <Text
                        type="secondary"
                        style={{
                          color:
                            musica.id === allMusicas[currentIndex]?.id &&
                              musica.albumId === allMusicas[currentIndex]?.albumId
                              ? "#dddddd"
                              : "#666666",
                          marginLeft: 0,
                        }}
                      >
                        {musica.artista}
                      </Text>
                    </div>

                    <div style={{ display: "flex", alignItems: "center" }}>
                      {albumSelecionado === "todas-musicas" && (
                        <PlusOutlined
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMusic(musica);
                            setShowModal(true);
                          }}
                          className="album-favorite-button-ts"
                          title="Adicionar à playlist"
                          style={{
                            marginRight: 16,
                            top: 12,
                            color:
                              musica.id === allMusicas[currentIndex]?.id &&
                                musica.albumId === allMusicas[currentIndex]?.albumId
                                ? "#ffffff"
                                : "#000000",
                          }}
                        />
                      )}

                      {(albumSelecionado === "todas-musicas" ||
                        albumSelecionado === "favoritos") &&
                        musica.albumType === "albums" ? (
                        musica.favorito ? (
                          <HeartFilled
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorito(musica);
                            }}
                            style={{
                              color:
                                musica.id === allMusicas[currentIndex]?.id &&
                                  musica.albumId === allMusicas[currentIndex]?.albumId
                                  ? "#ffffff"
                                  : "red",
                              fontSize: 18,
                              marginRight: 0,
                            }}
                          />
                        ) : (
                          <HeartOutlined
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorito(musica);
                            }}
                            style={{
                              color:
                                musica.id === allMusicas[currentIndex]?.id &&
                                  musica.albumId === allMusicas[currentIndex]?.albumId
                                  ? "#ffffff"
                                  : "#999",
                              fontSize: 18,
                              marginRight: 0,
                            }}
                          />
                        )
                      ) : null}

                      {albumSelecionado !== "todas-musicas" &&
                        musica.albumType === "albunsCustomizados" && (
                          <MinusOutlined
                            onClick={(e) => {
                              e.stopPropagation();
                              removerMusicaDoAlbum(albumSelecionado, musica.id);
                            }}
                            style={{
                              color:
                                musica.id === allMusicas[currentIndex]?.id &&
                                  musica.albumId === allMusicas[currentIndex]?.albumId
                                  ? "#ffffff"
                                  : "#ff4d4f",
                              fontSize: 18,
                              marginRight: 12,
                            }}
                            title="Remover música"
                          />
                        )}
                    </div>
                  </List.Item>
                </motion.div>
              )}
            />

          )}
        </>
      ) : (
        <div
          style={{
            display: "flex",
            overflowX: "auto",
            gap: 10,
            paddingBottom: 16,
            marginTop: -20,
            scrollbarWidth: "none",
          }}
        >
          {albuns.map((album) => (
            <motion.div
              key={album.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                hoverable
                onClick={() => setAlbumSelecionado(album.id)}
                style={{
                  textAlign: "center",
                  borderRadius: 12,
                  height: 150,
                  minWidth: 150,
                  flex: "0 0 auto",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
                actions={
                  album.id !== "todas-musicas" && album.id !== "favoritos"
                    ? [
                      <DeleteOutlined
                        key="delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          Modal.confirm({
                            title: "Tem certeza que deseja deletar esta playlist?",
                            content: "Todas as músicas dentro dela também serão excluídas.",
                            okText: "Sim, deletar",
                            okType: "danger",
                            cancelText: "Cancelar",
                            onOk: () => deletarAlbum(album.id),
                          });
                        }}
                        style={{ color: "#ff4d4f", fontSize: 18 }}
                      />,
                    ]
                    : []
                }
              >
                <div style={{ padding: "12px 0" }}>
                  <Text strong>{album.nome}</Text>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>


      )}


      <Modal
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setPlaylistSelecionada(null);
          setNovaPlaylist("");
        }}
        onOk={async () => {
          if (!playlistSelecionada && !novaPlaylist) {
            message.warning("Escolha uma playlist ou crie uma.");
            return;
          }

          const nomeDoAlbum = playlistSelecionada || novaPlaylist;

          await adicionarMusicaAoAlbum(selectedMusic, nomeDoAlbum);

          setShowModal(false);
          setPlaylistSelecionada(null);
          setNovaPlaylist("");
        }}
        title={`Adicionar "${selectedMusic?.nome}" à playlist`}
      >
        <p>Escolha uma playlist existente:</p>
        <Select
          style={{ width: "100%" }}
          placeholder="Selecione uma playlist"
          onChange={(value) => {
            setPlaylistSelecionada(value);
            setNovaPlaylist("");
          }}
          value={playlistSelecionada || undefined}
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
          value={novaPlaylist}
          onChange={(e) => {
            setNovaPlaylist(e.target.value);
            setPlaylistSelecionada(null);
          }}
        />
      </Modal>
    </div>


  );
};ß

export default AlbumPage;