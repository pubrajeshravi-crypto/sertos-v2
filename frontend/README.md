# SERTOS Frontend Build Copy

This frontend copy is built and served by the Django deployment in `backend/`.
Use the top-level `frontend/` directory for normal local development and Vercel
deployment; keep its source synchronized with this directory before building
the backend bundle.

The local Vite API proxy forwards `/api` and `/health` to Django at
`http://127.0.0.1:8000`. The backend build runs `npm ci --prefix frontend` and
`npm run build --prefix frontend` from this directory.

Its Vite base is `/static/` because Django serves the generated bundles through
WhiteNoise. Keep the application source synchronized with the top-level
`frontend/src/`, but retain this deployment-specific base path.
