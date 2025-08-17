const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const app = express();
const PORT = 3001;
const DOWNLOAD_FOLDER = path.join(__dirname, "downloads");
const supabaseUrl = "";
const supabaseServiceKey = "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);


app.use(cors());
app.use(bodyParser.json());

if (!fs.existsSync(DOWNLOAD_FOLDER)) {
  fs.mkdirSync(DOWNLOAD_FOLDER);
}

app.use("/downloads", express.static(DOWNLOAD_FOLDER));

app.post("/download", async (req, res) => {
  const { url } = req.body;
  console.log("POST /download recebido", req.body);

  if (!url)
    return res.status(400).json({ error: "URL do YouTube é obrigatória" });

  const timestamp = Date.now();
  const outputTemplate = path.join(DOWNLOAD_FOLDER, `${timestamp}.%(ext)s`);
  const finalMp3Name = `${timestamp}.mp3`;
  const finalMp3Path = path.join(DOWNLOAD_FOLDER, finalMp3Name);

  const command = `yt-dlp -x --audio-format mp3 -o "${outputTemplate}" "${url}"`;

  exec(command, async (error, stdout, stderr) => {
    if (error) {
      console.error("Erro no yt-dlp:", error);
      return res.status(500).json({ error: "Erro ao baixar o vídeo" });
    }

    let attempts = 0;
    const maxAttempts = 10;

    const waitForFile = setInterval(async () => {
      if (fs.existsSync(finalMp3Path)) {
        clearInterval(waitForFile);

        const stats = fs.statSync(finalMp3Path);
        console.log("Arquivo gerado:", finalMp3Name, "Tamanho:", stats.size);

        try {
          const fileContent = fs.readFileSync(finalMp3Path);

          const supabasePath = `youtube/${finalMp3Name}`;
          const { error: uploadError } = await supabase.storage
            .from("playmusic")
            .upload(supabasePath, fileContent, {
              contentType: "audio/mpeg",
              upsert: true,
            });

          if (uploadError) {
            console.error("Erro no upload para Supabase:", uploadError);
            return res.status(500).json({ error: "Erro no upload Supabase" });
          }

          const { data: publicUrlData, error: urlError } = supabase.storage
            .from("playmusic")
            .getPublicUrl(supabasePath);

          if (urlError) {
            console.error("Erro ao obter URL pública:", urlError);
            return res.status(500).json({ error: "Erro ao obter URL pública" });
          }

          console.log("Upload concluído. URL pública:", publicUrlData.publicUrl);

          fs.unlinkSync(finalMp3Path);

          res.json({ url: publicUrlData.publicUrl });
        } catch (e) {
          console.error("Erro ao processar arquivo:", e);
          res.status(500).json({ error: "Erro interno no servidor" });
        }
      } else {
        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(waitForFile);
          console.error("Arquivo mp3 não gerado após várias tentativas");
          return res.status(500).json({ error: "Falha ao gerar arquivo mp3" });
        }
      }
    }, 500);
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando.`);
});