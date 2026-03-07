# BookNest (Next.js)

Book recommendation experience rebuilt with Next.js, Tailwind CSS, and shadcn/ui components.

## Local Development

```bash
npm install
npm run dev
```

## MongoDB Setup

Set environment variables:

```
MONGODB_URI=your-mongodb-connection-string
MONGODB_DB=booknest
```

Seed the database from `data/site-data.json`:

```bash
npm run seed
```

If `MONGODB_URI` is not set, the app will fall back to `data/site-data.json` in development.

## Cloudinary

Replace the placeholder image URLs in `data/site-data.json` with your Cloudinary URLs.

### Bulk Upload (recommended)

1. Set Cloudinary credentials in `.env.local`:

```
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

2. Run the upload script:

```bash
npm run upload:cloudinary
```

This will upload all local images, update `data/site-data.json`, and print a report.  
To auto-seed Mongo after upload:

```bash
npm run upload:cloudinary -- --seed
```
