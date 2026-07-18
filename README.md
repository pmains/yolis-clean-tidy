# Yoli's Clean and Tidy

Professional house cleaning, office cleaning, and maid service in the Phoenix East Valley.

**Stack:** Astro (static site) → Cloudflare Pages  
**Location:** Mesa, AZ  
**Contact:** (480) 279-6730 | contact@yoliscleanandtidy.com

## Development

```bash
npm run dev      # Start dev server
npm run build    # Build static site
npm run preview  # Preview build
```

## Content

- **Services:** `src/content/services/*.md`
- **Service Areas:** `src/content/service-areas/*.md`
- **Business Info:** `src/data/company.json`
- **Homepage Copy:** `src/data/homepage.json`

## Form Handling

The Jobs page form submits to a Cloudflare Pages Function at `/api/forms/jobs`. Configure via Cloudflare Pages environment variables:

- `RESEND_API_KEY` — for email notifications
- `NOTIFY_EMAIL` — recipient address (defaults to peter.mains@gmail.com)
