# ABC Dev Portal — Project Scope

**Product:** Africa's Blockchain Club — Developer Training Portal
**Status:** Draft for build kickoff
**Last updated:** 31 August 2026

---

## 1. Purpose & Context

The ABC Dev Portal is the internal operations platform for running Africa's Blockchain Club's developer training program. It manages the full lifecycle of a trainee developer: **public application → admin review → cohort placement → weekly lessons → graded projects → progress reporting → alumni**.

A working scaffold already exists. This document defines the scope required to (a) **complete the existing scaffold to a production-ready v1**, and (b) **deliver a set of new features** that extend the portal from an admin-only tool into a trainee-facing training platform.

The primary users today are **program admins/mentors**. New scope introduces a **trainee-facing experience** and **Discord integration**.

---

## 2. Current State (Baseline)

The team is building on top of an existing codebase, not greenfield. What already exists:

**Architecture**
- Monorepo managed with Turbo + pnpm workspaces (`packages/backend`, `packages/frontend`).
- **Backend:** Node + Express + TypeScript, MongoDB via Mongoose, Zod validation, JWT auth, Helmet, CORS, rate limiting. Deploy target: Railway (`railway.toml`).
- **Frontend:** React 18 + Vite + TypeScript + Tailwind, React Router, TanStack Query, Axios, Recharts. Deploy target: Vercel (`vercel.json`).

**Data models (Mongoose)** — implemented: `Student` (with embedded `scores[]`), `Cohort`, `Lesson` (with embedded `attendance[]`), `Project` (with embedded `submissions[]`), `Registration`.

**Backend routes** — implemented to varying depth:
- `auth` — single hardcoded admin login (env-based email/password), JWT issued.
- `registrations` — public apply endpoint, admin list, approve→creates Student.
- `students`, `cohorts`, `lessons`, `projects` — CRUD + submission review/scoring.
- `reports` — `weekly` summary, `cohort-stats` (chart aggregations), per-`student` report.

**Frontend pages** — routed and scaffolded: Login, Register (public), Dashboard, Students, StudentProfile, Lessons, Projects, Registrations, Reports.

**Known gaps in the baseline**:
- Auth is a single static admin — no roles, no mentor accounts, no trainee accounts.
- Attendance is modelled but has no capture route/UI.
- Frontend pages are scaffolds; many need real data wiring, create/edit forms, and empty/loading/error states.
- No automated tests, no CI, no seed/demo data story confirmed.
- Discord fields (`discord_id`, env placeholders) exist but no integration is built. This can be an alert module. Up to developers to see how and if we need to implement Discord

---

## 3. Goals & Non-Goals

**Goals**
1. Ship a stable, deployable **v1 admin portal** that fully covers the current training workflow end-to-end. Docs must be available from mintlify
2. Add a **student-facing portal** so learners can track their own progress and submit work.
3. Introduce a **dev work layer** (portfolio, Opportunities marketplace) for graduated, commercial-ready alumni.
4. Move authentication to **NFT-based login with dynamic role-gating** across the four roles (student, dev, lecturer, admin).
5. Integrate **Discord** for registration, notifications, and attendance. (Again up to the devs, yall decide)
6. Establish **quality foundations**: role-based access control, tests, CI, and observability.

---

## 4. Roles & Permissions

The portal has four authenticated roles plus unauthenticated applicants. Access and role are granted via a **dynamic, NFT-based login**.

### 4.1 Role definitions

- **Student** — a learner in an active cohort. Sees only their own progress; submits project work.
- **Dev** — a graduated, commercial-ready alumnus. Has a read-only archive of their training history plus an outward-facing work layer: a portfolio, and access to **Opportunities** (client / open-source gigs).
- **Lecturer** — instructor/mentor scoped to their assigned cohort(s): teaching and materials, grading and scoring, attendance, and cohort oversight.
- **Admin** — full program control: user & role management, registration approval, cohort lifecycle, Opportunities management, all reporting, and system config.
- **Applicant** — unauthenticated; submits a registration application only.

### 4.2 Capability matrix

| Capability | Student | Dev | Lecturer | Admin |
|---|:--:|:--:|:--:|:--:|
| Own profile & dashboard | ✅ | ✅ (archive) | ✅ | ✅ |
| Browse own cohort lessons & materials | ✅ | ✅ (archive) | ✅ | ✅ |
| Submit / resubmit projects | ✅ | — | — | — |
| View own grades & attendance | ✅ | ✅ | ✅ | ✅ |
| Lessons: create / edit / schedule / deliver | — | — | ✅ (own cohort) | ✅ |
| Attendance: record | — | — | ✅ | ✅ |
| Projects: create / manage | — | — | ✅ (own cohort) | ✅ |
| Grade submissions & record scores | — | — | ✅ | ✅ |
| Cohort reports / stats | — | — | ✅ (own) | ✅ (all) |
| Portfolio + completion certificate | — | ✅ | — | ✅ |
| Opportunities: browse / apply / deliver | — | ✅ | — | — |
| Opportunities: create / assign | — | — | — | ✅ |
| Approve / reject registrations | — | — | — | ✅ |
| Promote student → dev | — | — | recommend | ✅ |
| Manage users & roles | — | — | — | ✅ |
| System config / audit log | — | — | — | ✅ |

