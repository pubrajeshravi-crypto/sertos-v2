# SERTOS Backend

Django REST API for authentication, emergency incidents, hospitals, police operations, notifications, and traffic preemption.

## Requirements

- Python 3.12 or newer
- SQLite for local development
- Optional Google Maps Routes API key
- ESP32 hardware prototype instructions: `hardware/esp32_traffic_node/README.md`

## Local setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

Health check: http://127.0.0.1:8000/api/health/

## Environment

```text
DEBUG=True
DB_ENGINE=sqlite
SECRET_KEY=<unique-development-secret>
ALLOWED_HOSTS=127.0.0.1,localhost,testserver
CORS_ALLOWED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
DB_ENGINE=sqlite
SQLITE_DB_NAME=db.sqlite3
GOOGLE_MAPS_API_KEY=
```

Never commit real secrets or API keys.

## Deploying frontend and backend separately

The frontend reads `VITE_API_BASE_URL` at build time. Set it in the frontend deployment to the backend HTTPS origin, without `/api` or a trailing path. Since the frontend and backend use separate GitHub repositories, a change in this combined workspace must also be copied/committed to the matching source repository before that service can deploy it.

For a separately hosted browser frontend, set the backend Render environment variable `CORS_ALLOWED_ORIGINS` to a comma-separated list containing the exact frontend origins (for example `https://your-frontend.onrender.com`). Include scheme and hostname only; do not guess this value. Redeploy the backend after changing it. ESP32 device requests use device-token headers and are not subject to browser CORS.

The traffic device endpoints are rooted at `/api/traffic/`. ESP32 devices authenticate with `X-Device-ID` and `X-Device-Token`. Device status reports are stored in `TrafficDevice.last_status_payload`; the two prototype sensor fields are `sensor_1_detected` and `sensor_2_detected`.

## Tests

```powershell
python manage.py check
python manage.py test --verbosity 1
```
