---
name: docx-to-markdown
description: Guidelines for 100% literal migration of Word documents to Markdown for Knowledge Bases.
---

# Litreal Fidelity: DOCX to Markdown Migration

This skill provides a meticulous workflow for converting internal organizational documents from `.docx` format to Markdown (`.md`) specifically for AI Knowledge Bases (RAG).

## 1. The "Literal Fidelity" Philosophy

When migrating documents for an AI Agent's Knowledge Base (like LobeHub's `knowledge-seed`), **never summarize**.

- **AI needs context**: Summarization removes the very nuances (FAQs, policy brackets, specific machinery names) that users will ask about.
- **Truth over Beauty**: The resulting Markdown should be a perfect mirror of the source document's technical data, even if the formatting is repetitive.

## 2. Methodology

### Step 1: Raw Extraction

Standard libraries (like `python-docx`) can sometimes skip text in nested text boxes, headers, or footers. For 100% fidelity, use the provided raw XML extraction script.

**Code**: `.agents/skills/docx-to-markdown/scripts/extract_docx.py`
**Usage**:

```bash
python3 .agents/skills/docx-to-markdown/scripts/extract_docx.py "/path/to/source.docx" > raw_dump.txt
```

### Step 2: Mapping to Markdown

Convert the `raw_dump.txt` into a structured `.md` file following these rules:

1. **Headers**: Use `#`, `##`, `###` based on the document's visual hierarchy.
2. **FAQs**: Preserve the "Hỏi / Trả lời" structure exactly. Do not merge similar questions; the AI benefits from the varied phrasing.
3. **Policies**: Preserve specific percentages (e.g., "80% giá trị hóa đơn") and timeframes (e.g., "dưới 3 năm").
4. **Brackets**: If the source uses labels like `(🔴 Áp dụng chính sách...)`, keep them literal.

### Step 3: Meticulous Verification

Perform a "Literal Audit" by comparing the generated `.md` against the Word source:

- Check for missing departments in organizational charts.
- Check for missing addresses in location files.
- Check for missing brand slogans or history sections.

## 3. Common Pitfalls to Avoid

- **Summarization**: Converting 10 pages of logic into 1 page of "key points" is a failure.
- **Missing Technical Details**: Ignoring specific model numbers (e.g., `GIA ID 100`) or units of measurement (`carat`, `ly`).
- **Standardizing FAQs**: Do not "correct" the varied ways users ask questions in the source; these are valuable "alternate questions" for the RAG system.

## 4. Example Transformation

**Source (.docx)**:

> 🔴 Hội đồng Quản trị: Áp dụng chính sách Khối Văn phòng.
> 🔵 Phòng Kinh Doanh: Áp dụng khối Kinh Doanh.

**Target (.md)**:

```markdown
### Hội đồng Quản trị

(🔴 Áp dụng chính sách: Khối Văn phòng)

### Phòng Kinh Doanh

(🔵 Áp dụng chính sách: Khối Kinh Doanh)
```

By following this meticulously detailed workflow, you ensure that the AI Agent has access to the "Single Source of Truth" with zero loss of information.
