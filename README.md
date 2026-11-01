# Doroi PHP Website — Render Starter

A minimal PHP + Apache website configured for deployment to Render with Docker.

## Files

- `index.php` — sample homepage
- `Dockerfile` — PHP 8.3 + Apache container configuration
- `.dockerignore` — excludes unnecessary files from the Docker build

## Deploy

1. Extract this ZIP.
2. Upload the files to a GitHub repository (keep `Dockerfile` at the repository root).
3. Sign in at https://render.com/.
4. Choose **New + → Web Service** and connect the GitHub repository.
5. Select **Docker** as the runtime/environment if prompted.
6. Deploy.

Render should detect the Dockerfile automatically. The container listens on port `10000`.

## Notes

- This starter is intended as a simple starting point. Add your own pages and assets.
- Render free web services can sleep after inactivity.
- The container filesystem is not persistent on a free web service. Do not rely on it for permanent user uploads or database files.
- For production projects, configure persistent storage or external object storage for uploads, and use a managed database where needed.
