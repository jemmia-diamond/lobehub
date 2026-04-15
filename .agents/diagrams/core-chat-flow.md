# Core Chat Flow — User Message to Response

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend (SPA)
    participant tRPC as tRPC Lambda
    participant MR as ModelRuntime (beforeChat hook)
    participant Router as ModelRouterService
    participant Proxy as aiproxy.jemmia.vn
    participant KB as Knowledge Base Tool
    participant WB as Web Browsing Tool
    participant Gemini as Gemini API

    U->>FE: Send message (with selected mode: auto/fast/thinking)
    FE->>tRPC: aiChat.sendMessageInServer { agentId, topicId, message }
    tRPC->>tRPC: Validate agentId + topicId exist in DB
    tRPC->>tRPC: Create user message + assistant placeholder in DB
    tRPC-->>FE: { userMessageId, assistantMessageId }

    FE->>Proxy: POST /webapi/chat/jemmia (streaming)
    Proxy->>MR: initModelRuntimeFromDB → beforeChat hook

    alt mode = "auto"
        MR->>Router: evaluate() with 15s timeout
        Router->>Gemini: generateObject (flash-lite) — pick model
        alt evaluate succeeds
            Gemini-->>Router: { modelId: "gemini-2.5-flash" }
            Router-->>MR: model selected
        else timeout or error
            Router->>Router: resolve() — static heuristics
            Note over Router: tokens/files/KB → pick tier
            Router-->>MR: model selected
        end
    else mode = "fast"
        MR->>Router: resolve(mode="fast") → gemini-2.5-flash-lite
    else mode = "thinking"
        MR->>Router: resolve(mode="thinking") → gemini-2.5-flash
    end

    MR->>Proxy: Forward chat request with resolved model
    Proxy->>Gemini: Stream chat completion

    alt Agent has KB tool enabled
        Gemini->>KB: knowledge-base search (RAG)
        KB->>KB: Embed query (gemini-embedding-2-preview, 3072 dims)
        KB->>KB: Cosine similarity search in pgvector
        KB-->>Gemini: Relevant chunks (NO R2 URL citations)
    end

    alt KB returns no results OR web browsing tool active
        Gemini->>WB: crawlSinglePage / crawlMultiPages (R2 fallback KB)
        WB->>WB: Fetch R2 markdown files
        WB-->>Gemini: File content
        Note over Gemini: Cite R2 URLs in footnotes → maps to Lark wiki
    end

    Gemini-->>FE: Stream response chunks
    FE->>FE: Render markdown + resolve R2→Lark URLs
    FE-->>U: Display streamed response
    FE->>tRPC: message.update (save final content)
```

## Mode Decision Logic

```
payload.model = "auto" / "fast" / "thinking" / "expert"
                    ↓
            beforeChat hook
                    ↓
    ┌───────────────────────────────┐
    │ auto                          │
    │  1. evaluate() [15s timeout]  │
    │     → LLM picks model         │
    │  2. fallback: resolve()       │
    │     → static heuristics       │
    │     · 3+ files / >256k → pro  │
    │     · KB/RAG/Lark → flash     │
    │     · default → flash-lite    │
    ├───────────────────────────────┤
    │ fast    → gemini-2.5-flash-lite│
    │ thinking→ gemini-2.5-flash    │
    │ expert  → gemini-2.5-pro      │
    └───────────────────────────────┘
```

## KB vs Web Browsing (R2 Fallback)

```
User query
    ↓
KB Tool (knowledge-base) ──→ Indexed local markdown (pgvector 3072d)
    │                         No R2 URL citations in response
    │ if no results / rate limit
    ↓
Web Browsing Tool ──────────→ Crawls R2 URLs directly
                              Cites R2 URLs → getLarkUrlForR2() → Lark wiki
```
