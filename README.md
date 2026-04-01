# GymFlow

GymFlow is a responsive Next.js MVP for running a gym online. It includes:

- A public landing page
- Member views for workouts, progress, schedule, and profile
- Admin views for exercise content, workout plans, memberships, and class schedule
- A Supabase-ready data layer with demo-mode fallback

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- Supabase client helpers

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo mode

The app runs without backend credentials by falling back to seeded mock data. This makes it easy to preview the full product flow before wiring production services.

## Supabase setup

1. Copy `.env.example` to `.env.local`
2. Add:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=progress-photos
APP_URL=https://your-live-domain.com
```

3. Apply the schema in [supabase/schema.sql](/C:/Users/yoges/Documents/TCH%20softwer/gym-webapp/supabase/schema.sql)
4. Create or allow the `progress-photos` storage bucket for uploaded progress images
5. Optional seed from local data:

```bash
npm run seed:supabase
```

## Validation

```bash
npm run lint
npm run build
```

## Deployment

Deploy on Railway or Vercel and add the same Supabase environment variables in the project settings. Once those variables are present, the app will try to read and write live data instead of demo or file-based data.

Set `APP_URL` to your live deployed URL so password reset and auth callback links open the correct domain instead of localhost.
