# SIH26108 — AI-Powered Indian Standards Recommendation Engine
## Complete Build Specification + Design System

> **Purpose:** This document is the master implementation specification for an AI-assisted procurement standards recommendation system. It is intended to be given to an AI coding agent to build the prototype.
>
> **Prototype principle:** The system recommends **potentially applicable** Indian Standards based on tender requirements. It must not claim that an AI recommendation is legally mandatory or authoritative. Final applicability/compliance decisions remain with a qualified human/procurement authority and current BIS sources.

---

# 1. Project Overview

## Problem

Government procurement tenders contain detailed technical specifications for products, equipment, materials, construction work, testing, safety, installation and performance.

A tender may:

- explicitly mention some Indian Standards,
- omit standards that may be relevant,
- use technical language without naming an IS standard,
- refer indirectly to testing/material/safety requirements,
- contain references to older or related standards.

Manually identifying all potentially applicable Indian Standards can be time-consuming and inconsistent.

## Proposed Solution

Build an AI-powered web application that accepts a procurement tender/RFP PDF and:

1. Reads the document using OCR/document extraction.
2. Understands the tender using an LLM.
3. Extracts structured technical requirements.
4. Converts requirements into embeddings.
5. Searches a curated Indian Standards knowledge base using Supabase pgvector.
6. Produces candidate standards.
7. Uses Gemini to validate and explain why each candidate may apply.
8. Shows the exact tender evidence supporting each recommendation.
9. Shows related/reference relationships between standards where available.
10. Allows a human reviewer to accept, reject or mark recommendations for verification.
11. Generates a final recommendation report.
12. Supports English/Hindi UI and dynamic translation using Sarvam AI.
13. Provides accessibility controls and browser-based read-aloud.

---

# 2. Core Product Principle

The application is NOT:

    Tender PDF → Gemini → invented IS number

The application IS:

    Tender PDF
        ↓
    OCR/document extraction
        ↓
    Gemini requirement extraction
        ↓
    Structured requirements
        ↓
    Gemini Embedding 2
        ↓
    Supabase pgvector retrieval
        ↓
    Candidate Indian Standards
        ↓
    Gemini validation/reasoning
        ↓
    Evidence + explanation
        ↓
    Human review
        ↓
    Recommendation report

### Critical distinction

**Embedding search finds candidates.**

**Gemini validates and explains candidates.**

The LLM must not be allowed to freely invent standard numbers.

---

# 3. Target Users

Primary:

- Government procurement officers
- Tender/specification preparation teams
- Technical evaluators
- Standards/compliance teams

Secondary:

- Industry procurement teams
- Engineers
- Researchers
- Students/demo judges

---

# 4. MVP Scope

The first working version should focus on:

- PDF tender upload
- OCR/text extraction
- AI requirement extraction
- Curated IS standards database
- Semantic/vector retrieval
- AI validation
- Evidence display
- Recommendation review
- Hindi/English interface
- Accessibility controls
- Recommendation report generation

Do NOT initially build:

- full BIS standards corpus
- legal compliance automation
- automatic certification decisions
- autonomous procurement decisions
- complex multi-agent orchestration
- Neo4j
- LangChain/LangGraph
- Pinecone
- Redis
- Kafka
- separate Python backend
- custom ML model

---

# 5. Technology Stack

## Frontend + Backend

### Next.js

Use Next.js as the main application framework.

Use:

- App Router
- TypeScript
- Server Components where appropriate
- Server Actions/API routes for backend operations
- Tailwind CSS

No separate FastAPI backend is required for the prototype.

---

## Database

### Supabase

Use:

- PostgreSQL
- pgvector
- Supabase Storage
- Supabase Auth if authentication is needed
- Row Level Security where appropriate

Supabase stores:

- users/profiles
- tenders
- extracted requirements
- standards
- embeddings
- relationships
- recommendations
- review decisions

Tender PDFs should be stored in Supabase Storage.

---

# 6. AI Services

## OCR / Document Processing

### Mistral OCR

Use Mistral OCR for scanned/image-heavy PDFs and structured document extraction.

Pipeline:

    PDF
      ↓
    Mistral OCR
      ↓
    Text + page references + tables where available
      ↓
    Gemini

