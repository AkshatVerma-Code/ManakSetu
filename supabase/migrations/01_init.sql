-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    name TEXT,
    email TEXT,
    role TEXT,
    preferred_language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenders table
CREATE TABLE tenders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    original_language TEXT DEFAULT 'en',
    page_count INTEGER,
    status TEXT DEFAULT 'uploaded',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Tender requirements table
CREATE TABLE tender_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
    category TEXT,
    requirement TEXT,
    value TEXT,
    unit TEXT,
    source_text TEXT,
    page_number INTEGER,
    confidence NUMERIC,
    embedding vector(768),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Standards table
CREATE TABLE standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    standard_number TEXT UNIQUE NOT NULL,
    title TEXT,
    department TEXT,
    sector TEXT,
    keywords TEXT[],
    scope_summary TEXT,
    requirement_cues TEXT,
    year INTEGER,
    status TEXT,
    amendments TEXT[],
    supersedes TEXT[],
    source_url TEXT,
    prototype_note TEXT,
    embedding vector(768),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Standard relationships table
CREATE TABLE standard_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_standard_id UUID REFERENCES standards(id) ON DELETE CASCADE,
    target_standard_id UUID REFERENCES standards(id) ON DELETE CASCADE,
    relationship_type TEXT,
    evidence TEXT,
    source_url TEXT
);

-- Recommendations table
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
    standard_id UUID REFERENCES standards(id) ON DELETE CASCADE,
    relevance TEXT,
    reason TEXT,
    matched_requirements JSONB,
    evidence JSONB,
    confidence NUMERIC,
    review_status TEXT DEFAULT 'pending',
    reviewer_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
