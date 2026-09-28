# ShiftTrack

A small iOS-first shift tracking app built with Expo, React Native, and TypeScript. The API is mocked locally; no real employee or business data is sent to a server.

## Run

```sh
npm install
npx expo start
```

Open the project in Expo Go or a development build. For the iOS simulator, run `npx expo start --ios` on a Mac with Xcode installed.

## Demo Login

- Email: `staff@shifttrack.test`
- Password: `Password123`

Incorrect credentials show an inline error. The mock session is saved with Expo SecureStore and restored at launch. Log out from the roster to clear the session.

## Try The Workflow

1. Sign in and review the current week's sample shifts.
2. Tap `+ Add shift`, enter a date and local start/end times, then save. End time must be later than start time.
3. Tap `Start shift`. The running timer is calculated from its persisted start timestamp, so it remains accurate after backgrounding or reopening the app. Tap `End shift` to close it.
4. Enable `Demo API error` at the bottom of the roster to see the loading error and retry action. Turn it off to recover.

## Structure And Decisions

- `src/app/`: Expo Router routes and root layout.
- `src/context/AuthContext.tsx`: session hydration, sign-in, and sign-out.
- `src/api/mockApi.ts`: mock login, current-week queries, create/end mutations, seeded sample shifts, and an error switch.
- `src/screens/`: login, weekly shifts, and create-shift screen components, imported by their Expo Router routes.
- `src/components/`: loading and shift-list presentation.
- `src/utils/`: local date conversion and duration calculations.
- Shift records are persisted in AsyncStorage to model a backend across app restarts; the demo session is stored separately in SecureStore.

## Unfinished / Next Steps

- Optional edit/delete shift actions are not implemented.
- Automated tests and accessibility audits are not included in this short assessment build.
- The mock API uses device-local storage and seeded sample data; a real service would own authentication, shift validation, and shared roster state.
- The date and time fields use text entry rather than native pickers.