For normal digital PDFs, lightweight PDF text extraction can be attempted first, with Mistral OCR as the OCR/document-processing path.

---

## LLM

### Gemini API

Use Gemini for:

- tender understanding
- requirement extraction
- requirement normalization
- candidate validation
- explanation generation
- evidence selection
- final summary/report generation

All important AI outputs should be structured JSON whenever possible.

---

# 7. Embeddings

### Gemini Embedding 2

Use Gemini Embedding 2 for semantic retrieval.

Recommended prototype configuration:

    output dimensionality: 768

Do not mix embeddings from different embedding models in the same vector space.

Generate embeddings for:

- standard title
- standard scope
- keywords
- requirement cues
- structured tender requirements

A useful embedding text format is:

    STANDARD NUMBER |
    TITLE |
    SECTOR |
    KEYWORDS |
    SCOPE |
    REQUIREMENT CUES

For a new project, use one embedding model consistently and re-embed the complete corpus if the model changes.

---

# 8. Language

### Sarvam AI

Use Sarvam AI for Hindi/English translation of dynamic content where needed.

Supported languages for the MVP:

- English
- Hindi

Do NOT send every static UI label through an API.

Instead:

- keep UI translations locally in language dictionaries,
- use Sarvam for dynamic AI-generated content when translation is needed.

Example:

    English analysis
          ↕
      Sarvam AI
          ↕
    Hindi analysis

---

# 9. Read Aloud

Use the browser Web Speech API / SpeechSynthesis for read-aloud where available.

The user can select:

    🔊 Read Aloud

For English:

    en-IN

For Hindi:

    hi-IN

If browser voice support is unavailable, gracefully disable or hide the unavailable option.

Do not make a separate voice API mandatory for the MVP.

---

# 10. Supabase Database Schema

## profiles

    id
    name
    email
    role
    preferred_language
    created_at

---

## tenders

    id
    filename
    storage_path
    original_language
    page_count
    status
    created_at
    created_by

Possible status values:

    uploaded
    processing
    analyzed
    reviewed
    completed
    failed

---

## tender_requirements

    id
    tender_id
    category
    requirement
    value
    unit
    source_text
    page_number
    confidence
    embedding
    created_at

Example:

    category: safety
    requirement: ingress protection
    value: IP66
    page_number: 17

---

## standards

    id
    standard_number
    title
    department
    sector
    keywords
    scope_summary
    requirement_cues
    year
    status
    amendments
    supersedes
    source_url
    prototype_note
    embedding
    created_at
    updated_at

Important:

`status` should be treated as metadata requiring current verification. Do not assume a prototype status is legally current.

---

## standard_relationships

    id
    source_standard_id
    target_standard_id
    relationship_type
    evidence
    source_url

Possible relationship types:

    normative_reference
    related_standard
    supersedes
    amendment_of
    supporting_standard

Do NOT automatically treat every BIS cross-reference as a normative reference.

---

## recommendations

    id
    tender_id
    standard_id
    relevance
    reason
    matched_requirements
    evidence
    confidence
    review_status
    reviewer_note
    created_at

Possible review statuses:

    pending
    accepted
    rejected
    needs_verification

Important:

`confidence` means AI/retrieval confidence, NOT legal applicability.

---

# 11. Standards Knowledge Base

The prototype should start with a curated dataset rather than attempting to ingest all Indian Standards.

Initial dataset:

    30–50 standards

Target expansion:

    100–250 standards

Focus on procurement-heavy domains such as:

- Civil/construction
- Electrical
- Mechanical/manufacturing
- Water/plumbing
- Food/agriculture
- Medical/health equipment
- Safety
- Accessibility
- Quality/environmental management

The supplied prototype CSV contains an initial curated set.

The dataset should contain:

    standard_number
    title
    department
    sector
    keywords
    scope_summary
    requirement_cues
    year
    status
    amendments
    supersedes
    source_url
    embedding_text

BIS is the authoritative source for verification. The application should link back to official BIS information where possible.

Never represent the prototype CSV as the complete or authoritative BIS database.

---

# 12. Recommended Dataset Strategy

Do not try to create a fake dataset containing every fact known by an LLM.

Instead:

1. Start with a small curated standards dataset.
2. Verify metadata against BIS sources.
3. Add standards by procurement domain.
4. Add relationships only when evidence exists.
5. Generate embeddings from verified metadata.
6. Expand progressively.

