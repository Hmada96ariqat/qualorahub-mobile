# Native API Base URL Setup (Real Devices)

## Why this matters
On physical devices, `127.0.0.1` / `localhost` points to the device itself, not your backend host machine.

## Required setting for real-device testing
Use your host machine LAN IP in `EXPO_PUBLIC_API_BASE_URL`.

Example:
```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.25:3300/api/v1 npm run ios
```

Android emulator example:
```bash
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3300/api/v1 npm run android
```

## App hardening behavior
- Startup now checks for loopback API base URLs on native runtime.
- If loopback is detected, app shows a warning alert and console warning explaining that physical devices must use a LAN host.

## Verification checklist
1. Backend is reachable from device browser using `http://<LAN_IP>:3300/api/docs`.
2. App launches with `EXPO_PUBLIC_API_BASE_URL=http://<LAN_IP>:3300/api/v1`.
3. Login succeeds and routes to protected area.
4. Relaunch restores session.
5. Logout clears session.
