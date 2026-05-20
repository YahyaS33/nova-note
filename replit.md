# Nova Notes

A premium productivity mobile app combining Smart Notes, Calendar, and Task Management in one seamless experience. Dark-first, fast, and beautifully polished.

## Run & Operate

- `pnpm --filter @workspace/mobile run dev` — run the Expo dev server (scan QR code with Expo Go)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (SDK 54), Expo Router, React Native
- State: React Context + AsyncStorage (offline-first)
- UI: @expo/vector-icons (Feather), react-native-reanimated
- API: Express 5 (backend, currently unused — frontend-only)

## Where things live

- `artifacts/mobile/` — the Nova Notes Expo app
  - `app/(tabs)/index.tsx` — Dashboard (greeting, focus task, stats, quick-add, today's schedule + tasks + notes)
  - `app/(tabs)/notes.tsx` — Notes list with search, pinned section, color-coded cards
  - `app/(tabs)/calendar.tsx` — Month calendar with event dots, agenda view
  - `app/(tabs)/tasks.tsx` — Tasks with priority filters, list grouping, progress bar
  - `app/note/[id].tsx` — Full-screen note editor with autosave, color picker, tags
  - `app/event/[id].tsx` — Event editor with time picker and color selection
  - `components/QuickAddModal.tsx` — Bottom-sheet quick-add for notes/tasks/events
  - `context/AppContext.tsx` — All data (notes, tasks, events) via AsyncStorage
  - `constants/colors.ts` — Full dark + light theme tokens

## Architecture decisions

- Frontend-only first build: all data stored in AsyncStorage — no backend, no DB
- Single AppContext for all three data domains (notes/tasks/events) to minimize provider nesting
- Sample data seeded on first launch so the app feels alive immediately
- NativeTabs with liquid glass for iOS 26+, BlurView fallback for older iOS/Android
- Dark mode first — `#0D0D12` background, `#7B6EF5` electric violet accent

## Product

Nova Notes is a unified productivity space combining:
- **Smart Notes** — pinnable, color-coded, taggable notes with full-screen editing and autosave
- **Calendar** — month grid with event dots, daily agenda, color-coded events
- **Tasks** — priority-based (high/medium/low), list grouping, progress tracking
- **Dashboard** — daily greeting, focus widget, stats, quick-add shortcuts, today's overview

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- UUID: use `Date.now().toString(36) + Math.random().toString(36).substr(2, 9)` — not the `uuid` package
- useAnimatedStyle must never be called inside .map() — extract to a separate component
- Web preview shows a simplified rendering — native Expo Go is the source of truth
- `pnpm exec expo start` is forbidden — use `restart_workflow` instead