The quality of the standards knowledge base is more important than its raw size.

---

# 13. Tender Processing Workflow

## Step 1 — Upload

User uploads a tender PDF.

Store the original file in:

    Supabase Storage

Create a `tenders` record.

---

## Step 2 — Extract

Attempt normal PDF text extraction for text-based PDFs.

If the PDF is scanned or extraction quality is insufficient:

    Mistral OCR

Extract:

- text
- tables
- headings
- page numbers
- relevant document structure

---

## Step 3 — Tender Understanding

Send extracted content to Gemini.

Gemini should return structured requirements.

Example:

```json
{
  "procurement_item": "Outdoor LED Street Lighting System",
  "requirements": [
    {
      "category": "electrical",
      "requirement": "input voltage",
      "value": "230 V AC",
      "source_text": "...",
      "page_number": 12
    },
    {
      "category": "safety",
      "requirement": "ingress protection",
      "value": "IP66",
      "source_text": "...",
      "page_number": 13
    }
  ],
  "explicit_standards": []
}
```

Do not invent missing values.

If a requirement is not present, return null/unknown.

---

# 14. Requirement Categories

Normalize requirements into categories such as:

- product
- material
- dimensions
- capacity
- power
- voltage
- performance
- testing
- safety
- environment
- installation
- durability
- quality
- certification
- packaging
- inspection
- maintenance
- other

---

# 15. Candidate Retrieval

For each important technical requirement:

    requirement text
          ↓
    Gemini Embedding 2
          ↓
    Supabase pgvector
          ↓
    top K standards

Start with:

    K = 5–10

Then combine candidate results across requirements.

Avoid relying on one single cosine similarity score.

---

# 16. Candidate Validation

Pass candidate standards + relevant tender evidence to Gemini.

Ask Gemini to determine:

- Does the standard's scope correspond to the product?
- Does it address the requirement?
- Is it a supporting/test/safety/material standard?
- Is there an explicit tender reference?
- Is the candidate merely semantically similar?
- Is there insufficient evidence?

Return structured JSON:

```json
{
  "standard_number": "IS XXXX:XXXX",
  "relevance": "high",
  "decision": "potentially_applicable",
  "reason": "...",
  "matched_requirements": ["..."],
  "evidence": [
    {
      "page": 13,
      "quote": "..."
    }
  ],
  "needs_verification": true
}
```

Allowed decisions:

    potentially_applicable
    weak_match
    insufficient_evidence

Never return:

    legally_required

unless such a determination is explicitly and independently verified by an authoritative source, and even then display it as sourced information rather than an AI conclusion.

---

# 17. Evidence-First Design

Every recommendation should have an explanation.

Example:

## IS XXXX:XXXX

### Why recommended?

- Product type matches.
- Outdoor application matches.
- IP66 requirement corresponds to the standard's scope/requirements.
- Electrical performance requirement is relevant.

### Tender evidence

Page 13:

> "The luminaire shall have minimum IP66 protection..."

### AI assessment

Potentially applicable.

### Verification

Current BIS status should be verified before procurement use.

This evidence-first design is a core differentiator.

---

# 18. Related Standards / Reference Graph

For each accepted candidate:

    Primary standard
          ↓
    related/reference standards

Example:

    Primary IS
       │
       ├── Testing Standard
       ├── Safety Standard
       ├── Material Standard
       └── Installation Standard

Use PostgreSQL relationships for the prototype.

Use React Flow for visualization.

Do not introduce Neo4j unless the relationship graph becomes large enough to justify it.

---

# 19. Human Review

The AI must not make the final procurement decision.

Each recommendation has:

    [ Accept ]
    [ Reject ]
    [ Needs Verification ]

Reviewer can add a note.

Example:

    Reviewer note:
    "Verify current BIS edition before final tender issue."

This makes the application decision-support software rather than an autonomous legal/compliance system.

---

# 20. Main UI Workflow

Keep the product to approximately five major screens.

## Screen 1 — Dashboard

Minimal government-style landing page.

Content:

    Government of India | Standards Intelligence System

    Indian Standards Recommendation Engine

    Upload Tender / RFP PDF

    [ Upload Document ]

    [ Start Analysis ]

