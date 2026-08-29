# RAVID Frontend — "The Archive"

A small NotebookLM-style demo UI for the RAVID Private Knowledge API: upload a
document in the left **Ledger**, click it once it's `READY`, and chat with it
in the **Reading Room**. Answers open a **Citations** drawer showing the real
retrieved chunks (and, with HyDE on, the hypothetical passage used only for
search).

## Stack

Vite + React + TypeScript, Tailwind CSS, TanStack Query (polling document
status / chat history), Zustand (auth + selected document), Axios (JWT
interceptor with auto-refresh on 401), react-markdown for answers.

## Setup

```bash
npm install
cp .env.example .env
# .env → VITE_API_BASE_URL=http://127.0.0.1:8000  (your Django backend)
npm run dev
```

Open http://localhost:5173. Make sure the backend is running (`docker compose
up --build -d` in the API repo) and CORS allows this origin — add to the
backend:

```bash
pip install django-cors-headers
```

```python
# settings.py
INSTALLED_APPS += ["corsheaders"]
MIDDLEWARE.insert(0, "corsheaders.middleware.CorsMiddleware")  # before CommonMiddleware
CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]
```

## Flow

1. Register / sign in (JWT stored in memory only, refreshed automatically).
2. Upload a PDF/TXT/Markdown file — the Ledger polls `/api/documents/status/`
   every 2s while a document is `UPLOADED`/`PROCESSING`.
3. Click a `READY` document to open its Reading Room.
4. Ask a question — creates a conversation on first send, then calls
   `/api/chat/query/` with `document_ids: [selectedId]`.
5. Toggle **HyDE** top-right to send `use_hyde: true`.
6. Click the "N sources · mode →" link under any answer to open the Citations
   drawer.

## Notes

- The demo persists the JWT pair in local storage so a page refresh keeps the
  session and the Axios interceptor can refresh an expired access token. For a
  production deployment, prefer an httpOnly refresh-cookie flow.
- Ready documents can be selected together; chat sends all selected IDs through
  the backend's multi-document `document_ids` field.
