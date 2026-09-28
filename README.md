# POF Planty of Food

POF è un assistente AI per la ricerca di ricette plant-based. L'utente descrive ciò che vuole mangiare e il sistema cerca le ricette più pertinenti tramite RAG, mantenendo anche il contesto della conversazione.

## Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Agente:** LangChain + Groq
- **RAG:** Gemini Embeddings + Pinecone
- **Ricette:** Spoonacular API
- **Memoria:** Supabase PostgreSQL

## Struttura

```text
client/   interfaccia React
server/   API, agente, RAG e persistenza
```

## Avvio locale

Installa le dipendenze nelle due cartelle:

```bash
cd server
npm install

cd ../client
npm install
```

Copia `server/.env.example` in `server/.env` e inserisci le chiavi dei servizi usati dal backend.

Per il frontend `VITE_API_URL` è opzionale in locale: se non è impostata viene usato `http://localhost:3000`. Per il deploy è possibile configurarla tramite le variabili d'ambiente della piattaforma.

Avvia backend e frontend in due terminali separati:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

## Comandi utili

Frontend:

```bash
npm run build
npm run lint
```

Backend:

```bash
npm run start
```

Le chiavi API reali non sono incluse nel repository.
