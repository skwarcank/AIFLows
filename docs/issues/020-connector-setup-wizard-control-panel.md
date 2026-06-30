# Issue 020: Polish Connector setup wizard and CLI control panel

## Goal

Turn the AIFlows Connector from a functional developer CLI into a polished, beginner-friendly product surface with:

- a guided first-run setup wizard;
- a small post-setup CLI control panel;
- clearer profile management;
- useful help/status/doctor commands;
- restrained colors and friendlier terminal copy;
- installer/PATH behavior that lets users run `aiflows-connector` directly.

This should remain a tracer-bullet implementation inside one coherent issue: build thin, working slices and verify each command as it lands.

## Product context

The Connector is the bridge between local Hermes and Hosted AIFlows. It runs near Hermes, reads Hermes state read-only, normalizes completed Flows, and uploads shallow Flow payloads to Hosted AIFlows.

The current Connector already supports lower-level commands such as `connect`, `detect`, and `run`. This issue adds the product-grade experience around them:

```bash
aiflows-connector setup --token <token>
aiflows-connector status
aiflows-connector profiles
aiflows-connector profiles add <profile>
aiflows-connector profiles remove <profile>
aiflows-connector config
aiflows-connector doctor
aiflows-connector help
aiflows-connector tldr
```

Relevant glossary terms in `CONTEXT.md`:

- Connector
- Connector Setup Wizard
- Connector Control Panel
- Detected Profile
- Integration Profile

## Decisions locked during grilling

| Area | Decision |
|---|---|
| Main onboarding | `aiflows-connector setup --token <token>` |
| Existing `connect` command | Keep as lower-level/manual/debug command |
| Setup finish | Ask `Start watching Hermes now? [Y/n]` |
| Post-setup CLI | Small control panel with status/profiles/config/doctor/help/tldr |
| Profiles view | Show all detected Hermes profiles with selected/not-selected state |
| Profile add/remove | Local config only; remove means stop syncing, not delete hosted data |
| Later recent history | `profiles add <profile> --recent 20` works even if already selected |
| Explicit `sync-recent` command | Out of scope for first pass |
| State compatibility | Pre-release; local state shape may change, but incompatible state must fail kindly |
| Pre-pairing behavior | Local-only commands should still be useful where possible |
| PATH behavior | Installer-managed with conservative user consent before shell config edits |
| Colors | Support `--color`, `--no-color`, `NO_COLOR`, `FORCE_COLOR` |
| `status` | Local + server check by default, graceful fallback if offline |
| `doctor` | Local + network checks by default |
| Voice | Professional but encouraging; credible, not overly cute |

## Scope

### 1. Add guided setup wizard

Add:

```bash
aiflows-connector setup --token <pairing-token> [--api-base-url <url>] [--hermes-home <path>] [--yes] [--color] [--no-color]
```

Happy path:

```text
AIFlows Connector

✓ Connected to Hosted AIFlows
✓ Found Hermes at /root/.hermes
? Which profiles should AIFlows sync?
? Sync recent history? Default is yes, latest 20 completed Flows per profile.
✓ Setup complete

Start watching Hermes now? [Y/n]
```

If the user accepts, setup should enter the foreground sync loop. If not, it should clearly print:

```text
Start later with:
  aiflows-connector run

Useful commands:
  aiflows-connector status
  aiflows-connector profiles
  aiflows-connector tldr
```

`connect --token` should remain available, but the web onboarding/install flow should prefer `setup --token`.

### 2. Add friendly help and TLDR commands

Add:

```bash
aiflows-connector help
aiflows-connector tldr
```

`help` should be the fuller command reference.

`tldr` should be a beginner-friendly quick sheet, roughly:

```text
AIFlows Connector — common commands

First setup:
  aiflows-connector setup --token <token>

Start syncing:
  aiflows-connector run

Check health:
  aiflows-connector status
  aiflows-connector doctor

Manage profiles:
  aiflows-connector profiles
  aiflows-connector profiles add <name>
  aiflows-connector profiles add <name> --recent 20
  aiflows-connector profiles remove <name>
```

### 3. Add status command

Add:

```bash
aiflows-connector status [--color] [--no-color]
```

It should:

- read local connector state;
- show pairing/integration summary;
- show API base URL;
- show Hermes home;
- show selected profiles;
- show detected profiles if Hermes can be found;
- show last sync / failed upload info from local state;
- contact Hosted AIFlows when possible to validate/retrieve server-side status;
- gracefully fall back if the server/network is unreachable.

Example fallback copy:

```text
! Hosted AIFlows is unreachable right now — showing local state only.
```

If not paired yet, it should not crash. It should explain:

```text
Connector is not set up yet.
Run the setup command from Hosted AIFlows:
  aiflows-connector setup --token <token>
```

### 4. Add profiles control panel

Add:

```bash
aiflows-connector profiles [--hermes-home <path>] [--color] [--no-color]
aiflows-connector profiles add <profile> [--recent <count>] [--no-history]
aiflows-connector profiles remove <profile>
```

