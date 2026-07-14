---
name: verify
description: How to build, run, and drive this wedding-invitation app to verify changes end-to-end.
---

# Verifying changes in Taklifnoma

## Build & launch
- `npm run check` is broken at baseline (`tsconfig.json` has `"ignoreDeprecations": "6.0"`, invalid for the installed TS 5.8). To typecheck, copy tsconfig with the value `"5.0"` and run `npx tsc -p` on it; diff errors against a stashed baseline (~48 pre-existing errors in storage.ts/budget-planner et al.).
- `npm run build` = vite client build + esbuild server bundle; postbuild migration script skips outside production.
- Dev server: `npm run dev` (needs `.env` with `DATABASE_URL`), serves SPA+API on **http://localhost:5001**. Boot runs `ensureWeddingsSchema()` (server/db.ts) which `ADD COLUMN IF NOT EXISTS`-heals the weddings table — new wedding columns MUST be added there as well as shared/schema.ts.

## Driving the app (Playwright via python3.14, /Library/Frameworks/.../bin/python3.14)
- Template demos: `/demo?template=velvet|pearl|aurora|imperial|turkish|epic|flower` — render real template components with hardcoded demo data (DemoWedding.tsx). `modern` shows a separate preview component, NOT azamat-template; verify azamat via a real wedding.
- Most templates gate behind a welcome overlay: epic/flower have a "To'y saytiga kirish" button; velvet/pearl/aurora/azamat dismiss on a click anywhere; turkish/imperial have slide-to-unlock (drag knob left→right ~400px).
- Real-wedding flow: register via `POST /api/auth/register {email,password,name}` → returns token. Create via `POST /api/weddings` (whitelists fields — see routes.ts). Public page `/wedding/:uniqueUrl` requires `is_approved=true` (flip directly in DB for tests).
- SPA auth: localStorage keys are `authToken` (+`token` for guest-manager compat) and `currentUser` (JSON). Inject via `ctx.add_init_script` before goto; the login form also works ("Kirish").
- Manage page `/manage/:uniqueUrl`: section nav buttons are duplicated (mobile+desktop) — click the *visible* match. Owner PATCHes go to `PATCH /api/weddings/:id` with Bearer token.
- Clean up test users/weddings from the dev DB afterwards (node + pg with DATABASE_URL from .env).
