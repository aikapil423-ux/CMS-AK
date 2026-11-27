This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Install Node.js dependencies and make Python 3.12 with `venv` available on your PATH. Then start the development server.

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Dictation and deployment

`npm run dev` and, outside Render, `npm start` prepare the same Whisper Large-v3 Turbo model automatically. The first run downloads about 1.62 GB, verifies the model files against pinned SHA-256 checksums, and caches them in `.whisper/model`. Run `npm run whisper:setup` to provision the model ahead of time. Set `WHISPER_SETUP_PYTHON` if your Python executable has a different name or path.

On Render Node services, `npm start` skips Whisper provisioning by default so the web server can bind immediately. Browser speech recognition remains available in supported browsers. For the server-side Whisper fallback, provision the model on persistent storage first, or set `WHISPER_SETUP_ON_START=true` to opt into provisioning during startup.

For production dictation, use a persistent Node.js host with Python and writable storage. Run `npm ci`, `npm run build`, and `npm start` from the checkout. Persist `.whisper` between starts on the same host to reuse the model and Python environment. The dictation worker requires a local Python process and model files. A standard Vercel serverless deployment does not provide this setup.