**Per-role task detail**

- **Student:** log in; edit a limited profile (bio, GitHub, Discord, languages, goals, hours/week); view own dashboard (level L1–L4, cohort, latest scores + trend, commercial-ready status); browse their cohort's lessons/materials; view assigned projects with requirements and due dates; submit/resubmit projects (GitHub URL + notes) before the deadline; view grades and feedback; view own attendance; receive notifications (grade posted, new lesson/project, deadline reminders).
- **Dev:** read-only archive of cohort history and score record; portfolio profile (skills, GitHub showcase, commercial-ready badge) and downloadable completion certificate; browse and apply to Opportunities; accept/track/submit deliverables against assigned work; score/skill-based matching; opportunity notifications.
- **Lecturer:** manage lessons for their cohort (create/edit, objectives, materials, schedule, mark delivered); record attendance; create/manage projects tied to their lessons/cohort; grade submissions (four axes + feedback + status transitions + auto total); record periodic student scores; view their cohort roster, individual student reports, cohort-stats, and inactive-student flags; **recommend** a student for promotion to dev.
- **Admin:** everything above, plus user & role management (create lecturers, assign to cohorts, **promote student → dev**, deactivate); registration review (approve → Student, reject with reason); cohort lifecycle (create/edit/close, assign lecturers and students, set levels/status); Opportunities management (create gigs, assign devs); all reports incl. weekly summary + exports; system config (NFT/auth policy, Discord, email, feature flags, audit log).

### 4.3 Key role decisions

- **Promotion:** student → dev is an **admin action taken on a lecturer's recommendation**, gated by commercial-ready (latest technical ≥ 7 AND security ≥ 7). No auto-promotion.
- **Registration approval:** sits with **admin**. Lecturers may **recommend** applicants but cannot approve.
- **Authentication & role-gating is NFT-based**

---

## 5. Scope of Work

Scope is grouped into two tracks: **A — Complete the scaffold (v1)** and **B — New features (v2)**. Each item lists concrete deliverables. Acceptance criteria are in §7 and milestones in §8.

### Track A — Complete the existing scaffold (v1)

**A1. Auth & access control (RBAC foundation)**
- Replace single-admin login with a `User` model supporting the four roles (`student`, `dev`, `lecturer`, `admin`).
- Introduce `requireRole()` / `requireAnyRole()` middleware and apply it across every protected route per the §4.2 matrix; add cohort-scoping so lecturers act only on their own cohort(s).
- Frontend: role-aware protected routing, auth context, session persistence, auto-logout on 401 (partially present).
- **This RBAC layer is the contract the NFT login (B0) plugs into.** For v1, ship a conventional login (email + hashed password, bcrypt already a dependency) behind the same role model so the portal is usable before wallet auth lands; the NFT flow becomes an additional/primary auth method in v2 without changing the authorization layer.

**A2. Registrations workflow**
- Complete admin review UI: list/filter by status, view application detail, approve (→ Student), reject with reason.
- Duplicate-application handling and validation surfacing on the public form.
- Confirmation + status feedback to the applicant.

**A3. Students management**
- Full CRUD UI + detail (StudentProfile): edit profile, level (L1–L4), status (pending/active/inactive/alumni), cohort assignment, notes.
- **Score capture UI**: record the four-axis score set (technical, security, problem-solving, professionalism) with history and trend chart (ScoreChart exists).
- "Commercial ready" indicator (technical ≥ 7 AND security ≥ 7) surfaced consistently.

**A4. Cohorts**
- CRUD UI, lifecycle (upcoming/active/completed), student roster with counts, single active-cohort handling used by approval flow.

**A5. Lessons & attendance**
- Lessons CRUD UI (title, week, objectives, materials, schedule, status).
- **Attendance capture route + UI** (currently modelled but unimplemented): mark per-student attendance for a delivered lesson; attendance rate feeds reports.

**A6. Projects & grading**
- Projects CRUD UI tied to lessons/cohorts; auto-generation of pending submissions for active cohort students (backend already does this).
- **Grading UI**: per-submission GitHub URL, four score axes, feedback, status transitions (pending→submitted→reviewed→overdue), auto total score.
- Overdue detection (due-date passed, not submitted).

**A7. Dashboard & Reports**
- Dashboard: live KPIs (active students, pending approvals, lessons delivered, commercial-ready count).
- Reports page: render `weekly`, `cohort-stats`, and per-student reports with Recharts (score trends, project completion, attendance, join timeline).
- Export a report to PDF/CSV.

