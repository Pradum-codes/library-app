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

### Direct Uploads from Admin

The admin panel can upload images directly to Cloudinary (browser -> Cloudinary).

Required client-side env vars in `.env.local`:

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
```

Notes:
- The upload preset must be **unsigned** (Cloudinary “Unsigned upload preset”).
- Optional: `NEXT_PUBLIC_CLOUDINARY_FOLDER=...` to organize uploads.

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

## Admin Panel

The admin panel lives at `/admin` and requires credentials configured in `.env.local`.

```
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me
ADMIN_SESSION_SECRET=long-random-string
```

For stronger security, store a scrypt hash instead of a plain password:

```
ADMIN_PASSWORD_HASH=...
ADMIN_PASSWORD_SALT=...
```

### Admin Activity Log

All admin changes (books, genres, featured list, site settings) are written to an audit log and shown in the Activity tab.

- With MongoDB: stored in the `admin_activity` collection.
- Without MongoDB (dev only): stored in `data/admin-activity.json`.
