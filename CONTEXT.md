# AIFlows Context

AIFlows is Mission Control for watching AI agents work.

## Glossary

### Adapter
A type of agent system AIFlows can watch, such as Hermes. An Adapter defines how AIFlows understands a kind of agent runtime.

### Hermes Adapter
The first AIFlows Adapter. It converts observable Hermes activity into AIFlows Flows and Steps.

### Flow
One completed observable agent run, currently defined for Hermes as one user prompt through the final assistant response.

### Step
One observable event inside a Flow, such as a user prompt, tool call, tool result, error, or assistant response.

### Mission Control
The primary AIFlows experience for watching connected agent systems and their Flows.

### Connector
A small program run near a user's Hermes installation that reads local Hermes storage, normalizes observable activity into AIFlows Flows and Steps, and securely sends those normalized Flows to Hosted AIFlows.

### Connector Setup Wizard
The guided first-run Connector experience that helps a user pair AIFlows, detect Hermes, choose profiles, choose history sync behavior, and start syncing without needing to understand Hermes internals.

### Connector Control Panel
The post-setup CLI surface for inspecting and changing Connector configuration, health, profile selection, sync status, and troubleshooting commands after the initial setup wizard has completed.

### Integration
A user-facing connection between Hosted AIFlows and an agent system such as Hermes. An Integration may be powered by a Connector, but the UI should present the relationship as an Integration rather than exposing connector mechanics first.

### Integration Profile
A synced profile/account/workspace inside an Integration. For Hermes, this maps to a Hermes profile such as `default` or `asterion`. Mission Control should let users switch between Integration Profiles so each profile has a distinct Flow list instead of flattening all Flows together.

### Detected Profile
A Hermes profile currently found by the Connector on the local machine/VPS. Detected Profiles may be selected or not selected for sync; the Connector Control Panel should show both states so users can add or remove synced profiles intentionally.

### Workspace
A container for a user's Integrations and Flows in Hosted AIFlows. The initial SaaS direction can present a single-user account, but the data model should create a default Workspace so teams can be added later.

### Authentication
Hosted AIFlows uses Supabase Auth for account signup and login. Email/password is the primary sign-in method, with GitHub OAuth also supported. Email verification and OAuth redirects must use the deployed hosted URL, not localhost, in remote environments.

### Hosted AIFlows
The SaaS version of AIFlows operated remotely, where users log in through a web app and connect agent systems through Integrations.

### Flow Retention
The policy that controls how many synced Flows Hosted AIFlows keeps for an Integration. The initial SaaS direction keeps the latest 100 Flows per Integration and discards older synced Flows.

### Step Content Policy
The rule for what Step content Hosted AIFlows stores. The initial SaaS direction stores shallow Step descriptions and metadata rather than full raw tool outputs or generated summaries; configurable retention/detail levels may be considered later.
