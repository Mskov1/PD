# HydroTent - Product Requirements Document

## Problem Statement
Build an interface for HydroTent hydroponic tent management system with plant tracking, environment controls, AI assistant, tutorials, notifications, and community features.

## Architecture
- **Backend**: FastAPI + MongoDB + emergentintegrations (AI) + Emergent Object Storage (video uploads)
- **Frontend**: React + Tailwind + Shadcn UI + Framer Motion + Phosphor Icons
- **AI**: Claude Sonnet 4.5 + GPT-5.2 via Emergent LLM Key
- **Storage**: Emergent Object Storage for video tutorial uploads
- **Voice**: Web Speech API (browser-native) for voice input to AI

## What's Been Implemented (April 2026)
### v1 - Initial Build
- Full backend API with plant CRUD, tent status, notifications, AI chat, tutorials, community feed
- Tab-based navigation (My Tent, Control Panel, Community)

### v2 - Simplified Interface
- Reduced to 6 plant types with images
- 6 fixed plant slots in 3 rows of 2
- Action-only alerts (no numerical clutter)
- AI moved to floating button + slide-out drawer

### v3 - User Feedback Iteration (Current)
- Allow adding multiples of same plant type
- Visual level indicators (colored segments, no numbers) for water/nutrients on front page
- Very visible warning banners when levels are low (pulsing icons)
- Inline notifications on My Tent page with tap-to-dismiss
- Voice input for AI (microphone button using Web Speech API)
- Simplified AI with video answer visual example for first-time users
- Quick suggestion buttons for common questions
- Control Panel: Light on/off toggle switch
- Control Panel: Fan on/off toggle switch  
- Control Panel: pH pump up/down with visual level indicator
- Notification dedup for water/nutrient alerts

## Prioritized Backlog
### P1 (High)
- Scheduled reminders (change water every X days, remove roots)
- Real sensor data integration (IoT)
- Push notifications (browser)

### P2 (Nice to have)
- Multi-tent support
- Plant growth photo log
- Dark mode toggle
- Community comments/interactions
- Export data to CSV

## Next Tasks
1. Add "change water" and "remove roots" scheduled reminders per plant
2. Connect real sensor data for automated water/nutrient monitoring
3. Community interaction features
