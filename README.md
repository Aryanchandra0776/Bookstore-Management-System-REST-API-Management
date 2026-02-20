# Bookstore Management API (Next.js + Prisma + Tailwind)

This repository is a **Bookstore Management** web application and REST API built with Next.js (App Router), TypeScript, Prisma, and Tailwind (shadcn UI). The project includes a server-side API (in `src/app/api/*`) for managing books, users, and orders, JWT authentication, and a small UI to interact with the API. The app uses Prisma and ships with a default SQLite DB (`db/custom.db`) but can be configured to use MySQL.


---

## Quick links

* Project root: `/src`
* API routes: `/src/app/api/*`
* Prisma schema: `/prisma/schema.prisma`
* Embedded DB (default): `/db/custom.db`

---

## Features

* Full CRUD for **Books** (public list & detail; admin create/update/delete)
* User registration and login with **JWT**
* Order creation and status management
* Pagination, search (`q`) and filter (`genre`) for listing books
* Prisma ORM for DB access (SQLite by default)
* API error responses follow a common JSON shape with timestamp and message
* Ready-made UI components (shadcn) and a small demo API tester

---

## Tech stack

* Next.js (App Router) + TypeScript
* Tailwind CSS + shadcn components
* Prisma ORM (SQLite default; MySQL supported)
* JOSE for JWTs, bcryptjs for password hashing
* Node runtime: project uses `bun` in scripts but works with Node/npm/pnpm as well

---

## Environment variables

Create a `.env` file in the project root with at least the following values:

```env
# Prisma (SQLite default)
DATABASE_URL=file:./db/custom.db

# JWT
JWT_SECRET=replace-with-a-secure-random-string

# Optional: change provider to mysql if you use MySQL
# DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE
```

> **Security note:** Replace `JWT_SECRET` in production and never check secrets into source control.

---

## Local development (quick start)

The repository includes scripts in `package.json`. Example commands (from project root):

```bash
# install deps (use your package manager: npm/pnpm/bun)
npm install

# generate prisma client (if you change schema)
npm run db:generate

# push schema to DB (creates tables in SQLite file)
npm run db:push

# run dev server (Next.js)
npm run dev
# the app listens on http://localhost:3000 by default
```

> The `start` script uses `bun` to run the production standalone build. If you don't have `bun`, use `node` to run the built server or run `next start`.

---

## Database / Prisma

The Prisma schema is at `/prisma/schema.prisma`. The project ships configured to use SQLite by default with the DB file at `db/custom.db`.

If you switch to MySQL, update `DATABASE_URL` in `.env` and run migrations:

```bash
npm run db:migrate
```

---

## API Overview (main endpoints)

The API is implemented under `src/app/api` with these notable routes:

* `GET /api/books` — list books (query params: `page`, `size`, `sort`, `q`, `genre`)

* `GET /api/books/:id` — get book detail

* `POST /api/books` — create book (Admin only)

* `PUT /api/books/:id` — update book (Admin only)

* `DELETE /api/books/:id` — delete book (Admin only)

* `POST /api/register` — register a new user

* `POST /api/login` — login and receive JWT token

* `GET /api/users/me` — get current authenticated user

* `GET /api/orders` — list orders (authenticated)

* `POST /api/orders` — create an order (authenticated)

* `PUT /api/orders/:id` — update order status (admin)

### Example: curl to list books

```bash
curl 'http://localhost:3000/api/books?page=1&size=10'
```

### Example: login (returns JWT)

```bash
curl -X POST http://localhost:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"password"}'
```

Use the returned `token` in an `Authorization: Bearer <token>` header for protected endpoints.

---

## JWT behaviour

* JWT secret: `JWT_SECRET`
* Token expiration: default is `7d` (see `src/lib/auth.ts`)
* Passwords hashed with `bcryptjs`



---

## Tests

* The project suggests testing with Postman and unit tests (Jest/JUnit are not preconfigured). If you add tests, consider using `vitest` or `jest` for unit tests and `supertest`/`@testing-library/react` for integration tests.

---

## Deployment notes

* Build with `npm run build` and start with `npm run start` (production) or deploy with Vercel for Next.js automatic deployment.
* If using Docker, `Dockerfile` and `docker-compose.yml` exist in the repo — adapt environment variables and mount the DB or switch to managed RDS for production.

---

## Recommended next steps / improvements

* Add OpenAPI / Swagger documentation or a Postman collection
* Add refresh tokens and token revocation for better auth control
* Add file storage for book images (S3) and serve signed URLs
* Add rate limiting and request validation middleware
* Add CI (GitHub Actions) with `npm run lint` and tests

---

## Contributing

Contributions are welcome. Please open issues or PRs and include details for how to reproduce any bug.

---

## License

Choose a license (e.g. MIT) and add a `LICENSE` file if you plan to publish the project.

---



