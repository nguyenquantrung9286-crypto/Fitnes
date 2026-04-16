# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Fitnes** — единая цифровая экосистема здоровья. Мобильное приложение на React Native + Expo, объединяющее персонального тренера с ИИ, трекер питания и связь со специалистами.

The mobile app source lives in `FitnesApp/`. All development commands run from that directory.

## Commands

```bash
cd FitnesApp

# Start dev server
npx expo start

# Start with cleared cache (use after config changes)
npx expo start -c

# Platform shortcuts (after server is running, press in terminal)
# i — iOS simulator
# a — Android emulator
# j — React Native DevTools (NOT Chrome)

# Supabase
npx supabase db push --linked --yes     # push migrations
npx supabase db dump --linked --schema public  # dump schema

# EAS builds
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
All `@/` paths resolve to `src/`:
`@/lib/*`, `@/components/*`, `@/hooks/*`, `@/services/*`, `@/types/*`, `@/utils/*`

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

- **Colors:** deep purple + pink gradient (defined in `tailwind.config.js`)
- **Buttons:** always 52px+ height (`CustomButton` enforces this)
- **Theme:** full `dark:` class support via NativeWind; theme toggle in profile (System/Light/Dark)
- **Bottom sheet/navigation:** bottom bar with 4 tabs (Home, Workouts, Scanner, Profile)
- **Zero-input principle:** auto-fill from sensors/HealthKit wherever possible

## Supabase Security Rules

- All `SECURITY DEFINER` functions **must** include `SET search_path = ''`
- Trigger functions must revoke `EXECUTE` from `PUBLIC`, `anon`, `authenticated`
- RLS helper functions: keep `GRANT EXECUTE` for `authenticated` role only
- Migration naming: `supabase/migrations/000{XX}_{description}.sql`

## Current Development Status

See `PROJECT_STATE.md` for the authoritative task list. As of the last update:
- **Stages 1–6 complete:** init, UI kit, auth/onboarding, core modules, AI scanner, offline mode
- **Stage 7 in progress:** dark theme done, UI polish done — remaining: EAS Build config (7.3) and Next.js trainer admin panel (7.4)

## Development Rules (from step.md)

1. After implementing each step, ask the user to verify in simulator/device and check console for errors.
2. Always output **full file contents** when writing or modifying files — never partial fragments.
3. Fix configuration errors (especially React Native/Expo) before moving to business logic.
4. The Food Scanner (camera) must be tested on a **physical device**, not the simulator.
