# Issue 025: Support expandable grouped TraceSteps inline in the graph

## Goal

Allow grouped Story graph nodes to expand inline into child TraceSteps, so users can start with a clean execution story and unravel details when needed.

## Product context

Some traces contain many repeated or technical events. Showing everything by default makes the graph unreadable, but hiding everything weakens technical credibility. Inline expansion gives both: a clean high-level story plus inspectable substeps.

## Scope

- Extend the Story graph to support grouped TraceSteps with children/substeps.
- Render grouped nodes collapsed by default where appropriate.
- On click or explicit expand control, expand the group inline in the main graph.
- Provide collapse behavior.
- Keep child nodes summarized; raw JSON remains in the drawer, not as child graph payload dumps.
- Preserve graph orientation and readability after expansion.
- Prefer only one major group expanded at a time unless multi-expand is simple and stable.
- Ensure groups containing errors surface that status while collapsed.
- Support at least these initial grouping patterns if the underlying TraceStep interpreter exposes them:
  - context gathering sequences
  - artifact creation/editing sequences
  - verification sequences
  - browser/UI inspection sequences
  - analysis/image inspection sequences

## Out of scope

- New raw data ingestion detail.
- LLM grouping.
- Deep nested drilldowns beyond one practical child level.
- Tool-specific evidence cards.
- Search/filter/minimap.

## UX/design notes

Collapsed:

```text
📚 Inspected codebase
Context gathering · 7 events
```

Expanded inline:

```text
             ┌─ Searched project files
📚 Inspected codebase
             ├─ Read graph component
             ├─ Read trace parser
             └─ Reviewed package config
```

Rules:

1. Only group nodes expand.
2. Leaf nodes open the details drawer.
3. Expanded children stay visually contained.
4. Children remain summarized.
5. Errors stay visible even when collapsed.
6. Clear collapse affordance.

## Implementation notes / likely seams

- Build on the `children`/group metadata from TraceStep if introduced in Issue 021.
- Keep expansion state UI-local.
- If layout recalculation is needed, choose the smallest stable approach before considering a major layout engine change.
- Make sure fullscreen is the primary target for expansion; embedded graph can support it if stable, but do not let cramped embedded behavior compromise the fullscreen UX.

Amon process reminders:

- Read project docs/ADRs first.
- Keep the feature demoable and stable before adding clever graph behavior.
- Use OpenCode for bounded implementation/review if useful, but verify yourself.
- Run real verification before reporting success.

## Acceptance criteria

- [ ] Group TraceSteps render as collapsed parent nodes by default when appropriate.
- [ ] User can expand a group inline in the graph.
- [ ] User can collapse the group again.
- [ ] Expanded children are readable summarized substeps, not raw JSON payloads.
- [ ] Collapsed groups show event count and error count/status when relevant.
- [ ] Expanded layout remains understandable in fullscreen mode.
- [ ] Leaf node click behavior still opens the details drawer.
- [ ] Tests or fixtures cover collapsed/expanded/error-containing groups where practical.

## Blocked by

- Issue 021: Introduce TraceStep story model for Flow Replay
- Issue 022: Render compact story graph nodes with category styling
- Issue 024: Add fullscreen presentation mode for the Flow graph

## Verification

```bash
npm run typecheck
npm test
npm run build
```

Manual check:

- Open fullscreen Flow graph with a grouped fixture.
- Expand a group.
- Confirm child substeps appear inline and remain readable.
- Confirm collapsed error groups still show error status.
- Collapse the group and verify orientation remains sane.
