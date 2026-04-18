# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

**Fitnes** — единая цифровая экосистема здоровья. Мобильное приложение на React Native + Expo, объединяющее персонального тренера с ИИ, трекер питания и связь со специалистами.

The mobile app source lives in `FitnesApp/`. All development commands run from that directory.

## Setup

1. Copy `.env.example` to `.env` and populate `EXPO_PUBLIC_SUPABASE_ANON_KEY` from Supabase dashboard
2. All commands run from `FitnesApp/` directory: `cd FitnesApp`

## Commands

```bash
# Development
npx expo start              # Start dev server
npx expo start -c           # Clear cache (after config changes)
npm run ios                 # Start directly in iOS simulator
npm run android             # Start directly in Android emulator
npm run web                 # Start web preview

# In terminal after 'npx expo start':
# i — open iOS simulator
# a — open Android emulator  
# j — open React Native Debugger (NOT Chrome DevTools)
# w — open web

# Database
npx supabase db push --linked --yes              # Push migrations
npx supabase db dump --linked --schema public    # Dump schema

# Production builds
eas build -p ios --profile preview
eas build -p android --profile preview
```

## Architecture

### Routing (Expo Router — file-based)
```
app/
├── _layout.tsx              # Root layout, QueryClientProvider, auth redirect
├── index.tsx                # Entry: redirects to /welcome or /(tabs)
├── welcome.tsx              # Onboarding welcome screens
├── auth/                    # login.tsx, register.tsx
├── onboarding/              # Multi-step 23-parameter questionnaire
├── (tabs)/                  # Bottom tab navigator
│   ├── index.tsx            # Dashboard (home)
│   ├── workouts.tsx         # Workout list
│   ├── scanner.tsx          # Food scanner (camera)
│   └── profile.tsx          # User profile + theme switcher
└── workouts/[id].tsx        # Dynamic workout detail + video player
```

### Source (`src/`) — imported via `@/` alias
```
src/
├── lib/
│   ├── supabase.ts          # Supabase client (singleton)
│   ├── query.tsx            # TanStack Query client + AsyncStorage persister
│   └── onboarding-context.tsx  # Onboarding multi-step state
├── components/atoms/        # CustomButton (52px), CustomInput, Card
├── hooks/useAuth.ts         # Auth state + redirect logic
├── services/
│   ├── auth.ts              # Supabase Auth helpers
│   ├── api.ts               # TanStack Query data fetchers
│   ├── health.ts            # HealthKit (iOS steps) integration
│   └── notifications.ts     # expo-notifications (water/workout reminders)
└── types/index.ts           # Shared TypeScript types
```

### Backend (Supabase)
- **Project ID:** `asihntqqeipaxsdilkyv`
- **Tables:** `profiles`, `user_settings` — with RLS policies and triggers
- **Storage buckets:** configured in migration `00002`
- **Edge Function:** `supabase/functions/analyze-food-vision/` — calls Vision AI (Polza.ai), returns КБЖУ for a food photo

### TypeScript Path Aliases
All `@/` paths resolve to `src/` (configured in `tsconfig.json`):
- `@/lib/*` — shared utilities, Supabase client, Query provider
- `@/components/*` — React components (atoms, molecules)
- `@/hooks/*` — custom React hooks
- `@/services/*` — API calls, HealthKit, notifications
- `@/types/*` — TypeScript types
- `@/utils/*` — helper functions
- `@/screens/*` — full-screen components (less common, prefer app/ routing)
- `@/assets/*` — images, icons, fonts

## Key Libraries & Patterns

| Concern | Library |
|---|---|
| Styling | NativeWind v4 (Tailwind utility classes) |
| Navigation | Expo Router v6 |
| Data fetching + cache | TanStack Query v5 |
| Offline persistence | `@tanstack/react-query-persist-client` + AsyncStorage |
| Lists | `@shopify/flash-list` |
| Animations | `react-native-reanimated` v4 |
| Video | `expo-video` |
| Camera | `expo-camera` |
| Charts | `react-native-chart-kit` + `react-native-svg` |
| Icons | `lucide-react-native` |
| Health data | `react-native-health` (HealthKit, iOS only) |

## Design System Rules

**Color palette** (in `tailwind.config.js`):
- **Primary purple:** `primary-600: #7C3AED` (default), shades from `primary-50` to `primary-900`
- **Accent pink:** `accent-500: #EC4899` (default), full spectrum available
- **Dark mode:** `dark-700: #18181B` (darkest bg), `dark-950: #050509` (deepest)
- Use `dark:` classes for theme support; theme toggle in profile (System/Light/Dark)

**Patterns**:
- **Buttons:** always `h-button` (52px) or taller; use `CustomButton` component
- **Text scale:** `text-sm`, `text-base`, `text-lg`, `text-xl` via TailwindCSS
- **Spacing:** Material Design grid (8px/16px/24px/32px); NativeWind shorthand
- **Bottom navigation:** 4 immutable tabs (Home, Workouts, Scanner, Profile)
- **Zero-input principle:** auto-fill from sensors/HealthKit wherever possible

**Config files**:
- `tailwind.config.js` — color tokens, height helpers, font families
- `babel.config.js` — Expo preset and module alias support
- `app.json` — Expo config, plugins (router, camera, health, notifications), iOS/Android settings

## Supabase Security Rules

- All `SECURITY DEFINER` functions **must** include `SET search_path = ''`
- Trigger functions must revoke `EXECUTE` from `PUBLIC`, `anon`, `authenticated`
- RLS helper functions: keep `GRANT EXECUTE` for `authenticated` role only
- Migration naming: `supabase/migrations/000{XX}_{description}.sql`

## Development Guidelines

1. **Testing:** After each change, verify in simulator/device and check console (press `j` in Expo terminal for debugger).
2. **Full file edits:** Always output complete file contents when writing — never partial diffs.
3. **Config errors first:** Fix Expo/React Native config issues before touching business logic.
4. **Physical device testing:** Camera (scanner), HealthKit, and notifications must be tested on actual device.
5. **Styling:** Use TailwindCSS utility classes; avoid inline styles. Dark mode requires `dark:` prefix.

## Debugging Tips

**Console logs and errors:**
- Press `j` in Expo terminal to open React Native Debugger (shows console, network, Redux DevTools)
- DO NOT use Chrome DevTools — React Native Debugger is required for RN-specific debugging
- Network requests visible in RN Debugger Network tab

**Common issues:**
- **Metro bundler cache stale:** Run `npx expo start -c` (clears cache)
- **Module not found:** Verify `@/` import path matches `tsconfig.json`; check case sensitivity
- **Tailwind not applying:** Ensure class name matches content glob in `tailwind.config.js`
- **Native module errors:** Re-run `npx expo prebuild` if plugins change
- **HealthKit permission denied:** Check `app.json` plugin config and iOS privacy strings
- **Supabase auth fails:** Verify `.env` has correct `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Project Status

**Authoritative source:** See `PROJECT_STATE.md` for current task breakdown and next steps. Updated when major milestones complete. As of April 2026:
- **Stages 1–6 complete:** init, UI kit, auth/onboarding, core modules, AI scanner, offline mode
- **Stage 7 in progress:** dark theme done, UI polish ongoing — EAS Build and trainer admin panel pending
