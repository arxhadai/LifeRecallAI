-- LifeRecall AI - SQLite Schema
-- Version: 1.0.0
-- Privacy-First, Offline-First, Single User

-- Enable Foreign Keys and WAL mode for concurrency
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ======================================================================================
-- 1. USER PROFILE (Single User)
-- ======================================================================================
CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL DEFAULT 'User',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    preferences_json TEXT DEFAULT '{}' -- Store UI/System preferences (e.g., theme, ignored_apps)
);

-- Initialize default user if not exists
INSERT OR IGNORE INTO user_profile (id, username) VALUES (1, 'User');

-- ======================================================================================
-- 2. CORE ACTIVITIES LOG
-- The central timeline of user behavior.
-- ======================================================================================
CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Temporal Data
    start_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME, -- Null implies currently active or instantaneous event
    duration_seconds INTEGER, -- Calculated by application
    
    -- Classification
    type TEXT NOT NULL CHECK(type IN ('APP', 'URL', 'FILE', 'NOTE', 'TASK')),
    source TEXT NOT NULL, -- App Name (e.g., "Chrome", "VS Code") or "System"
    
    -- Content
    title TEXT, -- Window title, Page title, or Note title
    content TEXT, -- Raw text content (for Notes/Tasks) or Metadata (URL, File Path)
    
    -- Processing Pipeline Status
    is_sensitive BOOLEAN DEFAULT 0, -- If true, content is excluded from AI
    processing_status TEXT DEFAULT 'PENDING' CHECK(processing_status IN ('PENDING', 'PROCESSED', 'FAILED', 'IGNORED')),
    capture_method TEXT DEFAULT 'window_api', -- 'window_api', 'browser_api', 'accessibility', 'fallback'
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Timeline and Filtering
CREATE INDEX IF NOT EXISTS idx_activities_time ON activities(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(processing_status);

-- ======================================================================================
-- 3. CONTENT FTS (Full Text Search)
-- Enables fast offline keyword search over activities
-- ======================================================================================
CREATE VIRTUAL TABLE IF NOT EXISTS activities_fts USING fts5(
    title,
    content,
    content='activities',
    content_rowid='id'
);

-- Triggers to keep FTS in sync with Activities
CREATE TRIGGER IF NOT EXISTS activities_ai AFTER INSERT ON activities BEGIN
  INSERT INTO activities_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
END;
CREATE TRIGGER IF NOT EXISTS activities_ad AFTER DELETE ON activities BEGIN
  INSERT INTO activities_fts(activities_fts, rowid, title, content) VALUES('delete', old.id, old.title, old.content);
END;
CREATE TRIGGER IF NOT EXISTS activities_au AFTER UPDATE ON activities BEGIN
  INSERT INTO activities_fts(activities_fts, rowid, title, content) VALUES('delete', old.id, old.title, old.content);
  INSERT INTO activities_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
END;

-- ======================================================================================
-- 4. USER CONTENT (NOTES & TASKS)
-- Extensions of Activities, but with specific attributes
-- ======================================================================================
-- Notes and Tasks are stored in 'activities' for uniform recall, 
-- but we look them up via 'type' or optional auxiliary tables if structured data grows.
-- For MVP, 'activities' table handles the content. 
-- We add a 'tasks_metadata' table for task-specific state management.

CREATE TABLE IF NOT EXISTS task_metadata (
    activity_id INTEGER PRIMARY KEY,
    is_completed BOOLEAN DEFAULT 0,
    due_date DATETIME,
    priority TEXT DEFAULT 'NORMAL' CHECK(priority IN ('LOW', 'NORMAL', 'HIGH')),
    FOREIGN KEY(activity_id) REFERENCES activities(id) ON DELETE CASCADE
);

-- ======================================================================================
-- 5. AI MEMORY & EMBEDDINGS
-- Stores vector representations and AI-generated summaries
-- ======================================================================================
CREATE TABLE IF NOT EXISTS memory_units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id INTEGER UNIQUE, -- 1:1 map to activity, or NULL if it's a "Daily Summary"
    
    -- Summarization
    summary_text TEXT, -- AI generated summary of the activity/content
    
    -- Vector Data
    embedding_vector BLOB, -- Serialized Float32Array (size depends on model, e.g., 1536 for ada-002)
    model_version TEXT DEFAULT 'text-embedding-3-small',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(activity_id) REFERENCES activities(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_memory_model ON memory_units(model_version);

-- ======================================================================================
-- 6. TOPICS / TAGS (Auto-generated or Manual)
-- ======================================================================================
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_tags (
    activity_id INTEGER,
    tag_id INTEGER,
    is_auto_generated BOOLEAN DEFAULT 1,
    PRIMARY KEY(activity_id, tag_id),
    FOREIGN KEY(activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
