# Careport

See `CLAUDE.md` for full project documentation (structure, Firestore schema, notification logic, CSV format).

## Cursor Cloud specific instructions

### Environment

- **Node.js 22** is required (Vite 8 + TypeScript 6).
- Firebase credentials are injected as environment secrets (`VITE_FIREBASE_*`). The `.env` file must be generated from these at dev time — it is not committed.
- `npm install --legacy-peer-deps` is needed because `vite-plugin-pwa@1.2.0` does not yet declare Vite 8 as a supported peer.

### Running the app

```bash
npm run dev          # Vite dev server on http://localhost:5173
npm run build        # tsc -b && vite build
npm run lint         # eslint .
```

### Gotchas

- **No test suite exists.** There are no unit/integration tests configured. Validation is done via lint + build + manual testing.
- **Lint has pre-existing errors** (6 errors, 2 warnings) in contexts/hooks related to `react-hooks/set-state-in-effect` and `react-refresh/only-export-components`. These are not regressions — do not attempt to fix unless explicitly asked.
- **Firebase Auth requires a real Google account.** The app gates all routes behind Google Sign-In. Without signing in, you can only verify the auth page renders and the sign-in button triggers the OAuth flow.
- **No Firebase Emulator is configured.** The app connects directly to cloud Firestore/Auth. There is no emulator setup in `firebase.json`.
- The `.env` file should be regenerated from environment secrets on each session start (the update script handles this).
