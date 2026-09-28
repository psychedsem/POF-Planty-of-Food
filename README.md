# POF Planty of Food

POF è un assistente AI per la ricerca di ricette plant-based.
L'utente descrive ciò che vuole mangiare e il sistema cerca nel database le ricette semanticamente più pertinenti, mantenendo anche il contesto della conversazione.

## Demo online

- **Frontend:** https://pof-planty-of-food.web.app
- **Backend API:** https://pof-planty-of-food-api.onrender.com
- **Health check:** https://pof-planty-of-food-api.onrender.com/api/health
- **Repository GitHub:** https://github.com/psychedsem/POF-Planty-of-Food

> Il backend è ospitato sul piano gratuito di Render: dopo un periodo di inattività la prima richiesta può richiedere alcuni secondi in più.

## Funzionalità principali

- Chat conversazionale per la ricerca di ricette plant-based
- Agente AI orchestrato con LangChain
- Tool calling: l'agente decide quando interrogare il database delle ricette
- RAG con ricerca semantica tramite embeddings
- Filtro dei risultati con score threshold per ridurre match poco pertinenti e contesto inutile
- Memoria persistente delle conversazioni con Supabase
- Recupero e preparazione dei dati delle ricette tramite Spoonacular e Gemini
- Gestione di errori e rate limit del provider AI con retry automatico
- Interfaccia React responsive con rendering Markdown
- Persistenza locale della conversazione visibile nel browser
- Deploy separato di frontend e backend

## Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Orchestrazione agente:** LangChain
- **LLM:** Groq con `openai/gpt-oss-20b`
- **Embeddings:** Google Gemini
- **Vector database:** Pinecone
- **Ricette:** Spoonacular API
- **Memoria:** Supabase PostgreSQL
- **Hosting frontend:** Firebase Hosting
- **Hosting backend:** Render

## Architettura

Il frontend React invia i messaggi al backend Express tramite l'endpoint `/api/chat`.

Il flusso principale è:

1. React invia `conversationId` e messaggio al backend.
2. Il backend recupera da Supabase la cronologia della conversazione.
3. LangChain passa messaggio e contesto all'agente AI.
4. L'agente decide se la richiesta contiene informazioni sufficienti per usare il tool `search_recipes`.
5. La query viene trasformata in embedding con Gemini.
6. Pinecone esegue la ricerca semantica.
7. I risultati con similarità inferiore alla soglia configurata vengono esclusi.
8. L'agente genera la risposta utilizzando i dati recuperati dal database.
9. Messaggio dell'utente e risposta dell'assistente vengono salvati in Supabase.
10. Il frontend mostra la risposta in Markdown.

```text
Utente
  ↓
React + Vite
  ↓
POST /api/chat
  ↓
Node.js + Express
  ↓
Supabase → memoria conversazionale
  ↓
LangChain Agent + Groq
  ↓
search_recipes
  ↓
Gemini Embeddings
  ↓
Pinecone
  ↓
Ricette pertinenti
  ↓
Groq
  ↓
Risposta
  ↓
Supabase + React
```

## RAG

Le ricette vengono preparate in una struttura adatta alla ricerca semantica, con informazioni come:

- titolo
- fonte
- descrizione
- ingredienti
- istruzioni
- tag
- frase caratteristica
- tempo di preparazione
- porzioni

Gli embeddings hanno dimensione 768 e vengono salvati in Pinecone.

Durante la ricerca viene applicato uno **score threshold di 0.6**: i match con similarità inferiore vengono scartati, riducendo rumore e contesto non necessario passato al modello.

L'agente è inoltre istruito a non inventare nuove ricette: quando la richiesta è sufficientemente specifica deve utilizzare il tool di ricerca e basare la risposta sui dati recuperati.

## Memoria conversazionale

Ogni conversazione utilizza un `conversationId`.

La cronologia viene salvata in Supabase e recuperata dal backend prima di ogni nuova richiesta, permettendo follow-up come:

```text
Utente: Vorrei una ricetta con fagioli rossi.
POF: [restituisce la ricetta]

Utente: E per quante persone è?
POF: La ricetta è per 6 porzioni.
```

Nel browser vengono inoltre conservati il `conversationId` e i messaggi visibili, così un refresh della pagina non azzera immediatamente la chat.

## Struttura del progetto

```text
POF-Planty-of-Food/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── services/
│   │   └── utils/
│   ├── firebase.json
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── agents/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── tools/
│   │   └── utils/
│   ├── supabase/
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

## API

### Health check

```http
GET /api/health
```

Esempio di risposta:

```json
{
  "status": "ok",
  "message": "API POF attiva"
}
```

### Chat

```http
POST /api/chat
Content-Type: application/json
```

Body:

```json
{
  "conversationId": "example-conversation",
  "message": "Vorrei un piatto speziato con fagioli rossi"
}
```

Esempio di risposta:

```json
{
  "status": "ok",
  "conversationId": "example-conversation",
  "reply": "Ho trovato questa ricetta: ..."
}
```

## Avvio locale

### Backend

```bash
cd server
npm install
```

Copia `.env.example` in `.env` e configura le variabili richieste:

```env
SPOONACULAR_API_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
PINECONE_API_KEY=
PINECONE_INDEX=pof-recipes
SUPABASE_URL=
SUPABASE_SECRET_KEY=
PORT=3000
```

Avvia il backend:

```bash
npm run dev
```

### Frontend

In un secondo terminale:

```bash
cd client
npm install
npm run dev
```

In locale il frontend usa automaticamente:

```text
http://localhost:3000
```

come URL del backend, salvo configurazione diversa tramite `VITE_API_URL`.

## Build

Frontend:

```bash
cd client
npm run build
```

Backend:

```bash
cd server
npm start
```

## Deploy

Il progetto utilizza due servizi separati:

- **Firebase Hosting** per il frontend React
- **Render** per il backend Node.js / Express

Le variabili d'ambiente e le chiavi API vengono configurate direttamente nei servizi di deploy e non sono incluse nel repository.

Il frontend di produzione comunica con:

```text
https://pof-planty-of-food-api.onrender.com
```

## Sicurezza

Le chiavi API reali sono conservate esclusivamente in variabili d'ambiente lato backend.

I file `.env` e le configurazioni locali sensibili sono esclusi da Git tramite `.gitignore`.

Il frontend non contiene chiavi private dei provider AI, di Pinecone o di Supabase.

## Contatti

Per informazioni sul progetto o per entrare in contatto con me:

- LinkedIn: [Simone "Sem"](https://www.linkedin.com/in/simone-sem/)
