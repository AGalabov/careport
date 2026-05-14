# Careport

Personal car care app — fuel tracking, km-based and date-based maintenance reminders, PWA.

## Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **Database**: Firebase Firestore (offline-capable)
- **Auth**: Firebase Auth (Google Sign-In + Email/Password)
- **Hosting**: Firebase Hosting
- **PWA**: vite-plugin-pwa + Workbox

## Prerequisites

- Node.js 18+
- [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`
- A Firebase project with Firestore, Google Auth, and Email/Password Auth enabled

## Local Development

1. Copy `.env.example` to `.env` and fill in your Firebase credentials
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Deploy

### First-time setup

1. Log in to Firebase:
   ```bash
   firebase login
   ```
2. Set the active project:
   ```bash
   firebase use <your-project-id>
   ```
3. Deploy Firestore security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Deploy the app

Build and deploy to Firebase Hosting:

```bash
npm run build
firebase deploy
```

This deploys both the hosting (from `dist/`) and Firestore rules/indexes.

To deploy only hosting:

```bash
npm run build
firebase deploy --only hosting
```

## Auth

Two sign-in methods: **Google** and **Email/Password**.

Email/password accounts must be created manually in the Firebase Console (Authentication → Users → Add user). There is no self-service sign-up form. To prevent unauthorized account creation, go to Firebase Console → Authentication → Settings → User actions and uncheck "Enable create (sign-up)".

## CSV Import Format

Fuel records can be imported from CSV. The header row is optional:

```
date,kilometers_passed,liters,price_per_liter,total_cost,notes
2024-01-15,45230,32.5,1.85,60.13,
```
