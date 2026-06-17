# Core Chat & Model Routing Flow

This document outlines the detailed execution flow of user messages, including model routing evaluations, fallback heuristics, RAG lookups, and citation mapping.

---

## 1. Message Execution Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend (SPA Store)
    participant MR as ModelRuntime (beforeChat / beforeGenerateObject)
    participant Router as ModelRouterService
    participant LarkAPI as Lark Contacts API
    participant RAG as RagService & pgvector
    participant Provider as Google Gemini / Proxy

    U->>FE: Send chat message (Mode: auto/fast/thinking/expert)
    FE->>FE: Get Lark Profile & inject "## USER PROFILE" into system prompt
    FE->>MR: Initiate chat request (POST /api/chat/...)
    MR->>MR: Trigger beforeChat hook

    alt Mode = "auto"
        alt beforeChat (Chat completion)
            MR->>Router: evaluate() (with 30s AbortSignal timeout)
        else beforeGenerateObject (Structured JSON extraction)
            MR->>Router: evaluate() (with 15s AbortSignal timeout)
        end
        Router->>Provider: generateObject() using gemini-2.5-flash-lite (Select Model)
        alt Evaluation Success
            Provider-->>Router: { modelId: "gemini-2.5-flash" }
            Router-->>MR: Return evaluated model
        else Timeout (30s/15s) or API Error
            Router->>Router: resolve() (Execute heuristic analysis)
            Note over Router: 3+ files / >256k tokens -> EXPERT<br/>1-2 files / RAG context / Lark tool / >128k tokens -> THINKING<br/>otherwise -> FAST
            Router-->>MR: Return heuristic model
        end
    else Mode is explicit (fast / thinking / expert)
        MR->>Router: resolve(explicitMode)
        Router-->>MR: Return mapped model (flash-lite / flash / pro)
    }

    Note over MR: Mandatory Upgrade Check:<br/>If "lobe-knowledge-base" tool is active & model is FAST -> force upgrade to THINKING
    MR->>Provider: Forward chat request with finalized model

    alt Chat uses Knowledge Base (RAG)
        Provider->>RAG: Call lobe-knowledge-base tool
        RAG->>Provider: generateEmbedding (gemini-embedding-2-preview, 3072 dims)
        RAG->>RAG: Cosine query on pgvector: USING hnsw (embeddings::halfvec(3072))
        RAG->>RAG: Map R2 files to Lark Wiki URLs using r2ToLarkMapping.ts
        alt Citation mapped (larkUrl exists)
            RAG-->>Provider: Relevant chunks with citationUrl parameters
            Note over Provider: Generate footnotes: [^1]: [Label](larkUrl)
        else Citation unmapped (larkUrl empty)
            RAG-->>Provider: Chunks without citationUrl
            Note over Provider: Generate plain text answers (Hide R2 URLs / DB IDs)
        end
        Provider-->>MR: Return tool result response
    end

    Provider-->>FE: Stream chat response chunks
    FE-->>U: Display formatted markdown text with footnotes
```

---

## 2. Model Routing Resolution Rules

```
                User Request Mode (auto / fast / thinking / expert)
                                       │
                                beforeChat hook
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
        [Explicit Mode]                                 [Auto Mode]
                │                                             │
      Resolve Statically                               1. run evaluate()
      (flash-lite / flash / pro)                          (with 30s/15s timeout)
                │                                             │
                │                                    ┌────────┴────────┐
                │                                    ▼                 ▼
                │                                [Success]          [Failed / Timeout]
                │                                    │                 │
                │                             Use Selected Model       │
                │                                    │                 │
                │                                    │          2. run resolve()
                │                                    │             (Heuristic check)
                │                                    │                 │
                │                                    │        ┌────────┴────────┐
                │                                    │        ▼                 ▼
                │                                    │     [Context Rules]   [Default]
                │                                    │     · >=3 files /     · FAST
                │                                    │       >256k -> EXPERT
                │                                    │     · >=1 file / RAG /
                │                                    │       Lark / >128k -> THINKING
                │                                    │        └────────┬────────┘
                ▼                                    ▼                 ▼
             ┌────────────────────────────────────────────────────────────┐
             │                   Final Candidate Model                    │
             └──────────────────────────────┬─────────────────────────────┘
                                            │
                                            ▼
                              [Mandatory Upgrade Check]
                   Does request contain "lobe-knowledge-base"?
                                            │
                             ┌──────────────┴──────────────┐
                             ▼ (Yes)                       ▼ (No)
                      Is model FAST?                       Keep Model
                             │
                      ┌──────┴──────┐
                      ▼ (Yes)       ▼ (No)
                     Force to      Keep Model
                     THINKING
```

---

## 3. RAG Citation Resolution Flow

```
                        RAG Document Retrieval
                                   │
                     Fetch candidate chunk from R2
                      (local://jemmia-diamond/...)
                                   │
                 Lookup key in R2_TO_LARK_MAP config
                                   │
                 ┌─────────────────┴─────────────────┐
                 ▼ (Match Found)                     ▼ (No Match / Empty URL)
         Assign citationUrl                          Omit citationUrl
                 │                                           │
                 ▼                                           ▼
      Instruct LLM to generate                   Instruct LLM to answer
    footnote: [^1]: [Label](larkUrl)            plain text (No footnotes)
                 │                                           │
                 └─────────────────┬─────────────────────────┘
                                   ▼
                       Stream response to client
            (Cloudflare R2 storage URLs are strictly hidden)
```
