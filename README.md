# Web Admin (Shadcn-ready)

Scaffolded Next.js admin dashboard intended to use Shadcn UI blocks and Tailwind.

Quick start:

1. cd web-admin
2. npm install
3. npx tailwindcss init -p
4. npx tailwindcss -i ./styles/globals.css -o ./styles/output.css --watch
5. NEXT_PUBLIC_API_BASE=https://scholarsnudge.com/api npm run dev

Environment:
- Set `NEXT_PUBLIC_API_BASE` to your API base URL (e.g. https://scholarsnudge.com/api)
- If your API requires auth, set `NEXT_PUBLIC_API_TOKEN` for quick testing and the client will include it as a bearer token.

Shadcn UI:
- This scaffold includes placeholder `shadcn` components in `components/shadcn/` (Button, Input, Card).
- For full Shadcn integration follow: https://ui.shadcn.com/docs — after installing Shadcn packages, replace the placeholder components with official ones.

Laravel backend:
- The existing Laravel backend lives under `backend/api/` and already implements admin controllers (see `app/Http/Controllers/Api/AdminManagementController.php`).
- To enable admin endpoints, ensure routes in `backend/api/routes/api.php` expose the controller methods and that middleware `auth:sanctum` and `role:admin` are configured.
- Example admin users endpoint expected by the web client: `GET /api/admin/users` (paginated). If your routes differ, update `web-admin/services/api.js` accordingly.

Next steps:
- I can add CRUD UI for Users and Sessions and wire authentication flows.
- Would you like me to implement the Users CRUD pages next, or wire the Sessions admin UI?
