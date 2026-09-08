## Agent skills

### Issue tracker

Issues and specs live as Markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the canonical triage labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repository with root `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.

<!-- CODEGRAPH_START -->
## CodeGraph
In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), the **code-exploration phase** must go through a subagent — never grep/find/read files directly in the main agent.

- **Exploration phase — spawn a subagent**: For any "where is X / how does X reach Y / what depends on Z / what's the blast radius of changing W" question, hand the question to a subagent (Agent tool) and instruct it to drive the `codegraph` MCP tools. The subagent returns a short summary; its bulk file reads stay out of the main context. This is the default for every code-exploration task in this repo, not an optimization.
- **MCP tool** (called by the subagent): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell fallback** (works from anywhere, no MCP needed): `codegraph explore "<symbol names or question>"` prints the same output — useful when the subagent hits an environment where MCP is not connected.

Skip CodeGraph entirely if no `.codegraph/` directory exists at the repo root — indexing is the user's decision.
<!-- CODEGRAPH_END -->
