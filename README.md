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
```

3. Apply the schema in [supabase/schema.sql](/C:/Users/yoges/Documents/TCH%20softwer/gym-webapp/supabase/schema.sql)

## Validation

```bash
npm run lint
npm run build
```

## Deployment

Deploy on Vercel and add the same Supabase environment variables in the project settings. Once those variables are present, the app will try to read live data instead of demo data.