**A8. Platform hardening**
- Consistent API error contract, loading/empty/error states across all pages.
- Environment config validation on boot; health endpoint (exists) wired to monitoring.
- Seed/demo data script for local dev and staging.
- Deployment: finalise Railway (API) + Vercel (web) pipelines, environment separation (dev/staging/prod).

### Track B — New features (v2)

**B0. NFT-based login & dynamic role-gating**

Access and role are granted by holding a role-bearing NFT in the user's connected wallet — a "dynamic" scheme where the NFT (or its on-chain/metadata attributes) determines both access and which of the four roles applies, and can be updated as a user's status changes (e.g. promotion student → dev).

- **Wallet auth:** connect wallet (e.g. WalletConnect / injected provider), sign a nonce challenge (SIWE-style), backend verifies the signature and issues the existing JWT — so B0 sits *in front of* the A1 RBAC layer, not replacing it.
- **Role resolution:** on login, resolve the wallet's role NFT(s) and map NFT → role/cohort claims that populate the JWT and drive the §4.2 permissions.
- **Dynamic updates:** when an admin approves an application or promotes a student → dev, the corresponding role NFT is issued/updated (mint, transfer, or mutate token metadata). Revocation/deactivation invalidates access.
- **Contract & chain:** select chain and token standard (ERC-721 vs ERC-1155 for role tiers), decide soulbound vs transferable (role NFTs should almost certainly be **non-transferable/soulbound** so access can't be sold or shared), and define the metadata schema (role, cohort, level, issued/expiry).
- **Fallbacks & recovery:** account recovery if a wallet is lost; a non-wallet path for users without one (ties back to the A1 email/password method); clear UX for signature prompts and wrong-network states.
- **Admin tooling:** issue/revoke/re-issue role NFTs from the admin console; audit log of on-chain role changes.


**B1. Trainee portal**
- Trainee accounts (created on approval), trainee login.
- Trainee dashboard: own scores + trend, level, cohort, upcoming lessons, materials.
- **Self-service project submission**: trainee submits GitHub URL + notes against assigned projects; status reflects to mentors.
- Notifications of grades/feedback.


**B2. Automated reporting & notifications** (OPTIONAL)
- Scheduled weekly report generation and delivery (Discord and/or email) — the `weekly` endpoint is already designed for a Monday 9AM cadence.
- Inactivity alerts for mentors (active students with no recent activity).
- Transactional email (approval/rejection, grade posted).


**B3. Opportunities (the dev work layer) — net-new domain**

A marketplace of paid/open-source work that graduated **devs** can be matched to. This is not in the current data model and is a substantial addition.

- **New data models:** `Opportunity` (title, description, required skills/level, client/partner, compensation, status, deadlines), `Application` (dev → opportunity), `Assignment` (accepted work, deliverables, status, review).
- **Dev experience:** browse and filter opportunities; apply; get score/skill-based matching and recommendations; accept and track assignments; submit deliverables (GitHub URL + notes) and see status.
- **Admin experience:** create and publish opportunities; manage the partner/client record; review applications; assign devs; track delivery and close-out.
- **Portfolio tie-in:** completed opportunities feed the dev's portfolio profile (B1) and reputation.
- **Notifications:** new matching opportunity, application status, assignment updates.

### Cross-cutting (both tracks)
- **Testing:** unit tests for scoring/aggregation logic, integration tests for routes, key E2E flows (apply→approve, grade, trainee submit).
- **CI/CD:** lint + typecheck + test on PR; preview deploys.
- **Accessibility & responsive** pass on all pages.
- **Docs:** README per package, API reference, runbook.

---

## 6. Technical Notes & Constraints

- Keep the existing stack; do not re-platform. New services live inside the monorepo.
- MongoDB embedded-document patterns are already in use (`scores`, `submissions`, `attendance`) — preserve them unless a documented reason to normalise arises.
- Total score formula is defined in code: `round((technical + security + functionality + quality) × 2.5)` → 0–100. Keep consistent across API and UI.
- "Commercial ready" rule: latest `technical ≥ 7` and `security ≥ 7`.
- All new endpoints must use Zod validation and the `requireAuth`/`requireRole` middleware.
- Secrets via environment only (`.env.example` is the contract); never commit secrets.

---

## 7. Acceptance Criteria (v1 definition of done)

- An admin can run the full workflow with no direct DB access: review an application → approve → assign cohort → create a lesson → record attendance → create a project → grade a submission → view the student and weekly reports.
- Role-based auth enforced on every protected route; a mentor cannot access admin-only actions.
- Every page has loading, empty, and error states; no unhandled promise rejections.
- Weekly report and cohort-stats render correctly with seeded data.
- CI runs lint, typecheck, and tests green on `main`; staging deploy succeeds from a tagged release.
- Documented setup: a new dev can clone, seed, and run both packages from the README in under 15 minutes.