Additional:

    Accessibility
    A-
    A
    A+
    Contrast
    English | हिन्दी
    Help

---

## Screen 2 — Tender Analysis

Display:

    Tender name
    Number of pages
    Procurement item
    Extracted technical requirements
    Existing IS references
    Processing status

Example:

    Product:
    LED Street Lighting System

    Key Requirements:
    Power: 90 W
    Input: 230 V AC
    IP Rating: IP66
    Installation: Outdoor

Button:

    View Recommended Standards

---

## Screen 3 — Recommendations

Display cards/table rows:

    IS XXXXX:XXXX
    Title

    Relevance: High

    ✓ Product match
    ✓ Requirement match
    ✓ Scope match

    [ View Evidence ]

    [ View Standard ]

Do not display a misleading percentage such as:

    "97% legally applicable"

Use:

    High relevance
    Medium relevance
    Low relevance

And:

    AI recommendation — requires technical/BIS verification

---

## Screen 4 — Evidence + Relationships

Two-panel design:

Left:

    Tender Evidence

Right:

    Standard Details

Bottom/side:

    Related Standards Graph

Allow clicking nodes.

---

## Screen 5 — Review + Report

Summary:

    Standards identified: 5
    Accepted: 3
    Rejected: 1
    Needs verification: 1

Buttons:

    [ Generate Report ]

Output:

    PDF
    DOCX

---

# 21. Final Report Structure

Generated report:

1. Tender Information
2. Executive Summary
3. Extracted Technical Requirements
4. Existing IS References
5. Recommended Indian Standards
6. Reason for Each Recommendation
7. Tender Evidence
8. Related Standards
9. Standards Requiring Verification
10. Human Review Decisions
11. Source Links
12. Disclaimer

The report should clearly distinguish:

    AI recommendation
    Source evidence
    Human review
    Official verification

---

# 22. UI Design Philosophy

The visual direction should be:

    Government portal
        +
    modern enterprise software
        +
    accessibility-first
        +
    minimal AI interface

Avoid:

- neon gradients
- excessive glassmorphism
- huge animated hero sections
- unnecessary 3D effects
- excessive rounded cards
- chatbot-style UI as the main interface
- decorative animations

The application should feel credible, calm and official.

---

# 23. design.md

## Theme

### Primary

Deep Navy:

    #12355B

Use for:

- header
- primary buttons
- important headings
- active navigation

### Secondary

Government Blue:

    #1A5FB4

Use for:

- links
- secondary actions
- selected states

### Background

    #F7F8FA

### Surface

    #FFFFFF

### Text

Primary:

    #17202A

Secondary:

    #5B6573

### Border

    #D9DEE5

### Status

Success:

    #18794E

Warning:

    #A15C00

Danger:

    #B42318

Do not rely on color alone. Every status must also have:

- icon
- text
- accessible label

---

# 24. Typography

Use a highly readable sans-serif.

Preferred:

    Inter

Fallback:

    system-ui, sans-serif

Headings:

    font-weight: 600–700

Body:

    14–16px

Small metadata:

    12–13px

Do not use decorative fonts.

---

# 25. Layout

Maximum content width:

    1200–1280px

Desktop:

    left content area
    optional right evidence panel

Mobile:

    single column

Spacing:

    generous but compact

Avoid filling every pixel.

---

# 26. Components

Create reusable components:

    Header
    AccessibilityBar
    LanguageSwitcher
    UploadZone
    ProcessingStatus
    RequirementTable
    RequirementBadge
    StandardCard
    StandardTable
    RelevanceBadge
    EvidencePanel
    SourceCitation
    RelationshipGraph
    ReviewActions
    ReportSummary
    EmptyState
    ErrorState
    LoadingState
    Toast
    Modal

---

# 27. Accessibility

Implement:

- keyboard navigation
- visible focus outlines
- semantic HTML
- ARIA labels where necessary
- accessible tables
- sufficient contrast
- scalable text
- screen-reader-friendly controls
- no color-only information
- reduced-motion support
- clear error messages
- accessible upload control

Accessibility bar:

    A-
    A
    A+
    Contrast
    Read Aloud
    English | हिन्दी

---

# 28. Responsive Behavior

Desktop:

    1200px+

Tablet:

    768–1199px

Mobile:

    <768px

