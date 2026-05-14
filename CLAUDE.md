# Careport

Personal car care app — fuel tracking, km-based and date-based maintenance reminders, PWA.

## Stack

- **Frontend**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite` plugin — no config file needed)
- **Database**: Firebase Firestore (offline-capable via `persistentLocalCache`)
- **Auth**: Firebase Auth (Google Sign-In + Email/Password)
- **Hosting**: Firebase Hosting
- **PWA**: `vite-plugin-pwa` + Workbox

## Setup

1. Copy `.env.example` to `.env` and fill in Firebase credentials
2. Create a Firebase project at console.firebase.google.com
3. Enable Firestore, Google Authentication, and Email/Password Authentication
4. Deploy Firestore rules: `firebase deploy --only firestore:rules`
5. `npm run dev`

## Project Structure

```
src/
├── components/
│   ├── cars/CarForm.tsx           — add/edit car modal
│   ├── fuel/
│   │   ├── FuelRecordForm.tsx     — add/edit fuel record modal
│   │   └── FuelRecordItem.tsx     — single record card
│   ├── layout/
│   │   ├── Layout.tsx             — app shell with header + bottom nav
│   │   └── BottomNav.tsx          — bottom tab navigation
│   └── reminders/
│       ├── ReminderForm.tsx       — add/edit reminder modal (km or date)
│       └── ReminderItem.tsx       — single reminder card with status dot
├── contexts/
│   ├── AuthContext.tsx            — Firebase auth state + signIn/signInWithEmail/signOut
│   └── CarContext.tsx             — cars list, active car, CRUD; auto-selects if 1 car
├── hooks/
│   ├── useFuelRecords.ts          — Firestore CRUD for fuel records
│   └── useReminders.ts            — Firestore CRUD for reminders + markServiced
├── lib/
│   ├── firebase.ts                — Firebase app, auth, and db exports
│   ├── firestoreMappers.ts        — map Firestore `odometer` / `initialOdometer` to app types
│   └── notifications.ts           — requestPermission, checkKmReminders, checkDateReminders
├── pages/
│   ├── AuthPage.tsx               — Google + email/password sign-in
│   ├── DashboardPage.tsx          — last fill-up stats + reminder summary + add button
│   ├── FuelLogPage.tsx            — full fuel history list
│   ├── RemindersPage.tsx          — reminders management
│   └── SettingsPage.tsx           — car config, notifications, CSV import/export
└── types/index.ts                 — Car, FuelRecord, Reminder interfaces
```

## Firestore Schema

All data lives under `users/{userId}/`:
- `cars/{carId}` — Car documents (`initialOdometer` in Firestore = kilometers passed when the car was added)
- `fuelRecords/{recordId}` — FuelRecord documents (indexed by carId + date desc; `odometer` in Firestore = kilometers passed at that fill-up)
- `reminders/{reminderId}` — Reminder documents

## Notification Logic

**Km-based** (triggered when a fuel record is saved):
- `notifications.ts:checkKmReminders` — for each active km reminder, if `currentKilometersPassed >= lastServiceKm + intervalKm - threshold` and threshold not yet notified → show notification + record in `notifiedKmThresholds`
- Reset `notifiedKmThresholds` → call `markServiced(reminderId, currentKilometersPassed)` from the ✓ button on ReminderItem

**Date-based** (triggered on app open / DashboardPage mount):
- `notifications.ts:checkDateReminders` — for each active date reminder, if `daysRemaining <= threshold` and threshold not yet notified → show notification + record in `notifiedDayThresholds`
- Reset `notifiedDayThresholds` → update the reminder with a new `dueDate`

## Auth

Two sign-in methods: **Google** and **Email/Password**.

Email/password accounts must be created manually in Firebase Console (Authentication → Add user). There is no sign-up form. To prevent unauthorized account creation via the REST API, disable self-service sign-up in Firebase Console → Authentication → Settings → User actions → uncheck "Enable create (sign-up)".

## CSV Import Format

```
date,kilometers_passed,fuel_type,liters,price_lpg,price_petrol,total_cost,notes
2024-01-15,45230,lpg,32.5,0.80,1.85,26.00,
```

Header row is optional (detected by checking if the first cell is not a number). Settings import expects columns in order: kilometers passed, liters, price_lpg, price_petrol, optional notes (dates are assigned from the date picker).

## Deploy

```bash
npm run build
firebase deploy
```
