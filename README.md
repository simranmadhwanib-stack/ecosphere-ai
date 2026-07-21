# EcoSphere AI

EcoSphere AI is a sustainability decision dashboard for smart-city monitoring, scenario simulation, environmental analytics, and AI-assisted recommendations.

## Project structure

- backend/ — Express API server with telemetry endpoints and location services
- frontend/ — Vite + React dashboard UI

## Prerequisites

- Node.js 18+
- npm

## Local development

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure environment variables

Copy [.env.example](.env.example) to a new `.env` file and adjust values as needed.

```bash
cp .env.example .env
```

Backend variables:
- `PORT` — optional, defaults to 5000
- `GEMINI_API_KEY` — optional, enables real Gemini AI responses

Frontend variables:
- `VITE_API_BASE_URL` — optional, defaults to the local backend API during development

### 3. Run the app locally

Start the backend:

```bash
cd backend
npm start
```

In a second terminal, start the frontend:

```bash
cd frontend
npm run dev
```

The frontend will use the local backend at `http://localhost:5000/api` by default.

## Build verification

Run the frontend build:

```bash
cd frontend
npm run build
```

## Deployment

### Vercel (frontend)

1. Create a Vercel project from the `frontend/` folder.
2. Set the build command to:
   ```bash
   npm run build
   ```
3. Set the output directory to:
   ```bash
   dist
   ```
4. Set environment variable:
   - `VITE_API_BASE_URL=https://your-backend-url/api`

### Render (backend)

1. Create a new Render Web Service from the `backend/` folder.
2. Use the start command:
   ```bash
   npm start
   ```
3. Set environment variables:
   - `PORT=10000` (Render handles this automatically)
   - `GEMINI_API_KEY` (optional)
4. Render will automatically use the health endpoint at `/health` for availability checks.

## Notes

- The current app uses real browser geolocation when available and falls back to manual location search if permission is denied.
- Browser geolocation requires `https://` in production. During local development, use `http://localhost:5173`; opening the Vite server using a LAN IP over plain HTTP prevents the browser from sharing precise location. The app will then use an approximate network-location fallback or let you search for a city.
- The backend currently serves demo-style city telemetry and can be connected to real data sources later.