The application must remain usable on a 13-inch laptop and common government-office desktop monitors.

---

# 29. Navigation

Keep navigation minimal:

    Dashboard
    My Analyses
    Standards
    Help

Do not create unnecessary pages.

---

# 30. Authentication

For the prototype:

Option A:

    Supabase Auth

Roles:

    reviewer
    admin

But authentication should not block the core demo unnecessarily.

If authentication is implemented, enforce RLS so users cannot access other users' private tender documents.

---

# 31. Security

Never expose secret API keys in browser/client code.

Store:

    GEMINI_API_KEY
    MISTRAL_API_KEY
    SARVAM_API_KEY
    SUPABASE_SERVICE_ROLE_KEY

only in server-side environment variables.

The browser should never receive service-role keys.

Use signed/private Supabase Storage access for tender files where appropriate.

Validate:

- file type
- file size
- upload ownership
- API inputs
- generated JSON

---

# 32. Environment Variables

Example:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

GEMINI_API_KEY=
MISTRAL_API_KEY=
SARVAM_API_KEY=
```

Never commit `.env.local`.

Create `.env.example`.

---

# 33. Suggested Next.js Structure

```text
app/
  page.tsx
  dashboard/
    page.tsx
  analysis/
    [id]/
      page.tsx
  standards/
    page.tsx
  api/
    upload/
      route.ts
    ocr/
      route.ts
    analyze/
      route.ts
    embed/
      route.ts
    recommendations/
      route.ts
    translate/
      route.ts
    report/
      route.ts

components/
  layout/
  accessibility/
  upload/
  tender/
  standards/
  evidence/
  graph/
  review/
  report/

lib/
  supabase/
  ai/
    gemini.ts
    embeddings.ts
    prompts.ts
  ocr/
    mistral.ts
  language/
    sarvam.ts
  retrieval/
    standards.ts
    vector-search.ts
  validation/
    recommendations.ts
  report/
    generator.ts

types/
  tender.ts
  standard.ts
  recommendation.ts

data/
  prototype/

public/
```

---

# 34. AI Prompt Principles

All prompts must:

1. Be explicit.
2. Require JSON output where appropriate.
3. Say "do not invent information."
4. Preserve page numbers/source evidence.
5. Distinguish unknown from absent.
6. Distinguish recommendation from legal requirement.
7. Require evidence for important claims.

Example requirement extraction instruction:

```text
You are a procurement technical-analysis assistant.

Analyze the supplied tender.

Extract only requirements explicitly present in the document.

Do not invent specifications.

For every extracted requirement return:
- category
- requirement
- value
- unit
- source_text
- page_number

If a value is not stated, return null.

Return valid JSON only.
```

---

# 35. Recommendation Prompt Principles

```text
You are validating candidate Indian Standards against a procurement tender.

You have:
1. Tender requirements.
2. Tender evidence.
3. Candidate standard metadata.

Do not invent standards.

Do not claim legal applicability.

For each candidate:
- determine whether the scope matches,
- identify matching requirements,
- identify supporting evidence,
- explain the relationship,
- identify uncertainty.

Use:
potentially_applicable
weak_match
insufficient_evidence

