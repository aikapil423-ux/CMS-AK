# Test VM demo login

For the isolated test VM, add these variables to the app runtime environment (not a committed secrets file):

```dotenv
ENABLE_DEMO_LOGIN=true
CMS_ALLOWED_ORIGINS=http://112.196.123.220:18091
CMS_SESSION_SECRET=<random secret of at least 32 characters>
CMS_DEVELOPER_ADMIN_PASSWORD=<unique developer administrator password>
```

Pull main, install dependencies with `npm ci`, run `npm run build`, then restart the app using its existing process manager. Ensure that process manager receives the environment above. These are runtime settings; NEXT_PUBLIC_ENABLE_DEMO_LOGIN is not needed.

The login page reads demo availability from `/api/auth/session`. Demo cards sign in with one click when enabled; they do not depend on seeded database passwords. Developer Admin signs in as `DEV-ADMIN` with the configured password. Only that administrator can use the in-app persona switcher. After switching to an officer, log in again as Developer Admin to regain administrator access.

When demo mode is enabled, the Developer Access card is also one-click: it signs in as `DEV-ADMIN` with the demo PIN. On an operational deployment (demo mode off) the card only prefills the PNO and the configured `CMS_DEVELOPER_ADMIN_PASSWORD` is still required.

Check the session endpoint response: an unauthenticated response is HTTP 401 and includes `demoEnabled: true`. After clicking a demo account, POST and subsequent GET of `/api/auth/session` should succeed. If the cards are hidden, verify ENABLE_DEMO_LOGIN in the running process and restart it.

`NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true` is also accepted as a compatibility alias, so an older test VM environment keeps working after the upgrade.

## Troubleshooting

- **Cards visible but one-click login shows "Invalid PNO or PIN"**: the VM is still serving an older build. The pre-upgrade server checked database credentials before the demo PIN, so a seeded PNO with a different password returned 401. Pull `main`, run `npm run build`, then restart the process. Confirm the new build by calling `GET /api/auth/session`: an unauthenticated body must include `demoEnabled`.
- **HTTP 403 "Invalid request origin"**: the browser Origin (for example `http://112.196.123.220:18091`) is not recognised because a reverse proxy rewrites `Host`. Add the exact browser origin to `CMS_ALLOWED_ORIGINS` and restart. Comma-separated `X-Forwarded-Host` values are compared individually.
- **DEV-ADMIN returns 401**: `CMS_DEVELOPER_ADMIN_PASSWORD` is missing from the process environment and demo mode is off. Set it and restart; the password is never stored in Git. In demo mode the one-click card does not need the password.

## Security warning

With demo mode on, anyone who can reach the login page can one-click into Developer Admin, which is a global `SUPER_ADMIN`. Enable demo mode only on an isolated test VM with fake data. Keep `ENABLE_DEMO_LOGIN` unset or `false` on the operational deployment so the password and database credentials are required.

Do not enable demo mode on the operational deployment containing real case records. Keep credentials out of Git.
