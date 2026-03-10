# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gantt-style project roadmap planner built with React 18, Vite 6, and Tailwind CSS 4. Spanish-localized UI. Originally generated from a Figma design (https://www.figma.com/design/qKkDf7qU39nduMFkSKLRh9/Roadmap-App).

## Commands

- `npm install` — install dependencies
- `npm run dev` — start Vite dev server
- `npm run build` — production build

No test framework, linter, or formatter is configured.

## Architecture

Single-page React app with no routing (react-router is a dependency but unused). All state lives in `src/app/App.tsx` via React hooks — no external state library.

**Entry flow:** `index.html` → `src/main.tsx` → `App.tsx`

**Core data model:**
- `Group[]` — each group has an `id`, `name`, `color`, `isCollapsed`, and `activities[]`
- `Activity` — has `id`, `name`, and `selectedWeeks: number[]` (indices relative to the timeline start date)

**Key components (all in `src/app/components/`):**
- `App.tsx` — main container, centralized state, all CRUD handlers
- `group-section.tsx` — collapsible group with drag-drop (react-dnd), color picker, inline rename
- `activity-row.tsx` — timeline grid cells with mouse-drag week selection/deselection
- `slide-view.tsx` — read-only presentation view with PNG/clipboard export (html-to-image)
- `roadmap-header.tsx` — sticky month/week header row
- `ui/` — 48+ shadcn/ui components (Radix UI primitives)

**Two view modes:** "editor" (interactive grid) and "slide" (export-ready presentation).

## Styling

- Tailwind CSS 4 with `@tailwindcss/vite` plugin (no PostCSS config needed)
- Design tokens in `src/styles/theme.css` using OKLCH color space and CSS custom properties
- Light/dark mode via `.dark` class (next-themes)
- Font: Geometria (geometric sans-serif)
- Path alias: `@` → `src/`

## Key Patterns

- **Drag-and-drop:** react-dnd with HTML5 backend for reordering activities across groups
- **Drag-to-select:** Custom mouseDown/mouseEnter/mouseUp handlers in ActivityRow for week range selection
- **Inline editing:** Double-click to rename activities, groups, and project name (Enter to confirm, Escape to cancel)
- **Props drilling:** Parent-to-child via props, child-to-parent via callback functions
- **Spanish locale:** All UI labels in Spanish; date-fns uses `es` locale
