# Contributing to Sothis Echo

Thanks for helping improve Sothis Echo. This project is an independent,
open-source educational prototype built around NASA–ISRO's NISAR mission.

## Local setup

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev      # Vite dev server
npm run api      # local NISAR / Sentinel-1 backend on port 3001
```

To let the frontend use the local backend, create `.env.local`:

```bash
VITE_API_BASE_URL=http://127.0.0.1:3001/api
```

Never commit `.env.local`, tokens, or other credentials. Without a base URL the
app runs on its labelled local dataset and makes no API requests.

Other useful commands:

```bash
npm run build    # production build
npm run preview  # preview the production build
```

## End-to-end tests

The Playwright suite covers the comparison slider, sonification, detective game,
guided tour, typography/contrast, the observation ledger, and RTL layout.

```bash
npx playwright install chromium   # first run only
npm run test:e2e
```

Run a single spec while iterating:

```bash
npx playwright test tests/e2e/app.spec.js
```

Please add or update tests when behavior changes, and make sure the suite passes
before opening a pull request.

## Pull request guidelines

1. Fork the repository and branch from `main`.
2. Keep each pull request focused on one change; avoid unrelated refactors or
   formatting churn.
3. Follow the existing code style and reusable UI primitives.
4. Do not edit generated files or commit build output, caches, or secrets.
5. Describe the problem and the fix, and list the checks you ran.
6. Include a screenshot or short recording for visible UI changes.
7. Link related issues with `Fixes #123` when applicable.
8. Keep commit messages short and imperative.

By contributing, you agree that your contributions are licensed under the
project's [MIT License](./LICENSE) and that you will follow the
[Code of Conduct](./CODE_OF_CONDUCT.md).
