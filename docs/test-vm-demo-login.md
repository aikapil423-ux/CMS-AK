# Test VM demo login

Demo login is **on by default** so a freshly deployed test VM opens without any runtime configuration. Pull `main`, install dependencies with `npm ci`, run `npm run build`, then restart the app using its existing process manager.

Optional runtime settings (not committed secrets files):

```dotenv
CMS_ALLOWED_ORIGINS=http://112.196.123.220:18091
CMS_SESSION_SECRET=<random secret of at least 32 characters>
CMS_DEVELOPER_ADMIN_PASSWORD=<unique developer administrator password>
```

- `CMS_ALLOWED_ORIGINS` is only needed when a reverse proxy rewrites `Host`.
- `CMS_SESSION_SECRET` keeps signed sessions valid across restarts; without it a random per-process secret is used.
- `CMS_DEVELOPER_ADMIN_PASSWORD` is only used when demo mode is disabled.

The login page reads demo availability from `/api/auth/session`. Demo cards sign in with one click; they do not depend on seeded database passwords. The Developer Access card is also one-click: it signs in as `DEV-ADMIN` with the demo PIN. Only that administrator can use the in-app persona switcher. After switching to an officer, log in again as Developer Admin to regain administrator access.

Check the session endpoint response: an unauthenticated response is HTTP 401 and includes `demoEnabled: true`. After clicking a demo account, POST and subsequent GET of `/api/auth/session` should succeed.

## Disabling demo mode

Set `DISABLE_DEMO_LOGIN=true` in the process environment and restart. Demo cards, the demo PIN, and the one-click developer admin are then disabled; `/api/auth/session` reports `demoEnabled: false` and only database credentials or `DEV-ADMIN` with `CMS_DEVELOPER_ADMIN_PASSWORD` are accepted.

`ENABLE_DEMO_LOGIN` and `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` are still accepted for compatibility with older environments but are no longer required.

## Troubleshooting

- **Cards visible but one-click login shows "Invalid PNO or PIN"**: the VM is still serving an older build. The pre-upgrade server checked database credentials before the demo PIN, so a seeded PNO with a different password returned 401. Pull `main`, run `npm run build`, then restart the process. Confirm the new build by calling `GET /api/auth/session`: an unauthenticated body must include `demoEnabled`.
- **HTTP 403 "Invalid request origin"**: the browser Origin (for example `http://112.196.123.220:18091`) is not recognised because a reverse proxy rewrites `Host`. Add the exact browser origin to `CMS_ALLOWED_ORIGINS` and restart. Comma-separated `X-Forwarded-Host` values are compared individually.
- **DEV-ADMIN returns 401**: demo mode is disabled and `CMS_DEVELOPER_ADMIN_PASSWORD` is missing from the process environment. Set it and restart, or remove `DISABLE_DEMO_LOGIN` to re-enable the one-click demo path.

## Security warning

With demo mode on, anyone who can reach the login page can one-click into Developer Admin, a global `SUPER_ADMIN`. Keep demo mode for the isolated test VM with fake data. Set `DISABLE_DEMO_LOGIN=true` on the operational deployment containing real case records so passwords and database credentials are required.

Keep credentials out of Git.
