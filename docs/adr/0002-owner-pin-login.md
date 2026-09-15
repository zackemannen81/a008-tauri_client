# ADR 0002 — Owner PIN is the 0.1 desktop login

Status: Accepted
Date: 2026-09-15
Task: ATC-0004
Amends: ADR 0001

## Context

A008 V2 has two auth profiles: `device` (Bearer secret from `npm run device --
grant`) and `browser-pin` (HttpOnly cookie from `POST /auth/login`). The
operator already uses a six-digit PIN in the A008 GUI. Device grants are
owner-local CLI secrets for separate native clients; they are not printed by
the GUI and are not required for this desktop client while it shares the host
through the Vite proxy.

`GET /v1/projects` is the implemented project inventory. It is gated by the
same PIN cookie. `GET /v2/projects` does not exist yet.

## Decision

1. Connect unlocks with the existing owner PIN. The PIN is not stored; the
   host cookie (`a008_auth`, 24 hours, HttpOnly) is the session.
2. After unlock, the client lists registered projects (name + root folder)
   from `GET /v1/projects` and opens a V2 session for the selected id.
3. Cookie-backed `POST /v2/auth/ticket` omits `Authorization`. An invalid
   Bearer must not be sent: the host will not fall back to the cookie.
4. Device Bearer remains in the adapter for later native-proof work. It is
   not the 0.1 Connect UI.

## Consequences

The desktop client can attach to `oldschool` (or any registered project) the
same way the operator already authenticates. Creating projects still belongs
to the A008 GUI until V2 project admin exists.
