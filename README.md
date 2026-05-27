# FocusFlow — Productivity Tracker

A full-stack productivity tracking application with AI-generated weekly summaries and vector-powered historical search.

## Tech Stack

- **Frontend:** React.js, Recharts, Tailwind CSS
- **Backend:** FastAPI, Python
- **AI Summary:** Anthropic Claude API
- **Vector Store:** FAISS + LangChain + HuggingFace Embeddings
- **Containerization:** Docker Compose

---

## Running the App Locally

### Step 1: Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your Anthropic API key
uvicorn main:app --reload
```

Backend will run at http://localhost:8000

### Step 2: Frontend

```bash
cd frontend
npm install
npm start
```

Frontend will run at http://localhost:3000

---

## Running with Docker Compose

```bash
# From the root productivity-tracker/ folder
cp backend/.env.example backend/.env
# Edit backend/.env and add your Anthropic API key
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

---

## Seeding Sample Data

To populate the vector store with sample weekly summaries for testing historical search:

```bash
# Make sure backend is running first
cd backend
source venv/bin/activate
python seed_data.py
```

---

## Vector Store Setup

- Uses **FAISS** (Facebook AI Similarity Search) as the vector database
- Uses **HuggingFace sentence-transformers** (all-MiniLM-L6-v2) for embeddings
- The index is automatically saved to `backend/faiss_index/` on disk
- No external vector database setup required — runs fully locally

---

## Features

- Log daily tasks with name, category, time spent, and focus level
- Dashboard with bar chart and activity heatmap visualizations
- AI-generated weekly summary and suggestions via Claude API
- Save summaries to vector store and search past weeks by natural language
- Data persists via localStorage (frontend) and FAISS index (backend)

---

## Environment Variables

| Variable | Description |
|---|---|
| ANTHROPIC_API_KEY | Your Anthropic API key from console.anthropic.com |
| REACT_APP_BACKEND_URL | Backend URL (default: http://localhost:8000) |

---

## Decision Document

See [DECISIONS.md](./DECISIONS.md) for technical decisions and justifications.
