# PROMPT FOR CLAUDE: Add Missing Database Schema Fields

Update the Prisma schema file (`prisma/schema.prisma`) to add the following **required** fields that are missing but used in the codebase.

## REQUIRED CHANGES

### 1. Add Fields to Execution Model

**File:** `prisma/schema.prisma`  
**Model:** `Execution`

Add these two fields to the `Execution` model:

```prisma
model Execution {
  id                    String    @id @default(uuid())
  workflow_id           String
  user_id               String
  input_data            Json?
  output_data           Json?
  status                String?   @default("unknown") // ADD THIS: "success" | "failure" | "running" | "unknown"
  pipedream_execution_id String?  // ADD THIS: External execution ID from Pipedream
  created_at            DateTime  @default(now())
  finished_at           DateTime?
  user                  User      @relation(fields: [user_id], references: [id])
  workflow              Workflows @relation(fields: [workflow_id], references: [id])
}
```

**Why these fields are needed:**
- `status`: Required by `/app/api/workflows/sync-executions/route.ts` (line 146) and knowledge base documentation
- `pipedream_execution_id`: Required by `/app/api/workflows/sync-executions/route.ts` (line 147) to prevent duplicate execution records when syncing from Pipedream

---

### 2. Add `updated_at` Field to Workflows Model

**File:** `prisma/schema.prisma`  
**Model:** `Workflows`

Add this field to the `Workflows` model:

```prisma
model Workflows {
  id                String             @id @default(uuid())
  user_id           String
  name              String
  description       String?
  intent            String?
  trigger           Json?
  actions           Json?
  active            Boolean            @default(true)
  n8n_workflow_id   String?
  created_at        DateTime           @default(now())
  updated_at        DateTime           @updatedAt  // ADD THIS LINE
  executions        Execution[]
  memoryAutomations MemoryAutomation[]
  user              User               @relation(fields: [user_id], references: [id])

  @@map("workflows")
}
```

**Why this field is needed:**
- Expected by UI components (`app/workflows/page.tsx` interface expects `updated_at`)
- Standard practice for tracking modification timestamps

---

## INSTRUCTIONS

1. **Open** `prisma/schema.prisma`
2. **Add** the three fields specified above to their respective models
3. **Maintain** all existing fields, relationships, and model structure
4. **Use** nullable fields (`String?`) where specified to avoid breaking existing data
5. **Place** `updated_at` after `created_at` for consistency
6. **Run** `npx prisma format` to validate schema syntax
7. **Generate** migration: `npx prisma migrate dev --name add_missing_execution_and_workflow_fields`

## CONSTRAINTS

- **DO NOT** delete or rename any existing tables or fields
- **DO NOT** modify existing field types or relationships
- **ONLY** add the three fields specified above
- **DO NOT** remove any unused models (that's a separate cleanup task)

## VERIFICATION

After making changes:
- [ ] Schema file syntax is valid (`npx prisma format` succeeds)
- [ ] Migration generates without errors
- [ ] All existing fields remain unchanged
- [ ] TypeScript types regenerate successfully (`npx prisma generate`)

---

**That's it. Only add these three fields. Nothing else.**

