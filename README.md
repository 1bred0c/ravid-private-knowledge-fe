# RAVID Frontend — The Archive

React interface for the [RAVID Private Knowledge API](https://github.com/1bred0c/ravid-private-knowledge-api). Users can manage subscriptions, upload and select documents, keep separate conversations, ask grounded questions, and inspect the source chunks returned by the RAG pipeline.

## Run the complete application with Docker

The backend and frontend live in separate repositories and each has its own Compose stack.

### 1. Start the backend

```powershell
git clone https://github.com/1bred0c/ravid-private-knowledge-api.git
Set-Location ravid-private-knowledge-api
Copy-Item .env.example .env
```

Edit the backend `.env` and provide at least:

```env
DJANGO_SECRET_KEY=replace-with-a-long-random-secret
OPENROUTER_API_KEY=your-openrouter-api-key
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Then build and start Django, PostgreSQL/pgvector, Redis, Celery, and Flower:

```powershell
docker compose up --build -d
docker compose ps
```

Wait until the `web` service reports healthy. Its health endpoint is available at http://127.0.0.1:8000/api/health/.

### 2. Start the frontend

Open another terminal:

```powershell
git clone https://github.com/1bred0c/ravid-private-knowledge-fe.git
Set-Location ravid-private-knowledge-fe
docker compose up --build -d
docker compose ps
```

Open http://localhost:5173. The production bundle is built by Node and served by Nginx; the default API URL is `http://127.0.0.1:8000`.

If the backend is hosted elsewhere, set its public URL before building the frontend image:

```powershell
$env:VITE_API_BASE_URL = "https://api.example.com"
docker compose up --build -d
```

`VITE_API_BASE_URL` is compiled into the Vite bundle, so rebuild the image after changing it. The backend must also include the frontend origin in `CORS_ALLOWED_ORIGINS`.

### 3. View logs and stop the application

Run these commands inside the corresponding repository:

```powershell
docker compose logs -f
docker compose down
```

Backend data stays in Docker volumes after `docker compose down`. Only use `docker compose down --volumes` when a complete database, Redis, and uploaded-file reset is intended.

## Run locally for development

Start the backend stack as described above, then run the frontend outside Docker:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

The default frontend environment is:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Open http://localhost:5173. Vite reloads the page as source files change.

## Production image

The `Dockerfile` uses two stages:

1. Node 22 installs locked dependencies and creates the Vite production build.
2. Nginx serves the generated static assets and falls back to `index.html` for client-side routes.

Build and run it without Compose:

```powershell
docker build --build-arg VITE_API_BASE_URL=http://127.0.0.1:8000 -t ravid-frontend .
docker run --rm -p 5173:80 ravid-frontend
```

## Main application flow

1. Register or sign in. The Axios client sends the access token and automatically uses the refresh token after a `401` response.
2. Choose a subscription plan and inspect the account quota.
3. Upload PDF, TXT, or Markdown files and wait for asynchronous ingestion to reach `READY`.
4. Create a conversation and select one or more documents for each question.
5. Ask using standard RAG or enable HyDE retrieval.
6. Open Citations to inspect `retrieval_metadata.source_chunks` returned by the backend.

The JWT pair is persisted in browser local storage for this demo. A production security hardening pass should move refresh-token handling to secure, httpOnly cookies.
