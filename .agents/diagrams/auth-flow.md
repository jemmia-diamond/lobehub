# Authentication & Access Control Flow

This document describes the sequence of authentication and role/access verification for traditional login, Lark SSO, Lark Silent Login, and Beta Whitelist checks.

---

## 1. Silent Login Flow (Inside Lark WebView)

This flow triggers automatically when a user opens the Brainy workspace within the Lark mobile or desktop client:

```mermaid
sequenceDiagram
    participant U as User (Lark App)
    participant FE as Frontend (Lark WebView)
    participant LS as Lark Silent Route (/api/auth/lark-silent)
    participant Lark as Lark Open API
    participant US as UserService
    participant DB as PostgreSQL

    U->>FE: Open Brainy inside Lark Client
    FE->>FE: useLarkSilentLogin hook triggers
    FE->>Lark: Request Lark authorization code via JS-SDK
    Lark-->>FE: Return auth code
    FE->>LS: POST /api/auth/lark-silent { code }
    LS->>Lark: POST /app_access_token/internal (Get App Token)
    Lark-->>LS: { app_access_token }
    LS->>Lark: POST /authen/v1/oidc/access_token (Exchange code)
    Lark-->>LS: { access_token, refresh_token }
    LS->>Lark: GET /authen/v1/user_info
    Lark-->>LS: { open_id, email, enterprise_email, name, avatar_url }
    LS->>DB: Query account where provider='lark' & accountId=open_id
    alt User does not exist (Registration)
        LS->>DB: Insert new user (save email & enterpriseEmail)
        LS->>US: initUser(newUser)
        US->>US: Check whitelists (ADMIN_EMAILS, ALPHA_WHITE_LIST_EMAILS, BETA_WHITE_LIST_EMAILS)
        US->>DB: Update user role (admin, alpha, beta, or user)
        LS->>DB: Insert account (store tokens)
    else User exists (Login)
        LS->>DB: Update account (store new access/refresh tokens)
    end
    LS->>DB: Create session record
    LS-->>FE: Set session cookie & return { success: true }
    FE-->>U: Grant access and render home dashboard
```

---

## 2. Beta Access Check Flow (Middleware Verification)

If `APP_BETA_MODE=true` is set in the environment, the Next.js middleware verifies that every session is whitelisted before serving requests:

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant FE as Frontend SPA
    participant MW as Next.js Middleware (define-config.ts)
    participant BA as Better-Auth Client
    participant DB as PostgreSQL

    U->>FE: Request protected route (e.g. /home)
    FE->>MW: Forward request
    MW->>BA: auth.api.getSession(headers)
    BA->>DB: Verify session token
    DB-->>BA: Return user session profile
    alt No active session
        BA-->>MW: { session: null }
        MW-->>U: Redirect to /signin?callbackUrl=...
    else Active session found
        MW->>MW: Get user.email & user.enterpriseEmail
        MW->>MW: Check whitelists (ADMIN_EMAILS + BETA_WHITE_LIST_EMAILS)
        alt Email or Enterprise Email matches whitelist
            MW-->>FE: Rewrite to SPA/App Router variant and allow access
        else Not whitelisted
            MW-->>U: Redirect to /beta-access (Shows lock screen)
        end
    end
```

---

## 3. Traditional OAuth & Password flows

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend SPA
    participant BA as Better-Auth Server (/api/auth)
    participant DB as PostgreSQL
    participant Lark as Lark OAuth Gateway

    alt Traditional Login
        U->>FE: Enter email -> click Next
        FE->>BA: POST /api/auth/check-user { email }
        BA->>DB: Query user by email
        BA-->>FE: { exists: true, hasPassword: true }
        U->>FE: Enter password -> submit
        FE->>BA: POST /api/auth/sign-in/email
        BA->>DB: Verify password hash
        BA->>DB: Create session
        BA-->>FE: Set session cookie
        FE-->>U: Redirect to home / callbackUrl

    else Interactive Lark SSO
        U->>FE: Click "Login with Lark"
        FE->>BA: GET /api/auth/oauth2/authorize/lark
        BA-->>U: Redirect to Lark OAuth Gateway
        U->>Lark: Authorize application scopes
        Lark-->>BA: Callback with code
        BA->>Lark: Exchange code for token
        BA->>DB: Upsert user, update account, and create session
        BA-->>U: Redirect to home with session cookie
    end
```
