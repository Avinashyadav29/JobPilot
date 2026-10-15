# JobPilot

The application source is in the `jobpilot` subfolder. These commands work from this folder (`Downloads\jobpilot`):

```powershell
npm install
npm run dev
```

Open <http://localhost:5173>. Run `npm run worker` in a second terminal for background jobs.

The API initializes a persistent local database automatically, so Docker setup and a separate migration are not needed for sign-up. The worker and Gmail sync need Redis; PostgreSQL can optionally be configured with `DATABASE_URL`. See [jobpilot/README.md](./jobpilot/README.md) for integration details.