`profiles` should show **all detected Hermes profiles**, not only selected profiles.

Example:

```text
Hermes home: /root/.hermes

Profiles:
  ✓ default    syncing
  ✓ asterion   syncing
  ○ test       not synced

Commands:
  aiflows-connector profiles add test
  aiflows-connector profiles remove asterion
```

Important copy rule:

- `remove` means **stop syncing this profile**.
- It must not imply deleting a Hermes profile.
- It must not imply deleting hosted Flows.

Example remove output:

```text
Stopped syncing profile `asterion`.
Previously synced Flows remain in Hosted AIFlows.
```

Profile add behavior:

| Situation | Expected behavior |
|---|---|
| Profile not selected + no flags | Add profile and ask whether to sync recent history |
| Profile not selected + `--recent 20` | Add profile and queue latest 20 completed Flows for sync |
| Profile not selected + `--no-history` | Add profile and only sync future completed Flows |
| Profile already selected + no flags | No-op with clear explanation |
| Profile already selected + `--recent 20` | Queue latest 20 completed Flows for that profile |
| Profile already selected + `--no-history` | No-op with clear explanation |

For this first pass, `profiles add/remove` updates local connector config only. It does not notify Hosted AIFlows immediately. Existing hosted Flows remain until the Integration is deleted or a future data-management feature exists.

### 5. Add config command

Add:

```bash
aiflows-connector config [--color] [--no-color]
```

It should show a readable local configuration summary:

- state file path;
- API base URL;
- Integration name/provider/id if paired;
- Hermes home if configured;
- selected profiles;
- whether any recent syncs are pending;
- where to run `setup` again if configuration is invalid.

Editing config is out of scope for this issue.

### 6. Add doctor command

Add:

```bash
aiflows-connector doctor [--color] [--no-color]
```

`doctor` should perform local + network checks by default.

Checks should include, where applicable:

```text
✓ Connector paired
✓ API reachable
✓ Connector token accepted
✓ Hermes home found: /root/.hermes
✓ Hermes profiles found: default, asterion
✓ Selected profile DBs readable
✓ Local state writable: ~/.aiflows/connector.json
! Failed uploads pending: 2
```

Rules:

- Read-only toward Hermes.
- Do not upload Flows.
- Network check is allowed by default because this command diagnoses Hosted AIFlows connectivity.
- Clearly say when Hosted AIFlows is contacted.
- If not paired, still run local checks where useful and explain setup next step.

### 7. Add restrained color support

Add well-placed terminal colors and symbols.

Suggested vocabulary:

| Meaning | Style |
|---|---|
| Success | green `✓` |
| Warning / action needed | yellow `!` |
| Error | red `✗` |
| Muted details | dim gray |
| Commands | cyan |
| Section headings | bold |

Behavior:

| Input/environment | Expected color behavior |
|---|---|
| TTY + no `NO_COLOR` | colors on |
| `NO_COLOR=1` | colors off |
| `--no-color` | colors off |
| `FORCE_COLOR=1` | colors on |
| `--color` | colors on |
| piped/CI without force | colors off |

Keep the voice professional but encouraging. Avoid excessive emoji or noisy decoration.

### 8. Improve installer/PATH behavior

Users should be able to run:

```bash
aiflows-connector run
```

instead of:

```bash
~/.aiflows/bin/aiflows-connector run
```

The curl installer should:

1. install the connector to `~/.aiflows/bin/aiflows-connector`;
2. check whether `~/.aiflows/bin` is already in `PATH`;
3. if missing, detect the likely shell config file, e.g. `~/.bashrc` or `~/.zshrc`;
4. ask before editing shell config;
5. default to **No**;
6. append only if missing;
7. show exactly what was added;
8. always print manual fallback commands.

Example:

```text
~/.aiflows/bin is not currently in your PATH.

Add AIFlows to PATH in /root/.bashrc now? [y/N]

Manual setup:
  echo 'export PATH="$HOME/.aiflows/bin:$PATH"' >> ~/.bashrc
  source ~/.bashrc
```

Do not silently mutate shell startup files.

### 9. Pre-pairing command behavior

Commands should behave usefully before setup where possible:

| Command | Before setup behavior |
|---|---|
| `help` | works |
| `tldr` | works |
| `detect` | works |
| `profiles` | works as local Hermes detection preview |
| `doctor` | works, reports “not paired yet” and runs local checks |
| `status` | reports “not paired yet” and prints next setup step |
| `profiles add/remove` | requires setup |
| `run` | requires setup |

## State shape note

The Connector is pre-release. This issue may change the local state shape under:

```text
~/.aiflows/connector.json
```

A full migration is not required. However, if existing state is incompatible, the CLI must fail kindly and tell the user how to recover, e.g. rerun setup from Hosted AIFlows.

Do not corrupt existing state silently.

## Out of scope

