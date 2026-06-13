---
name: upstream-sync
description: Safely sync and cherry-pick bugfixes from upstream repositories into heavily customized hard forks without breaking core architectural deviations.
---

# Upstream Sync Strategy for Customized Forks

This skill defines a standardized methodology for synchronizing heavily customized or "hard forked" repositories with their upstream parent. Blanket merges (`git pull upstream main`) are dangerous and highly discouraged in these environments, as they often destroy local architectural deviations and business logic.

Instead, we use a **Selective Batch Cherry-Picking Strategy**.

## 1. Context & Architecture Discovery

Before pulling upstream changes, you must establish the architectural boundaries of the current project by reading its foundational documentation (e.g., `README.md`, `AGENTS.md`, or architecture diagrams).

Identify the following constraints:

- **Protected UI/UX**: Which UI components, layouts, or branding elements have been custom-built? (Upstream UI fixes will almost always conflict and should generally be skipped to avoid overwriting custom designs).
- **Disabled/Removed Features**: Which upstream features have been intentionally removed or disabled? (Commits touching these areas must be skipped).
- **Custom Integrations**: What core modules (e.g., Auth, Database, Storage) use custom implementations instead of upstream defaults? (Changes here require careful evaluation).
- **Protected Configurations**: Environment variables, language locales, and port bindings are often project-specific.

## 2. The Universal Sync Workflow

Follow this step-by-step process when tasked with syncing upstream bugfixes:

### Step 1: Isolate the Commits

Identify commits in the upstream branch (`FETCH_HEAD` or similar) that are not yet in the local branch, specifically filtering for bugfixes.

```bash
git log HEAD..FETCH_HEAD --oneline | grep -i "fix"
```

_Note: To identify un-cherry-picked commits effectively, compare exact titles and PR numbers, as cherry-picking alters commit hashes._

### Step 2: Categorize & Triage

Group the commits by domain and evaluate them against the project's custom constraints:

1.  **Core Runtime & Stability**: `ACCEPT`. Fixes to underlying logic, APIs, and critical performance usually remain compatible and should be cherry-picked.
2.  **Customized Integrations**: `EVALUATE`. If the commit touches an area the fork has customized (e.g., a custom auth flow), do not blindly merge. Manually evaluate the AST changes to see if they apply.
3.  **UI & State**: `SKIP`. Unless it is a massive blocker, avoid cherry-picking UI state or layout fixes. They frequently cause heavy conflicts with custom UI.
4.  **Disabled Features**: `SKIP`. Commits touching deleted or disabled features should always be ignored.

### Step 3: Sequential Batch Cherry-Picking

Do not cherry-pick all commits at once. Pick them in small, logically related batches (e.g., 10-15 commits at a time) to prevent cascading failures:

```bash
git cherry-pick <hash1> <hash2> ...
```

### Step 4: Resolving Conflicts Intelligently

If a cherry-pick causes a conflict:

- **UI/Config Conflicts**: If the upstream fix touches highly customized files, prefer the local version: `git checkout --ours <file>`.
- **Modify/Delete Conflicts**: When upstream modifies a file that the fork deleted, it usually means the feature is dead code in the fork. Use `git rm <file>` to resolve it, ensuring we don't accidentally resurrect dead code.
- **Logic Conflicts**: If the conflict is in core logic, read both versions. Preserve the _intent_ and _business logic_ of the local version while carefully adapting the _syntax_ or _bugfix_ of the upstream changes. Never blindly accept upstream's architecture changes if they break local workflows.
- **Unresolvable/Heavy Conflicts**: If the commit is too entangled with upstream architecture, abort it: `git cherry-pick --skip`.

### Step 5: Type Safety & Feature Exclusion (CRITICAL)

After cherry-picking, you MUST run strict type checks:

```bash
pnpm run type-check
```

If you encounter type errors about **missing properties, missing methods, or unknown imports** that were introduced by the cherry-picks, this means you accidentally cherry-picked a bugfix for an **upstream feature that our fork does not have** (or has intentionally excluded). 

**Do NOT attempt to "fix" these type errors by manually adding the missing upstream types or properties.** Doing so will inadvertently bleed excluded features into the codebase. 

Instead:
1. Identify the files containing the type errors and trace them to the upstream feature they belong to.
2. Hard-revert those specific files to their original fork state (`git checkout origin/main -- <file>`) to strip the alien feature logic.
3. If a bugfix in a shared file (e.g., `conversationLifecycle.ts`) relies on an upstream feature variable (e.g., `excludeStatuses`), manually strip only the lines referencing the unknown variable while preserving the rest of the bugfix.

### Step 6: Squash for Clean History

To prevent cluttering the local history with dozens of individual upstream commits and conflict resolutions, squash the batches into a single logical unit.

1. Find the commit hash _before_ your first cherry-pick in the batch.
2. Soft reset and commit:

```bash
git reset --soft <base-commit-hash>
git commit -m "🚀 sync: upstream bugfixes (pass X)"
```
