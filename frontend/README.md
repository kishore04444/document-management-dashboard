# Frontend

React + Vite frontend for the Document Management Dashboard.

## Run locally

```powershell
cd frontend
npm install --legacy-peer-deps
npm run dev -- --host
```

Then open:

```text
http://localhost:5173
```

## Environment

Create `frontend/.env` to override the API base URL:

```text
VITE_API_BASE_URL=http://localhost:5000/api
```

## Scripts

- `npm run dev -- --host`
- `npm run build`
- `npm run preview`
