# Technical Decisions & Justifications

## Overview

This document outlines the key technical decisions made when building the FocusFlow Productivity Tracker, including library choices, architecture decisions, and tradeoffs considered.

---

## Frontend

### React.js
**Decision:** Use React.js with functional components and hooks.
**Justification:** React is the most widely adopted frontend framework, with excellent ecosystem support. Functional components with hooks (useState, useEffect) keep the code concise and readable. The component-based architecture makes it easy to isolate and test individual UI elements like TaskCard, TaskModal, and charts.

### Recharts
**Decision:** Use Recharts for data visualization.
**Justification:** Recharts is built specifically for React and uses a declarative API that integrates naturally with React's component model. It supports stacked bar charts out of the box, which was ideal for showing focus level breakdowns per day. Alternatives like D3.js were considered but are significantly more complex to integrate with React.

### Tailwind CSS
**Decision:** Use Tailwind CSS for styling.
**Justification:** Tailwind's utility-first approach allows rapid UI development without switching between files. Combined with CSS variables for theming, it produces a consistent dark-mode design system. The design uses custom CSS variables (--accent, --bg-card, etc.) for a cohesive visual identity.

### localStorage
**Decision:** Persist task data in localStorage.
**Justification:** localStorage provides zero-setup client-side persistence that survives page refreshes. For a productivity tracker with moderate data volumes, it is sufficient and avoids the complexity of a database. Tasks are serialized as JSON on every state change via a useEffect hook.

---

## Backend

### FastAPI
**Decision:** Use FastAPI as the Python web framework.
**Justification:** FastAPI is the modern standard for Python APIs. It provides automatic OpenAPI documentation, built-in request validation via Pydantic, and async support. It is significantly faster and more developer-friendly than Flask for building typed REST APIs.

### Anthropic Claude API
**Decision:** Use Claude (claude-sonnet-4-20250514) for weekly summary generation.
**Justification:** Claude produces high-quality, nuanced natural language summaries and reliably follows structured JSON output instructions. The prompt is designed to return a strict JSON object with a summary paragraph and suggestions array, making parsing straightforward. Claude was chosen over OpenAI GPT as it is the API provided for this project.

---

## Vector Store & Agent (Part 2)

### LangChain
**Decision:** Use LangChain as the vector store orchestration layer.
**Justification:** LangChain provides a clean abstraction over vector stores, embeddings, and document management. It handles the complexity of document storage, retrieval, and index persistence. The langchain-community package provides ready-made integrations for both FAISS and HuggingFace embeddings.

### FAISS
**Decision:** Use FAISS as the vector store.
**Justification:** FAISS (Facebook AI Similarity Search) is a battle-tested, high-performance library for similarity search. It runs entirely locally with no external service required, making it ideal for a self-contained application. Alternatives like Chroma and Pinecone were considered — Chroma requires a running server process, and Pinecone requires a paid API key. FAISS requires neither.

### HuggingFace Sentence Transformers (all-MiniLM-L6-v2)
**Decision:** Use all-MiniLM-L6-v2 for generating text embeddings.
**Justification:** This model provides an excellent balance of speed, size (~80MB), and embedding quality for semantic similarity tasks. It runs entirely locally with no API key required, keeping costs at zero for the vector search feature. The model is well-suited for embedding paragraph-length productivity summaries.

### Similarity Search Strategy
**Decision:** Embed a rich text string combining summary, suggestions, categories, and focus stats.
**Justification:** Richer embedded text produces better semantic matches. Rather than embedding just the summary paragraph, we concatenate all relevant fields so queries like "weeks with lots of coding" match on category data, and queries like "low focus weeks" match on focus count data embedded in the text.

---

## Docker

### Docker Compose
**Decision:** Use Docker Compose to orchestrate frontend and backend containers.
**Justification:** Docker Compose allows the entire application to be started with a single command (docker-compose up --build), eliminating environment setup issues. The backend uses a named volume (faiss-data) to persist the FAISS index across container restarts. The frontend is built with a multi-stage Dockerfile to produce an optimized nginx-served production build.

---

## Tradeoffs & Future Improvements

| Area | Current Approach | Future Improvement |
|---|---|---|
| Data persistence | localStorage | PostgreSQL or SQLite backend |
| Authentication | None | JWT-based user auth |
| Vector store | Local FAISS | Pinecone or Weaviate for multi-user |
| Embeddings | Local HuggingFace | OpenAI embeddings for higher quality |
| Deployment | Docker Compose | Kubernetes or cloud deployment |
