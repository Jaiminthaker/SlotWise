# SlotWise

A booking and scheduling system. Providers publish weekly availability, customers pick a service and a free slot, and the server guarantees no double-booking.

This README is also the instruction file for GitHub Copilot. Read the **Copilot Instructions** section before generating any code.

---

## Copilot Instructions

**Goal:** generate the project boilerplate (folders, config, models, routes, controllers, services, React pages, API client) so the developer can focus on the core logic.

**Rules**
1. Use JavaScript with ES modules (`import`/`export`). No TypeScript.
2. Generate structure and stubs, not the core logic. For every function marked `TODO(core)` below, create the file, the exported function, JSDoc with inputs and outputs, and a body that throws `new Error("Not implemented")`. Do not fill in the algorithm.
3. Everything else (auth, CRUD, validation, error handling, React UI shell, API client) should be fully working.
4. Keep controllers thin: controller -> service -> model. Business rules live in `services/`, never in controllers or routes.
5. Store all datetimes in UTC (`Date`). Convert to the provider's timezone only with Luxon.
6. Validate every request body and query with Zod. Return errors as `{ "error": { "code": "STRING", "message": "string" } }`.
7. Use async/await and a shared `asyncHandler` wrapper. No callbacks.
8. Add a `.env.example` and never commit real secrets.

**Core logic left for the developer (`TODO(core)`)**
- `backend/src/services/bookingService.js` -> `createBooking`, `cancelBooking`, `rescheduleBooking` (including SlotLock handling)
- `backend/src/services/cancellationPolicy.js` -> `canCancel(booking, now)`

Slot generation and overlap detection are implemented with unit tests. Generate empty Jest test files next to the remaining core modules with `describe`/`it.todo` placeholders.

---

## Tech Stack

**Backend:** Node.js, Express, MongoDB with Mongoose, JWT auth (access token in an httpOnly cookie), bcrypt, Zod, Luxon, Jest, Supertest, mongodb-memory-server, dotenv, cors, helmet, morgan, express-rate-limit.

**Frontend:** React (Vite), React Router, TanStack Query, Axios, React Hook Form with Zod resolver, Tailwind CSS, Luxon.

---

## Folder Structure

```
slotwise/
├── README.md
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── server.js            # starts the server
│       ├── app.js               # express app, middleware, routes
│       ├── config/              # env.js, db.js
│       ├── models/              # User, Service, Provider, AvailabilityRule,
│       │                        # DayOverride, Booking, SlotLock
│       ├── routes/              # auth, services, providers, bookings, admin
│       ├── controllers/
│       ├── services/            # slotGenerator, bookingService, cancellationPolicy
│       ├── middleware/          # auth, requireRole, validate, errorHandler
│       ├── validators/          # Zod schemas
│       ├── utils/               # asyncHandler, overlap, time helpers
│       └── tests/
└── frontend/
    ├── package.json
    ├── .env.example
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api/                 # axios instance + one file per resource
        ├── hooks/               # useAuth, useSlots, useBookings
        ├── context/             # AuthContext
        ├── components/          # Navbar, ProtectedRoute, SlotGrid, DatePicker,
        │                        # BookingCard, WeeklyCalendar, Loader, ErrorMessage
        └── pages/               # Login, Register, Services, BookSlot,
                                 # MyBookings, ProviderDashboard,
                                 # AvailabilityEditor, AdminServices
```

---

## Data Models (Mongoose)

| Model | Fields |
|---|---|
| **User** | name, email (unique), passwordHash, role (`admin` \| `provider` \| `customer`), timestamps |
| **Service** | name, durationMin, bufferAfterMin, active |
| **Provider** | userId (ref User), serviceIds[] (ref Service), timezone (IANA string, e.g. `Asia/Kolkata`) |
| **AvailabilityRule** | providerId, dayOfWeek (0-6), startMin, endMin (minutes from local midnight) |
| **DayOverride** | providerId, date (`YYYY-MM-DD`), type (`off` \| `custom`), ranges[{ startMin, endMin }] |
| **Booking** | providerId, customerId, serviceId, start (UTC), end (UTC, includes buffer), status (`confirmed` \| `cancelled` \| `completed` \| `no_show`), timestamps |
| **SlotLock** | providerId, unitStart (UTC), bookingId. **Unique compound index on `(providerId, unitStart)`.** |

