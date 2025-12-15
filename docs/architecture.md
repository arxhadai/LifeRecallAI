# LifeRecall AI - System Architecture

## Overview
**LifeRecall AI** is a privacy-first, offline-first desktop application designed to act as a personal memory aid. It leverages local activity logging, task management, and AI-powered summarization to help users recall their digital footprint without compromising their data sovereignty.

## Core Technology Stack
-   **Platform**: Electron (Desktop container)
-   **Frontend**: React (User Interface)
-   **Backend**: Node.js (Electron Main Process & IPC)
-   **Database**: SQLite (Local, offline storage)
-   **AI Engine**: OpenAI API (Strictly for processing; no training/retention)

---

## Module Definitions

### 1. Activity Logger (Backend Service)
*   **Responsibility**: Silently captures granular desktop events.
*   **Components**:
    *   `WindowMonitor`: Tracks active window titles and process names.
    *   `FileAccessMonitor`: Tracks file open/modify events (filtered by user preferences).
    *   `BrowserMonitor`: Captures URL visits (via browser extensions or accessibility APIs, subject to feasibility).
*   **Constraints**:
    *   **NO** Keystroke logging.
    *   **NO** Screen recording/screenshots.
    *   Ignores "Private/Incognito" windows.

### 2. Local Database Layer (SQLite)
*   **Responsibility**: The single source of truth for all persistent data.
*   **Schema Overview**:
    *   `Activities`: Timestamp, Type (App, URL, File), Source, Content/Metadata.
    *   `Notes`: ID, Content, CreatedAt, Tags.
    *   `Tasks`: ID, Description, Status, DueDate.
    *   `Embeddings`: Vector representations of activities/notes for semantic search.
*   **Privacy**: Database file (`liferecall.sqlite`) resides strictly on the user's local filesystem.

### 3. AI Memory Engine
*   **Responsibility**: Processes raw data into meaningful summaries and generates vector embeddings.
*   **Workflow**:
    1.  **Ingestion**: Raw activities are batched.
    2.  **Sanitization**: PII (Personally Identifiable Information) scrubbing patterns applied locally before API transmission.
    3.  **Summarization/Embedding**: Sanitized text sent to OpenAI API.
    4.  **Storage**: Returned vectors/summaries stored locally.

### 4. Search & Recall Engine
*   **Responsibility**: Handles user queries against the local dataset.
*   **Logic**:
    *   **Keyword Search**: Direct SQL `LIKE` / FTS5 queries for exact matches.
    *   **Semantic Search**: Converts user query to vector (via API) -> Cosine similarity search against local `Embeddings` table.

### 5. Task & Notes Manager
*   **Responsibility**: CRUD operations for user-generated content.
*   **Integration**: Notes and tasks are treated as "Activities" for the purpose of AI recall (e.g., "What did I write about X last week?").

### 6. UI Layer (React + Renderer)
*   **Responsibility**: Presenting data and capturing user intent.
*   **Components**:
    *   `TimelineView`: Chronological feed of activities.
    *   `RecallBar`: Chat-like interface for natural language queries.
    *   `Dashboard`: High-level metrics (time spent, tasks due).
*   **Communication**: Communicates with Backend via Electron IPC (Inter-Process Communication).

---

## Data Flow

### A. Activity Ingestion Pipeline
1.  **Capture**: `Activity Logger` detects an event (e.g., "Switched to VS Code").
2.  **Filter**: Checks against exclusion list (e.g., "Password Manager", "Private Tab").
3.  **Persist**: Write raw event to `SQLite` immediately.

### B. The "Recall" Loop (AI Processing)
1.  **Trigger**: Scheduled background job or manual user query.
2.  **Fetch**: Retrieve recent *unprocessed* activities from `SQLite`.
3.  **Sanitize**: Local regex/heuristic pass to mask sensitive patterns (emails, credit card numbers).
4.  **External Call**: Send sanitized text to OpenAI API for Embedding/Summarization.
5.  **Response Handling**: Receive vectors/summary -> Update `SQLite`.

### C. User Query Flow
1.  **Input**: User types "What document was I working on yesterday morning?"
2.  **Vectorization**: Query sent to OpenAI to get query vector.
3.  **Local Search**: Vector comparison against local SQLite `Embeddings`.
4.  **Refinement**: Top K results retrieved.
5.  **Synthesis (Optional)**: Results sent back to LLM to generate a natural language answer.
6.  **Display**: Answer shown to user.

---

## Privacy & Security Boundaries

### Local Boundary (Safe Zone)
*   **All Raw Data**: Full activity logs, notes, and tasks exist **ONLY** here.
*   **Database**: Encrypted at rest (optional, using SQLCipher if high security needed).

### External Boundary (The Air Gap)
*   **Transmitted Data**:
    *   Only *sanitized* text snippets for summarization.
    *   Only *search queries* for vectorization.
*   **Never Transmitted**:
    *   Raw file contents.
    *   Passwords/Credentials.
    *   Full browsing history dumps.
*   **API Policy**: OpenAI configured with `nologs` (Zero Data Retention) policy where applicable.

---

## Error Handling & Fallbacks

1.  **Network Offline**:
    *   **Activity Logging**: Continues uninterrupted (Local DB).
    *   **Search**: Falls back to Keyword Search (SQL-based) if API is unreachable for semantic search.
    *   **AI Processing**: Queues items for later processing when online.

2.  **API Failure**:
    *   Graceful degradation: "AI features temporarily unavailable."
    *   Retry with exponential backoff for background jobs.

3.  **Database Corruption**:
    *   Daily auto-backups of `liferecall.sqlite`.
    *   Startup integrity check -> Alert user if repair needed.

---

## AI Invocation Strategy

| Feature | Using AI? | Trigger |
| :--- | :--- | :--- |
| **Activity Logging** | NO | Continuous Background |
| **Data Storage** | NO | Immediate Write |
| **Text Summarization** | YES | Periodic Batch / On-Save |
| **Semantic Search** | YES | User Query |
| **Keyword Search** | NO | User Query Fallback |

