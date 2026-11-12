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

Check the session endpoint response: an unauthenticated response is HTTP 401 and includes `demoEnabled: true`. After clicking a demo account, POST and subsequent GET of `/api/auth/session` should succeed. If the cards are hidden, verify ENABLE_DEMO_LOGIN in the running process and restart it.

Do not enable demo mode on the operational deployment containing real case records. Keep credentials out of Git.