Time is divided into fixed 15-minute units. A booking creates one SlotLock per unit it covers. The unique index is what prevents double-booking.

---

## API

Base path: `/api`. All responses are JSON.

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/auth/register` | public | create customer account |
| POST | `/auth/login` | public | login, sets cookie |
| POST | `/auth/logout` | any | clear cookie |
| GET | `/auth/me` | any | current user |
| GET | `/services` | public | list active services |
| POST/PATCH/DELETE | `/admin/services` | admin | manage services |
| POST | `/admin/providers` | admin | create provider from a user |
| GET | `/providers?serviceId=` | public | providers offering a service |
| GET | `/providers/:id/slots?serviceId=&date=YYYY-MM-DD` | public | computed free slots |
| PUT | `/providers/me/availability` | provider | replace weekly rules |
| POST | `/providers/me/overrides` | provider | add day off or custom hours |
| GET | `/providers/me/bookings?from=&to=` | provider | provider calendar |
| POST | `/bookings` | customer | book a slot |
| GET | `/bookings/me` | customer | my bookings |
| PATCH | `/bookings/:id/cancel` | customer, provider | cancel |
| POST | `/bookings/:id/reschedule` | customer | move to a new slot |

Status codes: `409` when a slot is already taken, `422` for validation errors, `403` when the cancellation policy blocks an action.

---

## Frontend Requirements

- Auth context with login, logout and role-based `ProtectedRoute`.
- Booking flow: choose service -> choose provider -> pick date -> pick slot -> confirm.
- Show slot times in the viewer's local timezone.
- `MyBookings` with cancel and reschedule actions.
- Provider dashboard with a weekly calendar view and an availability editor.
- Loading and error states on every data fetch (TanStack Query).

---

## Environment Variables

**backend/.env.example**
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/slotwise
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
SLOT_UNIT_MIN=15
MIN_NOTICE_HOURS=2
FREE_CANCEL_HOURS=24
```

**frontend/.env.example**
```
VITE_API_URL=http://localhost:5000/api
```

---

## Local Setup

Requirements: Node.js 20 or newer and a MongoDB instance. Copy `backend/.env.example` to `backend/.env` and adjust `MONGO_URI` or other settings as needed. Copy `frontend/.env.example` to `frontend/.env` if the API is not at its default URL.

From the repository root, install dependencies and start both applications:

```sh
npm install
npm --prefix backend install
npm --prefix frontend install
npm run dev
```

The frontend runs at `http://localhost:5173` and the API at `http://localhost:5000`. With MongoDB running, `npm run seed` creates sample services and provider accounts plus an admin account. The seeded accounts use the password `ChangeThis123!`; change it before using the seed data outside local development.

Password reset email is sent through SMTP. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and `MAIL_FROM` in `backend/.env`. Without SMTP configured, development prints reset links in the backend terminal; production requires an SMTP host and sender address.

## Scripts

**backend:** `npm run dev` (nodemon), `npm start`, `npm test`, `npm run seed` (creates an admin, two providers, sample services)

**frontend:** `npm run dev`, `npm run build`, `npm run preview`

---

## Build Order

1. Auth and roles
2. Services, providers, availability rules (CRUD)
3. `generateSlots` with unit tests
4. Naive booking, then a concurrency test that fails
5. SlotLock-based booking, and the same test passes
6. Cancel and reschedule with policy
7. Day overrides feeding into slot generation
8. Frontend screens and polish

---

## Edge Cases to Cover in Tests

- Booking ends exactly when another starts (allowed)
- Service longer than the remaining window
- Two customers booking the same slot simultaneously
- Day override added after bookings already exist
- Reschedule target taken mid-request
- Booking in the past or inside the minimum-notice window
- Same customer booking overlapping times with different providers
- Timezone and DST boundaries

---

## Out of Scope (v1)

Payments, email/SMS notifications, recurring bookings, waitlist. Consider after the core logic is solid.
