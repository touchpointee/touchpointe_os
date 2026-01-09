# Touchpointe Coolify Deployment Guide

This project is fully prepared for deployment on [Coolify](https://coolify.io).

## Files Prepared
- **Dockerfiles**: Located in `backend/` and `frontend/`.
- **Docker Compose**: `docker-compose.yml` at root for full stack deployment.
- **Coolify Config**: `coolify.json` (Service definition).
- **Environment**: `.env.example` files in both directories.

## How to Deploy on Coolify

### Option A: Docker Compose (Recommended)
1. In Coolify, select **"Deploy from Git"**.
2. Connect this repository.
3. Select **"Docker Compose"** build pack.
4. Coolify will detect `docker-compose.yml`.
5. **Configure Environment Variables** in Coolify UI:
   - `JWT_SECRET`: (Generate a secure key)
   - `DB_PASSWORD`: (Set a secure DB password)
   - `FRONTEND_URL`: `https://your-frontend-domain.com`
   - `VITE_API_URL`: `https://your-backend-domain.com` (Must be set during build!)
   - `AI_API_KEY`, `GROQ_API_KEY`: Your keys.

### Option B: Deploy Individually
You can deploy backend and frontend as separate resources pointing to the same repo/subdirectory.

## 3. Database Setup (Postgres in Coolify)
Since you are deploying Postgres via Coolify:
1. Create a **PostgreSQL** database in Coolify.
2. Copy the **Internal Connection String** (starts with `postgres://...`).
3. Go to your **Backend Service** configuration in Coolify.
4. Add an Environment Variable:
   - Key: `DATABASE_URL`
   - Value: (Paste the Internal Connection String)

## 4. How to Run Migrations?
**You don't need to do anything.**

I have configured the Backend to **automatically run migrations** every time it starts.
1. When you deploy the Backend, it will connect to the DB.
2. It detects pending migrations.
3. It applies them automatically before serving requests.
4. You will see "Database migrations applied successfully" in the container logs.

## Automatic Features
- **Database Migrations**: Automatically runs `context.Database.MigrateAsync()` on startup. No manual commands required.
- **Health Checks**:
  - Backend: `/health`
  - Frontend: `/`
- **CORS**: Automatically configured based on `FRONTEND_URL`.

## Notes
- **VITE_API_URL**: Since Vite is a static build, this variable is needed **at build time**. If you change the domain, you must Redeploy/Rebuild the frontend.
