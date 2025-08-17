PulseTune é um aplicativo de música que permite gerenciar, baixar e organizar músicas a partir de URLs do YouTube, utilizando **Supabase**, **Firebase** e integração com **Ngrok**.

## Tecnologias Utilizadas
- [React.js](https://reactjs.org/) (Frontend)
- [Ant Design](https://ant.design/) (UI Components)
- [Firebase](https://firebase.google.com/) (Autenticação e Storage)
- [Supabase](https://supabase.com/) (Banco de dados)
- [Ngrok](https://ngrok.com/) (Tunelamento de API)
- Node.js / Express (Backend)

## Configuração Inicial

Antes de iniciar o projeto, você deve configurar os seguintes arquivos:

### Backend (`/yt-backend`)
No arquivo onde estão as variáveis do Supabase, substitua pelas suas chaves:  

```js
const supabaseUrl = "SUA_SUPABASE_URL";
const supabaseServiceKey = "SUA_SUPABASE_SERVICE_KEY";
```

---

### Firebase (`/services`)
No arquivo de configuração do Firebase (`firebaseConfig`), substitua pelas credenciais do seu projeto Firebase:  

```js
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJECT_ID.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJECT_ID.appspot.com",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SUA_APP_ID"
};
```

### Painel de Administração (`/components/AdminPanel.js`)
No método `handleYouTubeDownload`, troque a URL de exemplo pelo endpoint do **Ngrok**:  

```js
const handleYouTubeDownload = async () => {
  if (!youtubeUrl) return message.warning("Cole uma URL do YouTube");
  if (!artistName || !songName)
    return message.warning("Preencha o nome do cantor e da música");

  setIsDownloading(true);

  try {
    const response = await fetch("SUA_URL_NGROK/downloads", { // 🔗 NGROK URL
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ youtubeUrl, artistName, songName })
    });

    // ...
  } catch (error) {
    console.error(error);
  }
};
```

---

## Como Rodar o Projeto

### 1. Clone o repositório
```bash
git clone https://github.com/GScarabel/PulseTune.git
cd PulseTune
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis
Edite os arquivos mencionados acima (`yt-backend`, `services`, `components/AdminPanel.js`) com suas credenciais e URLs.

### 4. Inicie o backend
```bash
cd yt-backend
node index.js
```

### 5. Inicie o frontend
```bash
npm start
```

## Observações
- O **Ngrok** deve estar rodando para expor seu backend local.
- Certifique-se de que as credenciais do Firebase e Supabase estão corretas.
- O projeto utiliza **YouTube download**, então a URL precisa ser válida.

## Licença
Este projeto é de uso pessoal/educacional.  
