# Fitnes — Digital Health Ecosystem Platform

## Project Overview

This is a comprehensive mobile health platform project ("Единая цифровая экосистема здоровья" / Digital Health Ecosystem) that unifies personal fitness training, nutrition tracking, and specialist consultations into a single AI-powered platform. The product replaces fragmented health tools by combining smart trainer, nutritionist, and specialist platform features.

**Key Features:**
- AI-powered personalized workout generation (home, outdoor, gym)
- Smart food scanner with AI calorie/macro recognition
- Deep user onboarding (23 parameters questionnaire)
- Progress tracking with photo diaries and dynamic charts
- HealthKit/Google Fit integration
- Specialist dashboard (web admin panel)
- Hybrid monetization: subscriptions, native ads, consultation commissions

## Technology Stack

### Client (Mobile App)
- **Framework:** React Native + TypeScript (strict typing)
- **Dev Environment:** Expo (Managed workflow) with Expo Router
- **Styling:** NativeWind (Tailwind CSS utility classes) with atomic design methodology
- **Animations/Lists:** React Native Reanimated, Shopify FlashList, React Native Bottom Sheet
- **Data Management:** TanStack Query (caching, optimistic UI, offline support)
- **Icons:** Lucide React Native

### Server & Database
- **Infrastructure:** Supabase (Auth, PostgreSQL, Storage, Edge Functions)
- **Trainer Workspace:** Next.js (web admin panel)

### Integrations & DevOps
- **Payment Gateway:** YKassa API with webhook subscriptions
- **Build/Publish:** EAS (Expo Application Services) + GitHub Actions

## Project Structure

```
Fitnes/
├── specification.md          # Product specification (features, UI/UX, tech stack)
├── step.md                   # Development plan (7 stages, step-by-step)
├── Agent.md                  # This file
└── .agent/
    ├── settings.json         # MCP servers config (shadcn, postgres, fetch)
    └── skills/
        ├── mobile-assistant/ # Expo/React Native mobile development skill
        ├── native/           # Native development skill
        ├── react-native-expo/# React Native Expo SDK 52+ skill
```

## Development Plan

The project follows a strict 7-stage development roadmap. **Each stage must be fully implemented, tested, and verified before moving to the next.**

### Stage 1: Initialization & Infrastructure
- Expo project setup with TypeScript + Expo Router
- NativeWind (Tailwind CSS) configuration
- File architecture (atomic design, path aliases)
- Supabase integration (database + auth)

### Stage 2: UI Kit & Navigation
- Reusable components (CustomButton 52px height, CustomInput, Card)
- Lucide React Native icons
- Bottom Tabs navigation (Home, Workouts, Food Scanner, Profile)

### Stage 3: Auth & Deep Onboarding
- Welcome/Splash screens with Reanimated animations
- 23-parameter multi-step questionnaire form
- BMI auto-calculation
- Supabase Auth (Email/Password, OAuth)

### Stage 4: Core Modules
- Dynamic Dashboard (time-aware, goal-based cards)
- Workout module with video player (Shopify FlashList)
- Food Scanner (expo-camera)
- Progress charts/graphs

### Stage 5: AI Logic & System Integrations
- AI food scanner (Supabase Edge Function → Vision API)
- HealthKit/Google Fit step tracking

### Stage 6: Offline Mode & Optimization
- TanStack Query persistence (AsyncStorage)
- Animation/Reanimated optimization (60 FPS target)

### Stage 7: Release Prep & Trainer Panel
- EAS Build configuration (dev/preview/prod profiles)
- Next.js web admin panel initialization

## Development Rules (from step.md)

1. **After each step's code, ask user to verify** in simulator/device and check console for errors
2. **Always output full file contents** when writing/modifying files (not small fragments)
3. **Fix configuration errors first** (especially React Native/Expo) before moving to business logic

## Key Commands

### Expo Development
```bash
# Start development server (when project is initialized)
npx expo start

# Start with cache clear
npx expo start -c

# Open React Native DevTools (NOT Chrome debugger)
# Press 'j' in terminal after starting expo

# iOS simulator
# Press 'i' in terminal

# Android emulator
# Press 'a' in terminal
```

### Supabase
```bash
# Push migrations
npx supabase db push --linked --yes

# Dump schema
npx supabase db dump --linked --schema public

# Generate types
export SUPABASE_PROJECT_ID=asihntqqeipaxsdilkyv
npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > src/types/supabase.ts
```

### EAS Build
```bash
# Build for preview
eas build -p android --profile preview
# or
eas build -p ios --profile preview
```

## Database Configuration

- **Supabase Project:** `asihntqqeipaxsdilkyv`
- **Organization:** HemSoft (Free tier)
- **Region:** East US (North Virginia)
- **Connection:** Available via MCP postgres server (configured in `.agent/settings.json`)

## UI/UX Design Principles

- **Visual concept:** Strict "premium" minimalism based on Material Design
- **Color scheme:** Deep purple + pink gradient combination
- **Cards:** Clean white (light) / darkened (dark theme) backgrounds
- **Buttons:** Large (52px+ height) for comfortable on-the-go interaction
- **Dynamic UI:** Context-aware screens, no static screens
- **Zero-input principle:** Maximize sensor usage (biometrics, geolocation, pedometer)
- **Organic design:** "Digital rest zones", natural shapes and rounded corners
- **Navigation:** Bottom bar with key sections (home, workouts, scanner, profile)

## MCP Servers Available

| Server | Purpose |
|--------|---------|
| `shadcn` | shadcn/ui components |
| `postgres` | Direct PostgreSQL database access |
| `fetch` | Web fetching for research |

## Security Best Practices

### Supabase Functions
- All `SECURITY DEFINER` functions MUST have `SET search_path = ''`
- Revoke execute permissions on trigger functions from PUBLIC/anon/authenticated
- RLS helper functions keep `GRANT EXECUTE` for `authenticated` role only

### Migration Naming
```
supabase/migrations/000{XX}_{description}.sql
```

## Available Skills

The project has specialized skills in `.agent/skills/` for:
- **mobile-assistant** — Expo/React Native mobile development
- **react-native-expo** — React Native Expo SDK 52+ specifics
- **native** — Native development

## Notes

- The project is currently in **active development** (Stage 7: UI Polish & Dark Mode)
- Development should follow the step-by-step plan in `step.md`
- All responses should be in **Russian** (language preference configured)
