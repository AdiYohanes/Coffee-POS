This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 🚀 Production Runbook

### Deployment
1. **Link to Vercel**: `vercel link`
2. **Environment Setup**: Ensure `DATABASE_URL` and `SENTRY_DSN` are set in Vercel Project Settings.
3. **Pre-deploy Check**: `./scripts/deploy-checklist.sh`
4. **Deploy**: `vercel --prod`

### Rollback
If a deployment fails or introduces critical bugs:
- **Instant Rollback**: Go to Vercel Dashboard -> Deployments -> Select stable version -> Click "Rollback".
- **CLI Rollback**: Run `./scripts/rollback.sh` (reverts git commit and pushes to main).

### Monitoring & Health
- **Sentry**: Monitor errors and performance at [sentry.io](https://sentry.io).
- **Health Check**: Check app status at `/api/health`.
- **Database**: Monitor connection limits on Neon/Supabase dashboard.

### Database Maintenance
- **Backups**: Automated by the database provider (Neon/Supabase).
- **Migrations**: Use `npx drizzle-kit push` for schema updates.
- **Verification**: Run `npx tsx src/db/verify.ts` to check data integrity.
