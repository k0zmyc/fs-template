# Full-Stack App Template

Production-ready Next.js template with authentication, database, and full CRUD UI.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Auth | NextAuth v5 (JWT, Credentials) |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 |
| Styling | Tailwind CSS 3 |
| Runtime | Node.js 20 |
| Container | Docker + Docker Compose |

---

## Quick Start (Docker — recommended)

### 1. Clone & configure

```bash
git clone <your-repo>
cd <your-repo>

cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@db:5432/appdb"
AUTH_SECRET="<run: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Build & run

```bash
docker compose up --build
```

This will:
1. Start PostgreSQL
2. Run `prisma migrate deploy` + seed (creates `admin@example.com / password123`)
3. Start the Next.js app on **http://localhost:3000**

### 3. Default login

```
Email:    admin@example.com
Password: password123
```

---

## Local Development (without Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL running locally (or use `docker compose up db`)

### Setup

```bash
npm install

# Start only the database
docker compose up db -d

# Copy and fill .env
cp .env.example .env
# Set DATABASE_URL to: postgresql://postgres:postgres@localhost:5432/appdb

# Run migrations & seed
npm run db:migrate
npm run db:seed

# Start dev server
npm run dev
```

App is available at **http://localhost:3000**

### Prisma Studio (DB GUI)

```bash
npm run db:studio
# Opens at http://localhost:5555
```

---

## Project Structure

```
.
├── prisma/
│   ├── schema.prisma        # Database models
│   └── seed.ts              # Initial data
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/        # NextAuth route handler
│   │   │   └── items/       # CRUD API routes
│   │   │       └── [id]/    # PUT / DELETE by id
│   │   ├── dashboard/       # Protected dashboard page
│   │   ├── login/           # Login page
│   │   ├── layout.tsx
│   │   └── page.tsx         # Redirect to /dashboard or /login
│   ├── components/
│   │   └── DashboardClient.tsx  # Interactive CRUD table + modal
│   └── lib/
│       ├── auth.ts          # NextAuth config
│       └── prisma.ts        # Prisma client singleton
├── Dockerfile               # Multi-stage production build
├── docker-compose.yml       # Production stack
└── docker-compose.dev.yml   # Development override
```

---

## API Reference

All routes require a valid session cookie.

| Method | Route | Description |
|---|---|---|
| GET | `/api/items` | List all items for the current user |
| POST | `/api/items` | Create a new item |
| PUT | `/api/items/:id` | Update an item |
| DELETE | `/api/items/:id` | Delete an item |

### Item shape

```json
{
  "id": "cuid",
  "title": "string (required)",
  "description": "string | null",
  "status": "ACTIVE | INACTIVE | ARCHIVED",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601",
  "userId": "cuid"
}
```

---

## Extending the Template

### Add a new database model

1. Edit `prisma/schema.prisma` — add your model
2. Create a migration:
   ```bash
   npx prisma migrate dev --name add_my_model
   ```
3. Add API routes under `src/app/api/<your-model>/`
4. Add a UI component in `src/components/`

### Add OAuth login (e.g. Google)

1. Install provider: already included in `next-auth`
2. Add to `src/lib/auth.ts`:
   ```ts
   import Google from "next-auth/providers/google";
   // ...
   providers: [Google, Credentials(...)],
   ```
3. Set env vars: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`

---

## Production Deployment

### Fly.io / Railway / Render

1. Set all env vars in the platform dashboard
2. Use the provided `Dockerfile` directly — platforms detect it automatically
3. Point `DATABASE_URL` to your managed PostgreSQL instance
4. Set `NEXTAUTH_URL` to your production domain

### Self-hosted VPS

```bash
# On your server
git pull
docker compose up --build -d
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | Random secret for JWT signing (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | ✅ | Public URL of the app |