- Background service installation.
- SSH-based remote Hermes reading.
- Hermes plugin/native integration.
- Server-side profile registration before first Flow sync.
- Deleting hosted Flow data when removing a profile locally.
- Dedicated `profiles sync-recent` command.
- Full interactive TUI/dashboard.
- Publishing a real global npm package.
- Changing Hermes files or creating/removing Hermes profiles.

## Tracer bullets

Implement as thin, verifiable slices:

1. `help` and `tldr` command surfaces.
2. Shared output/color helper with flags/env behavior.
3. `setup --token` wrapper around pair/detect/profile/history flow.
4. Setup finish prompt: start now or print next commands.
5. `profiles` list showing all detected profiles and selected state.
6. `profiles add/remove` local config changes.
7. `profiles add --recent <count>` pending recent sync behavior.
8. `status` local summary with graceful server fallback.
9. `doctor` local + network diagnostic checks.
10. `config` read-only local config summary.
11. Installer/PATH consent behavior.
12. Docs update after implementation.

## Acceptance criteria

- [ ] `aiflows-connector setup --token <token>` performs the full guided setup flow.
- [ ] Setup can optionally start the foreground sync loop immediately.
- [ ] Setup clearly teaches `run`, `status`, and `tldr` for later use.
- [ ] Existing `connect` command still works as a lower-level/manual command.
- [ ] `help` provides full command reference.
- [ ] `tldr` provides beginner-friendly common commands.
- [ ] `status` shows local connector state and server status when reachable.
- [ ] `status` gracefully falls back to local state when server/network is unreachable.
- [ ] `profiles` shows all detected Hermes profiles with selected/not-selected state.
- [ ] `profiles` works before pairing as a local detection preview.
- [ ] `profiles add <profile>` updates local selected profiles.
- [ ] `profiles remove <profile>` stops future syncing only and says hosted Flows remain.
- [ ] `profiles add <profile> --recent 20` queues recent history for that profile, including if it is already selected.
- [ ] `profiles add <profile> --no-history` adds the profile for future Flows only.
- [ ] `config` shows a readable local configuration summary.
- [ ] `doctor` runs local + network checks by default.
- [ ] `doctor` does not upload Flows and does not write to Hermes.
- [ ] Colors are restrained and respect `--color`, `--no-color`, `NO_COLOR`, and `FORCE_COLOR`.
- [ ] Piped/CI output does not include color unless forced.
- [ ] Installer installs to `~/.aiflows/bin/aiflows-connector`.
- [ ] Installer checks whether `~/.aiflows/bin` is in PATH.
- [ ] Installer asks before editing shell config and defaults to No.
- [ ] Installer prints manual PATH fallback commands.
- [ ] Incompatible pre-release local state fails kindly with recovery instructions.
- [ ] Connector remains read-only with respect to Hermes.
- [ ] Docs are updated after implementation to match the new setup/control-panel flow.

## Documentation updates required after implementation

After the implementation is finished and verified, update docs so they match the real behavior. At minimum review and update:

- `docs/setup.md`
- `docs/PRD.md` if user-visible connector stories changed materially
- `docs/architecture.md` if command/state/API seams changed materially
- `CONTEXT.md` if new domain terms were added or existing terms changed
- relevant issue docs if old connector instructions become stale

Docs must not describe commands that do not actually work. Verify command names and examples against the implemented CLI before marking this issue complete.

## Verification commands

Run broad repo checks:

```bash
npm run typecheck
npm test
npm run build
```

Also manually exercise the Connector commands against local/dev state where possible:

```bash
npm run dev -w aiflows-connector -- tldr
npm run dev -w aiflows-connector -- help
npm run dev -w aiflows-connector -- detect
npm run dev -w aiflows-connector -- profiles
npm run dev -w aiflows-connector -- status
npm run dev -w aiflows-connector -- doctor
```

If using a temporary home directory for tests, verify state writes do not touch the real user state unexpectedly.

## Manual verification checklist

- [ ] Fresh setup from Hosted AIFlows token completes.
- [ ] Setup detects Hermes and explains read-only access.
- [ ] Setup lets the user choose profiles.
- [ ] Setup lets the user choose recent history behavior.
- [ ] Setup offers to start watching now.
- [ ] Declining start prints clear next commands.
- [ ] `aiflows-connector run` works after PATH is configured.
- [ ] `profiles` shows selected and unselected profiles.
- [ ] `profiles add` changes future sync selection.
- [ ] `profiles remove` does not delete hosted data and says so.
- [ ] `profiles add --recent 20` can queue recent history for an already-selected profile.
- [ ] `status` is useful online and offline.
- [ ] `doctor` explains failures with actionable messages.
- [ ] `NO_COLOR=1` disables colors.
- [ ] `FORCE_COLOR=1` enables colors when appropriate.
- [ ] Installer PATH prompt is conservative and transparent.

## External setup rule

If this issue requires Supabase, GitHub, Vercel, or deployed Hosted AIFlows setup, update `docs/setup.md`, document the required external steps, and require confirmation before relying on that setup.
