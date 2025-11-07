SYNTH API ROUTES PLAN

Each endpoint uses Supabase as the database and should return JSON responses using NextResponse.

1. /api/users
   - Create, update, and fetch user data
   - Connects to Supabase “users” table

2. /api/workflows
   - Create, update, delete, and list workflows
   - Each workflow has a link to an n8n workflow ID
   - Only returns workflows for the logged-in user

3. /api/connections
   - Manage app integrations (Gmail, Slack, etc.)
   - Each connection has a name and reference
   - Each belongs to a user

4. /api/executions
   - Log and retrieve workflow runs (input/output/status)
   - Each belongs to a workflow
   - Must support listing by workflow_id

5. /api/memory
   - Store and retrieve long-term memory entries for each user
   - Each entry is a key/value pair
   - Must support updating value for same key
