# DocuChat — RAG-based Document Q&A Platform

## What this does
Upload a PDF → the backend chunks it and generates an embedding vector for each chunk →
ask a question in a chat interface → the backend embeds your question, finds the most
semantically relevant chunks via cosine similarity, and streams back an answer grounded
in those excerpts, with citations showing exactly which parts of the document it used.

## Why this project, and how it differs from a plain "call an LLM API" project
Most AI-integrated fresher projects stop at "send a prompt, get a response." This one
implements actual **retrieval** — the model never sees the whole document, only the
chunks that are semantically relevant to the specific question asked. That's the core
idea behind RAG (Retrieval-Augmented Generation), and it's what separates "used an AI
API" from "understands how production AI systems are architected."

## Structure
```
docuchat/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Document.js        → embeds chunks + their vectors (see comment in file for why)
│   │   └── ChatSession.js     → embeds messages + per-message source citations
│   ├── utils/
│   │   ├── pdfParser.js       → extracts text from uploaded PDFs
│   │   ├── chunker.js         → fixed-size + overlap chunking (see comment for the
│   │   │                        semantic-vs-fixed-size tradeoff this makes)
│   │   ├── vectorSearch.js    → cosine similarity + top-K retrieval (see comment for
│   │   │                        why this isn't a dedicated vector DB, and when it should be)
│   │   └── geminiClient.js    → embeddings (gemini-embedding-001) + streaming chat
│   │                             (gemini-flash-latest)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── documentController.js  → upload → parse → chunk → embed → store
│   │   └── chatController.js      → the core RAG endpoint: embed question → retrieve
│   │                                  → stream grounded answer → persist with citations
│   ├── routes/
│   └── tests/
│       ├── geminiClient.test.js (not present here - see note below)
│       └── rag.test.js        → unit tests for chunking boundaries + cosine similarity
└── frontend/
    └── src/
        ├── pages/
        │   ├── Documents.jsx   → upload + document list
        │   └── Chat.jsx        → streaming chat UI with live token rendering + citations
        └── ...                  (auth pages/context mirror the Interview Copilot project)
```

## The RAG pipeline, step by step
1. **Upload**: PDF → `pdfParser.js` extracts raw text
2. **Chunk**: `chunker.js` splits it into ~1000-character pieces with 150-character overlap
3. **Embed**: each chunk gets a vector from `gemini-embedding-001`, stored alongside the
   chunk text in MongoDB (sequential calls, not parallel — see comment in `geminiClient.js`
   for why, it's a real free-tier rate-limit consideration, not an oversight)
4. **Ask**: a question gets embedded with the same model, into the same vector space
5. **Retrieve**: `vectorSearch.js` computes cosine similarity between the question's
   vector and every chunk's vector, returns the top 4
6. **Generate**: those 4 chunks get inserted into a prompt that explicitly instructs the
   model to answer only from the provided context — this is what prevents hallucination
7. **Stream**: the answer streams back token-by-token over a chunked HTTP response (not
   Server-Sent Events — see comment in `chatController.js` for why, it's because SSE
   requires GET and this needs to send a POST body)
8. **Cite**: the chunks used are saved with the message, so the UI can show exactly which
   parts of the document grounded the answer

## Setup
```bash
# Backend
cd backend
npm install
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET, GEMINI_API_KEY
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`, sign up, upload a real PDF, and ask it a question you
already know the answer to — that's the fastest way to sanity-check retrieval is
actually working (does the cited excerpt match where the real answer lives in the doc?).

## Verified before delivery
- All backend files pass `node --check`
- 8 unit tests pass covering chunk boundary behavior and cosine similarity math
  (`cd backend && npm test`)
- Frontend builds cleanly with `npm run build`
- Server boots and mounts all routes without crashing

**Not yet tested: an actual end-to-end run with real MongoDB + Gemini credentials**,
same as the Interview Copilot project. You'll hit real things to debug — that's normal.

## Before you use this as a resume project
Read `utils/chunker.js` and `utils/vectorSearch.js` first — both have inline comments
explaining a real architectural decision and its tradeoff (fixed-size vs. semantic
chunking, in-app cosine similarity vs. a dedicated vector database). Those two decisions,
and being able to explain *when* the alternative would be the right call instead, are
the actual technical depth this project is meant to demonstrate — write your defense doc
from those two files.

## Deploying
Same process as the Interview Copilot project: Render for the backend, Vercel for the
frontend, `VITE_API_URL` set to the Render URL + `/api`, `FRONTEND_URL` on Render set to
the exact Vercel origin (no path, no trailing slash) for CORS. The `vercel.json` in this
project already excludes `/api` from the SPA rewrite from the start — that one cost real
debugging time last project, so it's fixed here before you hit it.
