# HydroTent - Product Requirements Document

## Architecture
- **Backend**: FastAPI + MongoDB + emergentintegrations (AI) + Emergent Object Storage
- **Frontend**: React + Tailwind + Shadcn UI + Framer Motion + Phosphor Icons
- **AI**: Claude Sonnet 4.5 + GPT-5.2 via Emergent LLM Key
- **Voice**: Web Speech API (browser-native)

## What's Been Implemented (April 2026)

### v4 - Code Quality Refactor (Current)
**Critical Fixes:**
- Extracted API logic from App.js into custom hooks: `usePlantActions`, `useTentStatus`, `useNotifications` in `/hooks/useHydroTent.js`
- Fixed all missing React hook dependencies across all components
- Removed all `console.error` statements, replaced with `toast.error()` user feedback
- Extracted sub-components from AIAssistant: `ChatMessage`, `TutorialList`, `VideoAnswerExample`, `useSpeechRecognition` hook
- Fixed unstable array keys in SimpleUI rows, ControlPanel warnings/pH segments
- Refactored backend `check_notifications()` into 3 focused functions: `_create_notif()`, `_check_harvest_notifications()`, `_check_water_notifications()`
- Fixed `useMemo` dependencies in PlantCard and SimpleUI PlantSlot
- Fixed Python test `is` vs `==` comparisons for boolean assertions
- Added `DialogDescription` for accessibility compliance

## Backlog
### P1
- Scheduled reminders (change water, remove roots)
- Real sensor data (IoT)
- Push notifications

### P2
- Multi-tent support, dark mode, photo log, CSV export
