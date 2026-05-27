"""
Productivity Tracker Backend
=========================================
Part 1: Generates AI weekly summaries using Anthropic Claude API
Part 2: Stores summaries in a FAISS vector store via LangChain
        and enables natural language similarity search
"""

import os
import json
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import anthropic

# LangChain community integrations for FAISS and HuggingFace embeddings
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.docstore.document import Document

from dotenv import load_dotenv

# Load environment variables from .env file (e.g. ANTHROPIC_API_KEY)
load_dotenv()

app = FastAPI(title="Productivity Tracker API")

# ── CORS Middleware ──────────────────────────────────────────────
# Allow the React frontend (port 3000) to call this backend (port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Anthropic client ─────────────────────────────────────────────
# Reads ANTHROPIC_API_KEY from .env file
anthropic_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# ── Embedding model ──────────────────────────────────────────────
# Uses a lightweight local sentence-transformer model (~80MB)
# This converts text into numeric vectors for similarity search
# No API key needed — runs entirely on your machine
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# ── FAISS vector store ───────────────────────────────────────────
# FAISS_INDEX_PATH is where the vector index is saved on disk
# so summaries persist across server restarts
FAISS_INDEX_PATH = "./faiss_index"

def load_vector_store():
    """Load existing FAISS index from disk if it exists, otherwise return None."""
    if os.path.exists(FAISS_INDEX_PATH):
        return FAISS.load_local(
            FAISS_INDEX_PATH,
            embeddings,
            allow_dangerous_deserialization=True  # Required by LangChain for local files
        )
    return None

# Load vector store at startup so it's ready for requests
vector_store = load_vector_store()


# ── Pydantic models ──────────────────────────────────────────────
# These define the shape of data coming in from the frontend

class Task(BaseModel):
    """A single logged task from the user."""
    id: str
    name: str
    category: str
    timeSpent: float      # Hours spent on this task
    focusLevel: str       # 'high', 'medium', or 'low'
    date: str             # ISO format: YYYY-MM-DD
    notes: Optional[str] = ""

class WeeklyMetrics(BaseModel):
    """Aggregated metrics for a full week, sent from the frontend."""
    week_start: str
    week_end: str
    total_tasks: int
    total_hours: float
    focus_counts: dict        # e.g. {"high": 5, "medium": 3, "low": 2}
    category_counts: dict     # e.g. {"Coding": 6, "Meeting": 4}
    tasks: List[Task]         # Full list of individual tasks

class SummaryPayload(BaseModel):
    """Payload sent when saving a generated summary to the vector store."""
    summary: str
    suggestions: List[str]
    metrics: WeeklyMetrics

class SearchQuery(BaseModel):
    """Natural language query for searching past weekly summaries."""
    query: str
    top_k: int = 5    # Number of results to return


# ── Part 1: Generate weekly summary via Claude ───────────────────