If evidence is insufficient, say so.
```

---

# 36. Retrieval Strategy

Do not perform only one search.

Use multiple requirement groups:

    Product
    Material
    Performance
    Safety
    Testing
    Installation

Retrieve candidates for each.

Then deduplicate.

Example:

    Product search → IS A, IS B
    Safety search → IS B, IS C
    Testing search → IS D, IS C

Combined:

    A
    B
    C
    D

Then validate.

---

# 37. Ranking Logic

Use retrieval score only as an input.

Final recommendation should consider:

    semantic similarity
    +
    scope match
    +
    product match
    +
    requirement match
    +
    evidence
    +
    relationship evidence
    +
    status metadata

Do not present the internal score as legal applicability.

---

# 38. Handling Standard Versions

A standard may have:

- revisions
- amendments
- superseding standards
- withdrawn/superseded status
- reaffirmation/review information

The prototype should display:

    Edition / year
    Status
    Amendment information
    Supersedes

But if current status is not verified:

    ⚠ Current BIS status requires verification

Do not automatically label an old standard "current."

---

# 39. BIS Source Strategy

Use official BIS resources for verification and metadata.

Useful BIS areas include:

- Know Your Standards
- Standards portal
- Compendium of Indian Standards
- BIS standard records
- official BIS catalogues/booklets

The system should link to official BIS sources.

Do not assume unrestricted access to or redistribution of the full text of every BIS standard.

The prototype knowledge base should primarily store metadata, scope summaries, keywords and evidence rather than copying an entire copyrighted standard corpus.

---

# 40. Prototype Dataset

Use the supplied:

    indian_standards_prototype.csv

Import it into Supabase.

Then:

1. create the `standards` table,
2. import CSV,
3. generate `embedding_text`,
4. create embeddings,
5. store vectors in pgvector.

Do not hard-code the standards into frontend components.

---

# 41. Supabase Vector Search

Implement a PostgreSQL RPC function for similarity search.

Conceptually:

```sql
match_standards(
    query_embedding,
    match_threshold,
    match_count
)
```

Return:

    standard_id
    standard_number
    title
    scope
    similarity

Use pgvector cosine distance/similarity.

The exact SQL should be generated according to the installed pgvector version.

---

# 42. Processing States

The UI must clearly show:

    Uploading
    Extracting
    Understanding
    Searching Standards
    Validating
    Preparing Results
    Complete

If a stage fails:

    "We could not complete this step."

Show a retry action.

Do not display technical stack traces to users.

---

# 43. Error Handling

Possible errors:

- invalid PDF
- oversized file
- OCR failure
- Gemini failure
- embedding failure
- Supabase failure
- translation failure
- report generation failure

The system should preserve already completed processing where possible.

Example:

If translation fails, English analysis should still be available.

---

# 44. Demo Flow

Use one realistic public procurement tender.

Recommended demo sequence:

1. Open dashboard.
2. Upload tender.
3. Show OCR/analysis progress.
4. Show extracted technical requirements.
5. Show candidate standards.
6. Open evidence.
7. Show related standards.
8. Accept/reject recommendations.
9. Generate report.
10. Switch to Hindi.
11. Demonstrate read-aloud.

Target demo duration:

    2–4 minutes

The judge should understand the value without needing a technical explanation first.

---

# 45. Example Demo

Tender contains:

    Outdoor LED street lights
    90W
    230V AC
    IP66
    aluminium housing
    electrical testing
    photometric testing

System extracts those requirements.

Retrieval finds relevant lighting/electrical/testing standards from the knowledge base.

Gemini validates each candidate.

The interface shows:

    Product match ✓
    Requirement match ✓
    Scope match ✓
    Tender evidence ✓

Then:

    Related/testing standards

Finally:

    Recommendation Report

The system does NOT say:

    "These standards are legally mandatory."

It says:

    "These standards were identified as potentially applicable based on the supplied tender requirements. Verify current BIS status and applicability before final procurement use."

---

# 46. What Makes the Project Different

The differentiator is NOT:

    "We use Gemini."

The differentiator is:

### Tender-to-Standards Intelligence

The system connects:

    Tender language
        ↓
    Technical requirements
        ↓
    Indian Standards
        ↓
    Evidence
        ↓
    Related/reference standards
        ↓
    Human review

The user can see why a standard was suggested.

---

# 47. Optional Future Features

Do not build these in the first MVP, but architect so they can be added:

- larger BIS knowledge base
- more Indian languages
- automated standard version checking
- government procurement portal ingestion
- normative reference graph
- amendment alerts
- tender-to-tender comparison
- specification completeness checks
- certification information
- audit logs
- organization-level dashboards

---

# 48. Non-Goals

The prototype is not:

- a legal compliance engine
- a replacement for BIS
- an autonomous procurement decision-maker
- a complete copy of the BIS standards database
- a system that guarantees legal applicability
- a general-purpose chatbot

---

# 49. Development Order

Build in this order.

## Phase 1

    Next.js project
    ↓
    Tailwind
    ↓
    Supabase
    ↓
    Upload UI
    ↓
    Tender storage

## Phase 2

    PDF extraction
    ↓
    Mistral OCR
    ↓
    Tender text

## Phase 3

    Gemini requirement extraction
    ↓
    Requirements UI

## Phase 4

    Standards table
    ↓
    Gemini Embedding 2
    ↓
    pgvector
    ↓
    Candidate retrieval

## Phase 5

    Gemini validation
    ↓
    Recommendation cards
    ↓
    Evidence panel

## Phase 6

    Relationships
    ↓
    React Flow graph

## Phase 7

    Human review
    ↓
    Report generation

## Phase 8

    Hindi
    ↓
    Sarvam AI
    ↓
    Read Aloud
    ↓
    Accessibility

---

# 50. Definition of Done

The MVP is complete when a user can:

1. Open the application.
2. Upload a tender PDF.
3. See successful processing.
4. See extracted technical requirements.
5. See relevant standards from Supabase.
6. See why each standard was recommended.
7. See tender evidence.
8. See related standards.
9. Accept/reject/verify recommendations.
10. Switch English/Hindi.
11. Use read-aloud.
12. Generate a recommendation report.
13. Download the report.
14. Use the application with keyboard/accessibility controls.

---

# 51. Final Architecture

```text
                         USER
                          │
                          ▼
                 ┌─────────────────┐
                 │     NEXT.JS     │
                 │                 │
                 │ Government UI   │
                 │ Hindi / English │
                 │ Accessibility   │
                 └────────┬────────┘
                          │
             ┌────────────┼─────────────┐
             │            │             │
             ▼            ▼             ▼
         Supabase      Mistral        Gemini
         Storage         OCR            AI
             │            │             │
             │            ▼             │
             │       Tender Text        │
             │                          │
             │                    Requirement
             │                      Extraction
             │                          │
             │                          ▼
             │                   Gemini Embedding 2
             │                          │
             └──────────────────────────┤
                                        ▼
                               Supabase pgvector
                                        │
                                        ▼
                                Candidate Standards
                                        │
                                        ▼
                                  Gemini Validation
                                        │
                              ┌─────────┴─────────┐
                              ▼                   ▼
                           Evidence          Relationships
                              │                   │
                              └─────────┬─────────┘
                                        ▼
                                  Human Review
                                        │
                                        ▼
                                   Final Report
                                        │
                                  ┌─────┴─────┐
                                  ▼           ▼
                                 PDF         DOCX


                 ┌──────────────────────────┐
                 │       SARVAM AI          │
                 │    English ↔ Hindi       │
                 └──────────────────────────┘

                 Browser SpeechSynthesis
                         ↓
                    Read Aloud
