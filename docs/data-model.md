# Data Model & Memory Engineering

## Overview
The Data Model is designed for **high-performance local I/O**, **privacy**, and **seamless recall**. It relies on SQLite as the monolithic store, leveraging its robust ecosystem for both relational data and vector search support (future-proofed for `sqlite-vec` or logical implementation).

## 1. Schema Design Philosophy
*   **Unified Activity Log**: All digital footprints (Apps, Browsing, Notes, Tasks) are treated as `Activities`.
*   **Separation of Concerns**: Raw data (`activities`) is separated from derived intelligence (`memory_units`).
*   **FTS Integration**: Full-Text Search is built-in (`activities_fts`) for instant offline keyword search.
*   **Immutable History**: Activities are append-only logs of user life; editing a note creates a new version or updates the content state (implementation detail managed by app logic).

## 2. Activity Pipeline
1.  **Ingestion**:
    *   Window/Browser events are captured.
    *   Filtered for privacy (Ignored Apps).
    *   Inserted into `activities` with `processing_status = 'PENDING'`.
2.  **Processing**:
    *   Background worker polls 'PENDING' activities.
    *   Text content is prioritized (e.g., Note body, Browser meta description).
    *   **Sanitization**: PII stripped.
    *   **Summarization**: Sent to LLM to generate a concise summary.
    *   **Embedding**: Summary (or raw content if short) sent to Embedding API.
3.  **Storage**:
    *   Summary and Vector stored in `memory_units`.
    *   `processing_status` updated to 'PROCESSED'.

## 3. Memory Units Strategy

### Structure
A "Memory Unit" is the atomic unit of recall. It acts as the bridge between raw raw data and the User's query intent.

| Field | Description |
| :--- | :--- |
| `activity_id` | Foreign key to the raw event. |
| `summary_text` | "User worked on the LifeRecall Architecture document in VS Code." |
| `embedding_vector` | Binary BLOB of generic float32 array (e.g., 1536 dim). |

### Embedding Storage
*   **Format**: Vectors are stored as binary blobs (`Float32Array` serialization) to minimize space and maximize read speed.
*   **Model**: `text-embedding-3-small` (or similar efficient model).
*   **Linkage**: 1:1 relationship with Activities initially. Future support for "Cluster Summaries" (1:N) where multiple small activities (e.g., 20 minutes of browsing Reddit) are aggregated into a single Memory Unit.

## 4. Search & Recall Strategy

### A. Time-Based Recall (Linear)
*   **Query**: "What did I do yesterday?"
*   **Mechanism**: SQL Range Scan on `start_time`.
*   **Display**: Timeline UI.

### B. Semantic Recall (Vector)
*   **Query**: "When was I working on the database schema?"
*   **Mechanism**:
    1.  Embed query string -> `QueryVector`.
    2.  Fetch all/candidate vectors from `memory_units`.
    3.  Compute Cosine Similarity in memory (Node.js) or via efficient SQL extension if available.
    4.  Sort by score desc.
*   **Scale**: For < 100k vectors, brute-force limits in-memory cosine similarity is acceptable (approx < 50ms). For > 100k, we implement an IVFFlat index or similar clustering strategy in JS logic or `sqlite-vec`.

### C. Hybrid Recall (The "Smart" Search)
*   **Logic**:
    1.  Perform FTS5 Keyword search first (Fast, Exact).
    2.  Perform Vector search second (Fuzzy, Conceptual).
    3.  Merge results using Reciprocal Rank Fusion (RRF).
    4.  **Fallback**: If Offline, return FTS5 results only.

## 5. Offline & Privacy Constraints
*   **Offline Fallback**: 
    *   If Internet is down, no new Embeddings/Summaries are generated.
    *   `processing_status` remains 'PENDING'.
    *   Search degrades to **Keyword Only** (FTS5).
*   **Privacy**:
    *   Sensitive flag in `activities` prevents data from leaving the device.
    *   All Vectors are derived from *sanitized* local data.
