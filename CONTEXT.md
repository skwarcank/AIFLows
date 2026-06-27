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

### Integration
A user-facing connection between Hosted AIFlows and an agent system such as Hermes. An Integration may be powered by a Connector, but the UI should present the relationship as an Integration rather than exposing connector mechanics first.

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
