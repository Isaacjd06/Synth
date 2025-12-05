# Prompt for Fixing Knowledge Base Files

You are tasked with fixing formatting issues in 8 knowledge base files that failed the quality audit. All files have excellent content quality - only formatting adjustments are needed.

## Files to Fix

Fix the following 8 files in `/lib/knowledge`:

1. `lib/knowledge/synth-internal-architecture.md`
2. `lib/knowledge/operations/productivity/communication-systems.md`
3. `lib/knowledge/management/leadership/decision-making.md`
4. `lib/knowledge/management/team/hiring-basics.md`
5. `lib/knowledge/marketing/fundamentals/marketing-fundamentals.md`
6. `lib/knowledge/marketing/offer_architecture/offer-design.md`
7. `lib/knowledge/marketing/organic/content-strategy.md`
8. `lib/knowledge/marketing/paid/paid-ads-basics.md`

## Required Fixes

### Fix 1: Internal Check Section Format

Each file MUST have an "Internal Check" section (or "INTERNAL CHECK") with these THREE required subsections in this order:

1. **"Areas where evidence is weaker or context-dependent"** (or "Areas Where Evidence Is Weaker or Context-Dependent")
   - List specific areas where the content is less certain, context-dependent, or based on assumptions

2. **"Confirmation: No Fabricated Sources"** (or "Confirmation no fabricated sources were used")
   - Explicitly state that no statistics, case studies, or sources were fabricated
   - Describe the basis of the content (published frameworks, established practices, etc.)

3. **"Confidence Levels by Section"** (or "Confidence levels" or "Confidence Levels")
   - Provide confidence assessments for different sections of the document
   - Use format like: "Section Name: HIGH / MEDIUM / LOW - reason"

#### Example of Correct Format:

```markdown
## INTERNAL CHECK

### Areas Where Evidence Is Weaker or Context-Dependent
- Specific timeframe estimates (e.g., "12-24 months") are based on practitioner consensus rather than empirical research
- Effectiveness metrics vary significantly by industry and market maturity
- Some frameworks have limited validation in specific contexts

### Confirmation: No Fabricated Sources
This document draws on established frameworks and methodologies from published sources. All frameworks mentioned (e.g., Framework X, Methodology Y) are real and widely recognized. No statistics, case studies, or specific company examples were fabricated. Guidance is based on documented best practices and published literature.

### Confidence Levels by Section
- Core Concepts and Definitions: HIGH - these are well-established principles
- Framework Details: MEDIUM-HIGH - based on common practice patterns
- Practical Applications: MEDIUM - effectiveness depends on execution and context
- Integration with Synth: MEDIUM - specific to Synth's architecture
```

### Fix 2: Footer Format

Each file MUST end with this exact footer format:

```markdown
## FILE COMPLETE

**Status:** Ready to save to `/lib/knowledge/<exact-path-relative-to-knowledge-folder>.md`
```

OR

```markdown
## FILE COMPLETE

Ready to save to /lib/knowledge/<exact-path-relative-to-knowledge-folder>.md
```

#### Examples of Correct Footer Format:

For `lib/knowledge/marketing/fundamentals/marketing-fundamentals.md`:
```markdown
## FILE COMPLETE

**Status:** Ready to save to `/lib/knowledge/marketing/fundamentals/marketing-fundamentals.md`
```

For `lib/knowledge/operations/productivity/communication-systems.md`:
```markdown
## FILE COMPLETE

**Status:** Ready to save to `/lib/knowledge/operations/productivity/communication-systems.md`
```

## Specific File Instructions

### File 1: `lib/knowledge/synth-internal-architecture.md`
- **Issue**: Has "Confidence Audit" section instead of "Internal Check" section
- **Fix**: 
  - Either rename "Confidence Audit" to "Internal Check" and restructure to match required format
  - OR add a new "Internal Check" section after the "Confidence Audit" section with all three required subsections
  - The "Confidence Audit" content can inform the "Confidence Levels by Section" subsection
- **Footer**: Verify it has the correct format with exact path

### Files 2-8: All other files
- **Issue**: Have "Internal Check" sections but missing the "Areas where evidence is weaker or context-dependent" subsection
- **Fix**:
  - Add the missing "Areas where evidence is weaker or context-dependent" subsection
  - Place it as the FIRST subsection in the Internal Check section
  - Keep existing "No Fabricated Sources" and "Confidence Level" sections, but ensure they match the required format
  - If confidence is shown as a single level (e.g., "High (8.5/10)"), expand it to "Confidence Levels by Section" format
- **Footer**: Update footer to include "Ready to save to /lib/knowledge/<path>.md" format

## Notes

- **DO NOT** change any substantive content
- **DO NOT** rewrite sections - only add missing subsections and fix formatting
- **DO** preserve all existing content and structure
- **DO** match the formatting style already used in the file (e.g., if using "INTERNAL CHECK" vs "Internal Check")
- The Internal Check section should come immediately before the FILE COMPLETE footer

## Process

1. Read each file listed above
2. Identify the current state of the Internal Check section
3. Add missing subsections following the required format
4. Update the footer to match the exact format specified
5. Ensure all changes are minimal and preserve existing content
6. Verify the file ends with the correct footer format

## Quality Checklist

After fixing each file, verify:
- [ ] Internal Check section has all three required subsections in order
- [ ] Footer includes "Ready to save to /lib/knowledge/<exact-path>.md"
- [ ] No substantive content was changed
- [ ] Existing formatting style is preserved
- [ ] File structure and markdown formatting are correct

Begin fixing the files one by one, starting with `synth-internal-architecture.md`.