@app.post("/generate-summary")
async def generate_summary(metrics: WeeklyMetrics):
    """
    Calls Anthropic Claude to generate:
    - A one-paragraph summary of the week's productivity
    - 3-5 actionable suggestions for the following week

    Strategy: Build a detailed prompt from the week's metrics,
    then ask Claude to respond in strict JSON format for easy parsing.
    """

    # Format individual tasks into a readable list for the prompt
    task_details = "\n".join(
        f"- {t.name} ({t.category}, {t.timeSpent}h, focus: {t.focusLevel}, date: {t.date})"
        for t in metrics.tasks
    )

    # Format category and focus breakdowns as readable strings
    category_breakdown = ", ".join(f"{k}: {v}" for k, v in metrics.category_counts.items())
    focus_breakdown = (
        f"high: {metrics.focus_counts.get('high', 0)}, "
        f"medium: {metrics.focus_counts.get('medium', 0)}, "
        f"low: {metrics.focus_counts.get('low', 0)}"
    )

    # Build the prompt — we ask Claude to respond ONLY in JSON
    # so we can reliably parse the summary and suggestions separately
    prompt = f"""You are a productivity coach analyzing a user's weekly work log.

Week: {metrics.week_start} to {metrics.week_end}
Total tasks completed: {metrics.total_tasks}
Total hours logged: {metrics.total_hours}h
Focus level breakdown: {focus_breakdown}
Category breakdown: {category_breakdown}

Individual tasks:
{task_details}

Please provide:
1. A single paragraph (4-6 sentences) summarizing the week's productivity patterns,
   highlighting strengths and areas of concern.
2. A JSON list of exactly 3-5 concise, actionable suggestions for next week.

Respond ONLY with valid JSON in this exact format:
{{
  "summary": "Your paragraph here...",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}}"""

    try:
        # Call Claude API with the prompt
        message = anthropic_client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )
        raw = message.content[0].text.strip()

        # Strip markdown code fences if Claude wraps the JSON in ```json ... ```
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        # Parse the JSON response
        data = json.loads(raw)
        return {"summary": data["summary"], "suggestions": data["suggestions"]}

    except json.JSONDecodeError:
        # Claude didn't return valid JSON — surface a clear error
        raise HTTPException(status_code=500, detail="Failed to parse AI response as JSON.")
    except anthropic.AuthenticationError:
        raise HTTPException(status_code=401, detail="Invalid Anthropic API key. Check your .env file.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Part 2: Save summary to FAISS vector store ───────────────────

@app.post("/save-summary")
async def save_summary(payload: SummaryPayload):
    """
    Embeds a weekly summary into the FAISS vector store.

    Strategy: We build a rich text string combining the summary,
    suggestions, and metrics. This text gets converted into a
    vector (embedding) that captures its semantic meaning.
    When users search later, their query is also embedded and
    compared against these stored vectors using cosine similarity.
    """
    global vector_store

    # Build the text to embed — more context = better search matches
    # We include summary, suggestions, categories, and focus stats
    suggestions_text = " ".join(payload.suggestions)
    category_text = ", ".join(f"{k} ({v} tasks)" for k, v in payload.metrics.category_counts.items())
    embed_text = (
        f"Week {payload.metrics.week_start} to {payload.metrics.week_end}. "
        f"{payload.summary} "
        f"Suggestions: {suggestions_text} "
        f"Categories: {category_text}. "
        f"Total tasks: {payload.metrics.total_tasks}. "
        f"Hours: {payload.metrics.total_hours}. "
        f"Focus: high {payload.metrics.focus_counts.get('high', 0)}, "
        f"medium {payload.metrics.focus_counts.get('medium', 0)}, "
        f"low {payload.metrics.focus_counts.get('low', 0)}."
    )

    # Store all fields in metadata so we can retrieve them on search
    # Metadata is NOT embedded — it's just stored alongside the vector
    metadata = {
        "week_start": payload.metrics.week_start,
        "week_end": payload.metrics.week_end,
        "total_tasks": payload.metrics.total_tasks,
        "total_hours": payload.metrics.total_hours,
        "summary": payload.summary,
        "suggestions": json.dumps(payload.suggestions),
        "category_counts": json.dumps(payload.metrics.category_counts),
        "focus_counts": json.dumps(payload.metrics.focus_counts),
    }

    # Wrap text + metadata in a LangChain Document object
    doc = Document(page_content=embed_text, metadata=metadata)

    if vector_store is None:
        # First document ever — create a new FAISS index from scratch
        vector_store = FAISS.from_documents([doc], embeddings)
    else:
        # Add to the existing index
        vector_store.add_documents([doc])

    # Save the updated index to disk so it survives server restarts
    vector_store.save_local(FAISS_INDEX_PATH)
    return {"status": "saved", "message": "Summary stored in vector database."}


# ── Part 2: Search historical summaries ─────────────────────────

@app.post("/search-history")
async def search_history(query: SearchQuery):
    """
    Searches the FAISS vector store using natural language.

    Strategy: The user's query is embedded into a vector,
    then FAISS finds the stored summaries whose vectors are
    most similar (nearest neighbors in vector space).
    We convert the raw L2 distance score into a 0-1 similarity
    score for display in the frontend.
    """

    # Return empty results if no summaries have been saved yet
    if vector_store is None:
        return {"results": []}

    try:
        # similarity_search_with_score returns (Document, score) tuples
        # Lower score = more similar (L2 distance in vector space)
        raw_results = vector_store.similarity_search_with_score(
            query.query,
            k=query.top_k
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

    results = []
    for doc, score in raw_results:
        m = doc.metadata

        # Convert L2 distance to a 0-1 similarity score
        # Formula: 1 / (1 + distance) — higher = more similar
        similarity = float(1 / (1 + score))

        results.append({
            "week_start": m.get("week_start", ""),
            "week_end": m.get("week_end", ""),
            "total_tasks": m.get("total_tasks", 0),
            "total_hours": m.get("total_hours", 0),
            "summary": m.get("summary", ""),
            "suggestions": json.loads(m.get("suggestions", "[]")),
            "category_counts": json.loads(m.get("category_counts", "{}")),
            "focus_counts": json.loads(m.get("focus_counts", "{}")),
            "similarity_score": round(similarity, 3),
        })

    # Sort by similarity score descending (best matches first)
    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    return {"results": results}


# ── Health check ─────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Simple health check endpoint to verify the server is running."""
    index_size = len(vector_store.index_to_docstore_id) if vector_store else 0
    return {
        "status": "ok",
        "vector_store_entries": index_size,
        "anthropic_configured": bool(os.getenv("ANTHROPIC_API_KEY")),
    }


if __name__ == "__main__":
    import uvicorn
    # Run with reload=True for development (auto-restarts on file changes)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)