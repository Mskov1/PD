# HydroTent - Product Requirements Document

## Architecture
- **Backend**: FastAPI + MongoDB + emergentintegrations (AI) + Emergent Object Storage
- **Frontend**: React + Tailwind + Shadcn UI + Framer Motion + Phosphor Icons
- **AI**: Claude Sonnet 4.5 + GPT-5.2 via Emergent LLM Key
- **Voice**: Web Speech API (browser-native)

## What's Been Implemented (May 2026)

### v5 - Prototype-Inspired Redesign (Current)
- **My Tent**: Visual tank fill indicators for water/nutrients (pill-shaped tubes with fill animation). Prominent "Ask AI" card button. Dynamic plant cards with big images and progress rings (no fixed slot limit). Add Plant card with + icon.
- **Control Panel**: Read-only Live Sensor Data cards with big bold numbers + target ranges (Temperature, Humidity, pH, EC, Light lux, Water flow). Light/Fan toggle switches. pH pump up/down with level indicator.
- **Community**: Photo/video upload support. Media displayed in feed alongside harvest entries.
- **AI**: Slide-out drawer with voice input, model selector (Claude/GPT), video tutorial support.
- **Custom Hooks**: usePlantActions, useTentStatus, useNotifications for clean separation.
- **Backend**: Extracted notification helpers, Form() for multipart params, TentStatus default merging.

## Backlog
### P1
- Scheduled reminders (change water, remove roots)
- Real IoT sensor data connection
- Push notifications
### P2
- Multi-tent, dark mode, photo log, CSV export
