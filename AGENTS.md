# AGENTS.md

Community space booking app (Spanish UI). Next.js 16 App Router + React 19, NextAuth v4, MongoDB/Mongoose, Tailwind v4, shadcn/ui.

## Commands

- Dev: `pnpm dev` (pnpm is the local package manager; `pnpm-lock.yaml` is gitignored)
- Lint: `pnpm lint` (runs `eslint .`; `next lint` no longer exists in Next 16)
- Typecheck: `pnpm exec tsc --noEmit` (no script defined)
- Build: `pnpm build`
- No tests configured.

## Env

- Required: `NEXTAUTH_SECRET`, `MONGODB_URI`.
- Optional features: `EMAIL_USER`/`EMAIL_PASSWORD` (nodemailer), `NEXT_PUBLIC_VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT` (web-push).
- `.env` is gitignored — never commit real secrets.

## Architecture

- `@/*` aliases to `src/*` (see tsconfig.json).
- Auth: NextAuth v4 credentials provider with JWT sessions, config in `src/lib/auth.ts`; handler at `src/app/api/auth/[...nextauth]/route.ts`.
- Roles: `user | admin | it_admin | conserje` (`src/models/User.ts`).
- Page/route gating lives in `src/proxy.ts` — Next 16's replacement for `middleware.ts`; exports `proxy`, not `middleware`. Protected pages live under `src/app/(protected)/`.
- API route protection: call `authenticate(req, requiredRoles?)` from `src/lib/auth-utils.ts`.
- DB: always `await connectDB()` from `src/lib/mongodb` before any Mongoose query (global-cached connection).
- Models live in `src/models/`; API routes in `src/app/api/`.

## Conventions / gotchas

- shadcn UI imports: `@/components/ui` (components in `src/components/ui`, style "new-york").
- Tailwind v4 uses CSS config in `src/app/globals.css`; `components.json` still points at a non-existent `tailwind.config.js` and `src/styles/globals.css`, so the shadcn CLI may need those paths corrected.
- No `next.config.*` exists.
- ESLint intentionally keeps `@typescript-eslint/no-explicit-any` and two react-hooks v6 rules as warnings (see `eslint.config.mjs`) — do not "fix" these without being asked.
