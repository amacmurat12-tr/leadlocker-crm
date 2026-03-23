# LeadLocker: Real Estate CRM

## Overview
A polished Expo React Native app for real estate agents to manage client leads. Targets App Store publication.

## Architecture
- **Frontend**: Expo Router (file-based routing), React Native, TypeScript
- **Backend**: Express.js + TypeScript (port 5000)
- **State**: AsyncStorage (leads), SecureStore (auth JWT), React Context

## Key Features
- Lead management: add/edit/delete, call, WhatsApp, email
- 3 theme modes: Light, Dark Black, Dark Navy (default)
- 8-language support (hardcoded translations in `constants/i18n.ts`)
- Property Match filter system with compatibility score (0–100%)
- Currency selector for budget (TRY, USD, EUR, GBP, CAD, AUD)
- Voice entry: keyboard dictation → text → smart parser fills form
- **User auth**: Register, Login, Profile tab, Delete account
- **Forgot password**: 6-digit OTP flow (see notes below)

## File Structure
```
app/
  _layout.tsx          # Root layout — auth routing, ThemeProvider, AuthProvider, LeadsProvider
  (tabs)/
    _layout.tsx        # Tab layout (NativeTabs / ClassicTabs)
    index.tsx          # Dashboard
    leads.tsx          # Leads list with Property Match filter
    profile.tsx        # Profile tab — user info, stats, logout, delete account
    settings.tsx       # Theme + language picker
  (auth)/
    _layout.tsx        # Auth stack layout
    login.tsx          # Login screen
    register.tsx       # Register screen (email, username, password, confirm)
    forgot-password.tsx # 3-step: email → OTP → new password
  lead/[id].tsx        # Lead detail (call, WhatsApp, email buttons)
  new-lead.tsx         # Add/edit lead form with currency picker + voice entry
contexts/
  ThemeContext.tsx     # Theme (3 modes) + language (8 langs) + translations
  LeadsContext.tsx     # CRUD leads, stats, AsyncStorage persistence
  AuthContext.tsx      # JWT auth, SecureStore, register/login/logout/delete/forgotPassword
server/
  index.ts            # Express app setup
  routes.ts           # Auth API: /api/auth/register|login|me|forgot-password|reset-password|account
  storage.ts          # FileStorage — users/resetTokens persisted to data/users.json
  auth.ts             # JWT sign/verify + requireAuth middleware
constants/
  colors.ts           # Theme color palettes
  i18n.ts             # All translations (8 languages, hardcoded)
  currencies.ts       # 6 currencies + formatBudget helper
```

## Auth System
- **Backend**: bcryptjs password hashing, JWT tokens (30d expiry), file-based JSON storage (`data/users.json`)
- **Frontend**: JWT stored in `expo-secure-store` (iOS/Android) or `localStorage` (web)
- **Routes**: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me, POST /api/auth/forgot-password, POST /api/auth/reset-password, DELETE /api/auth/account

## Forgot Password / Email
- Resend email integration was DISMISSED by user
- In dev mode (no RESEND_API_KEY): OTP is shown directly in the UI for testing
- For production email: set `RESEND_API_KEY` environment secret — the backend will automatically use it to send emails via `resend.dev`
- No code changes needed — the backend checks `process.env.RESEND_API_KEY` at runtime

## Subscription / Paywall
- Free trial: 7 days from `user.createdAt` (tracked in-app)
- Plans: Monthly $9.99, Yearly $99.99 (≈ $8.33/mo)
- PaywallModal auto-shows 800ms after trial expires (no dismissal without subscribing)
- During trial: trial badge + days remaining shown, paywall not forced
- Profile tab shows subscription status badge (Pro/Trial/Expired) + upgrade card
- RevenueCat (react-native-purchases) integrated; in Expo Go runs in Preview Mode
- For production: configure RevenueCat dashboard + set REVENUECAT_PUBLIC_KEY
- Context: `contexts/SubscriptionContext.tsx`; UI: `components/PaywallModal.tsx`

## Notes
- Lead data stored in AsyncStorage on device (not synced to backend)
- Auth user data stored on server in `data/users.json`
- Leads are local per device; auth is server-side
