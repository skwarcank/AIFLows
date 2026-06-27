# Issue 008: Add human-readable Step details and friendly tool summaries

## Goal

Make Step detail readable for humans instead of exposing raw JSON/tool blobs.

## Product context

AIFlows is for watching agents work. The user should understand what happened without decoding raw tool arguments.

## Scope

Improve selected Step detail rendering.

Known friendly summary categories:

- file reading/searching;
- file writing/patching;
- terminal commands;
- browser actions;
- memory/skills.

Unknown tools should fall back to a generic readable summary.

## Out of scope

- Raw data view.
- File diffs.
- Complex custom renderer for every tool.
- AI-generated explanations.

## UX/design notes

Keep summaries simple and factual.

Examples:

```text
Read file
Path: /root/projects/AIFlows/README.md
Limit: 200 lines
```

```text
Ran command
Command: npm test
Working directory: /root/projects/AIFlows
```

For patch/write actions, show action and target file/path only. Do not show diffs.

## Implementation notes

Create reusable Step presentation helpers so graph, timeline, and detail labels stay consistent.

Tool name matching can be pragmatic. Do not hallucinate summaries when data is missing; use fallback.

## Acceptance criteria

- [ ] Step detail shows human-readable content only.
- [ ] File read/search tools get friendly summaries.
- [ ] File write/patch tools get simple action summaries without diffs.
- [ ] Terminal tools show command and working directory when available.
- [ ] Browser tools get friendly action summaries.
- [ ] Memory/skill tools get friendly action summaries.
- [ ] Unknown tools have a readable fallback.
- [ ] Large content remains scrollable and does not break layout.

## Verification

Run:

```bash
npm run typecheck
npm test
npm run build
```

Manual verification should be noted in the implementation summary.
