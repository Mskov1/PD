# HydroTent - Product Requirements Document

## Problem Statement
Build an interface for HydroTent hydroponic tent management system with plant tracking, environment controls, AI assistant, tutorials, notifications, and community features.

## Architecture
- **Backend**: FastAPI + MongoDB + emergentintegrations (AI) + Emergent Object Storage (video uploads)
- **Frontend**: React + Tailwind + Shadcn UI + Framer Motion + Phosphor Icons
- **AI**: Claude Sonnet 4.5 + GPT-5.2 via Emergent LLM Key
- **Storage**: Emergent Object Storage for video tutorial uploads

## User Personas
- **Hydroponic Hobbyist**: Needs simple plant tracking and harvest reminders
- **Community Grower**: Wants to share harvests and learn from tutorials

## Core Requirements
1. Plant management with dropdown catalog (6 plants with images)
2. 6 fixed plant slots in 3 rows - visual tent layout
3. Plant lifecycle timer with progress tracking
4. Action-based alerts only (water, nutrients, harvest) - no numerical clutter
5. Detailed control panel (temp, water, nutrients, pH, light, fan)
6. AI assistant (floating drawer) for gardening Q&A
7. Video tutorials (YouTube URLs + file uploads)
8. Community harvest feed
9. Notification system with dedup

## What's Been Implemented (April 2026)
- [x] Full backend API: plants CRUD, tent status, notifications, AI chat, tutorials, community feed
- [x] Simplified "My Tent" UI with 6 fixed slots, action alerts, plant images
- [x] Control Panel with 6 environment sliders
- [x] AI Assistant as floating button + slide-out drawer (Claude + GPT)
- [x] Video tutorials (YouTube + file upload to object storage)
- [x] Community harvest feed
- [x] Notification center with dedup logic
- [x] Max 6 plants enforcement
- [x] Backend tests: 18/18 passing
- [x] Frontend tests: 100% pass rate

## Prioritized Backlog
### P0 (Critical)
- All core features implemented

### P1 (High)
- Automated water level simulation / sensor integration
- Push notifications (browser)
- Plant care schedule reminders (change water every X days)

### P2 (Nice to have)
- Multi-tent support
- Plant growth photo log
- Detailed harvest analytics
- Export data to CSV
- Dark mode toggle

## Next Tasks
1. Connect real sensor data (IoT integration)
2. Add "change water" and "remove roots" scheduled reminders
3. Community features: comments on harvests, plant tips sharing
4. Mobile responsive polish
