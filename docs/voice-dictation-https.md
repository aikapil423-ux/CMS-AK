# Voice dictation on the test VM (secure-context requirement)

## Problem

Browsers only expose microphone APIs (`navigator.mediaDevices`,
`getUserMedia`, `webkitSpeechRecognition`) in a **secure context** — HTTPS or
`localhost`. The CMS test deployment is served over plain HTTP:

    http://112.196.123.220:18091   (NAT -> VM 10.10.10.3:8091)

On that origin `navigator.mediaDevices` is `undefined`, so the dictation button
can never open the microphone, no matter what the server does. The UI now says
so explicitly instead of showing a generic "permission denied".

`crypto.randomUUID` is missing for the same reason; the app polyfills it in
`src/app/layout.tsx` so complaint/FIR submission works over HTTP.

## What works today (no browser warning, no CA install)

Run `Desktop\CMS-Voice-Chrome.bat` on the workstation. It starts Chrome with a
dedicated profile where this one origin is treated as secure:

    chrome.exe --user-data-dir=%LOCALAPPDATA%\cms-voice-profile \
               --unsafely-treat-insecure-origin-as-secure=http://112.196.123.220:18091 \
               --allow-running-insecure-content \
               http://112.196.123.220:18091/login

Verified on Chrome 157: `window.isSecureContext === true`,
`typeof navigator.mediaDevices === "object"`, `getUserMedia` present. The
dictation button then reaches the server, which transcribes through Gemini
(`GEMINI_API_KEY` in the host `.env`, model `CMS_DICTATION_MODEL`).

This is a per-launch workaround for a test box. Bookmark the .bat, not the URL.

## Proper fix

A real certificate for a real hostname. Point a DNS name (e.g.
`cms-test.<dept-domain>`) at 112.196.123.220, then let the platform Caddy
terminate TLS with Let's Encrypt — no CA install, no Chrome flags, and the
microphone prompt appears normally.

### Why the internal-CA listener on :8092 is not enough

`docker-compose.yml` runs a Caddy service (`18k-cms-tls`) that terminates TLS
with Caddy's local CA and proxies to `cms:8091`; public URL
`https://112.196.123.220:18092`.

The listener itself is healthy (OpenSSL completes the handshake and gets
`HTTP/1.1 200 OK`), but **Chrome fails the handshake with
`ERR_SSL_PROTOCOL_ERROR` against every Caddy instance on this VM** — including
the pre-existing `platform-caddy` on 18081/8081. So this is not specific to the
CMS container; it is a Chrome ↔ Caddy ↔ NAT issue on this host that needs its
own investigation. Until that is resolved (or a real certificate is issued),
use the launcher above.

Trusting Caddy's root CA on the workstation also requires an interactive
confirmation dialog (Windows blocks silent root-store writes), so it cannot be
automated from a script.
