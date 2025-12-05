# Layout Fix Implementation Plan

## Problem
The sidebar is currently overlapping content instead of pushing it. The sidebar uses `position: fixed` which takes it out of the document flow.

## Solution
1. Use a flex container with sidebar and main as siblings
2. Sidebar should NOT be fixed on desktop (part of flex flow)
3. Main content uses flex-1 or margin-left that matches sidebar width exactly
4. On mobile, keep drawer behavior (fixed)

## Implementation Steps
1. Refactor AppShell to use flex layout
2. Make sidebar part of flex flow on desktop
3. Ensure margin calculations are precise
4. Test all pages