```

---

# 52. Final Technology Decision

LOCKED MVP STACK:

    Next.js + TypeScript
    Tailwind CSS
    Supabase
    PostgreSQL
    pgvector
    Supabase Storage
    Mistral OCR
    Gemini API
    Gemini Embedding 2
    Sarvam AI
    React Flow
    Browser SpeechSynthesis

Do not introduce another backend or vector database unless a real requirement appears.

---

# 53. Instructions to the Coding Agent

Build the application according to this specification.

Priorities:

1. Working end-to-end flow.
2. Correct data flow.
3. Evidence-backed recommendations.
4. Clean database architecture.
5. Minimal government-style UI.
6. Accessibility.
7. Hindi/English.
8. Reliable error handling.
9. Maintainable code.
10. Demo readiness.

Before implementing a feature, check whether it is explicitly required by this specification.

Do not:

- invent APIs,
- invent BIS standards,
- invent standard metadata,
- expose API keys,
- claim legal applicability,
- add unnecessary infrastructure,
- create fake AI confidence,
- make the interface look like a generic AI chatbot.

If a standard's applicability cannot be established from the available metadata/evidence, show:

    "Insufficient evidence — verification required."

The application should always prefer a transparent uncertain result over an invented confident result.

---

# 54. Product One-Liner

**An AI-powered procurement assistant that analyzes tender requirements and identifies potentially applicable Indian Standards with evidence, related-standard intelligence and human review.**

---

# 55. Short Pitch

Government procurement specifications can contain hundreds of technical requirements, while relevant Indian Standards may not always be explicitly mentioned.

This system uses OCR, semantic retrieval and generative AI to understand tender requirements, identify potentially applicable Indian Standards from a curated knowledge base, explain the evidence behind each recommendation, surface related standards and help procurement officers review the results before generating a final report.

The goal is not to replace expert or BIS verification, but to make standards discovery faster, more transparent and easier to review.
