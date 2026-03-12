# Event Photo Sharing Platform — Architecture & Storage Recommendation

## What Eventoly Does (Reference)

Eventoly follows a simple 3-step flow:

1. **Organizer creates an event** → gets a unique QR code + shareable link
2. **Guests scan the QR code** → opens a mobile-friendly upload page (no app install, no login)
3. **Organizer downloads everything** → one-click ZIP download of all photos/videos in original quality

### Key Eventoly Features to Replicate

| Feature | Priority | Notes |
|---|---|---|
| QR code generation per event | **Must-have** | Encodes a URL like `yourdomain.com/e/<event-id>` |
| No-login guest uploads | **Must-have** | Guests just scan and upload — zero friction |
| Original quality preservation | **Must-have** | No server-side compression on originals |
| One-click ZIP download | **Must-have** | Organizer downloads all media at once |
| Live slideshow | Nice-to-have | Real-time display of uploads via WebSocket/SSE |
| Customizable upload page | Nice-to-have | Themes, event name, cover photo |
| Sub-albums | Nice-to-have | Organize within an event |
| Guest name tracking | Nice-to-have | Optional name field before upload |
| Audio guestbook | Nice-to-have | Record voice messages |
| Multiple admins per event | Nice-to-have | Share management access |
| 12-month access window | Nice-to-have | Auto-expire + lifecycle policies |

---

## Storage Recommendation: Cloudflare R2

### Why R2 is the best fit for this project

For a photo-sharing platform, **egress (download) costs dominate your bill**. Every time an organizer previews a gallery, views thumbnails, or downloads a ZIP — that's egress. Here's how the options compare for a realistic workload:

#### Cost Comparison (100 events/month, ~50 photos each, avg 4MB/photo = ~20GB stored, ~60GB egress)

| Provider | Storage Cost | Egress Cost | Total/Month |
|---|---|---|---|
| **Cloudflare R2** | $0.30 | **$0.00** | **~$0.30** |
| AWS S3 | $0.46 | $5.40 | ~$5.86 |
| Google Cloud Storage | $0.40 | $7.20 | ~$7.60 |

R2 wins by a landslide because:

- **$0 egress fees** — this is permanent, not promotional
- **S3-compatible API** — use the same `@aws-sdk/client-s3` npm package, just change the endpoint
- **10GB free storage + 10M free reads/month** — generous free tier for starting out
- **Global CDN built-in** — Cloudflare's 300+ edge locations serve your photos fast
- **Presigned URLs** — upload directly from the browser to R2 (no file passes through your server)

### How Uploads Work with R2

```
Guest's Phone               Next.js API Route Handler        Cloudflare R2
     |                              |                             |
     |  1. POST /api/e/[slug]/      |                             |
     |     upload-url               |                             |
     |  (fileName, contentType)     |                             |
     |----------------------------->|                              |
     |                              |  2. Generate presigned URL   |
     |                              |  (PutObject, 15min expiry)   |
     |                              |----------------------------->|
     |  3. Return presigned URL     |                              |
     |<-----------------------------|                              |
     |                                                             |
     |  4. PUT file directly to R2 (browser → R2, not via server)  |
     |------------------------------------------------------------>|
     |                                                             |
     |  5. POST /api/e/[slug]/      |                              |
     |     confirm                  |                              |
     |  (fileKey, guestName)        |                              |
     |----------------------------->|                              |
     |                              |  6. Save metadata to DB      |
     |                              |  7. Generate thumbnail        |
```

This **presigned URL pattern** is critical — the photo never touches your Next.js server, so:
- Your server stays lightweight (no large file buffering)
- Uploads are fast (direct to R2's edge)
- You can handle hundreds of concurrent uploads without scaling
- Vercel's serverless functions stay well within timeout limits

### R2 Bucket Structure

```
your-bucket/
├── events/
│   ├── <event-id>/
│   │   ├── originals/
│   │   │   ├── <uuid>.jpg
│   │   │   ├── <uuid>.png
│   │   │   └── <uuid>.mp4
│   │   ├── thumbnails/
│   │   │   ├── <uuid>_thumb.webp
│   │   │   └── <uuid>_thumb.webp
│   │   └── zip/
│   │       └── <event-id>_all.zip   (generated on-demand, cached)
```

---

## Full Recommended Tech Stack

### Monorepo: Next.js (Frontend + Backend in one project)

With Next.js, you don't need a separate Express/Fastify server. Next.js **API Route Handlers** (`app/api/...`) run server-side Node.js code, and **Server Components** fetch data directly on the server — no separate backend deployment needed.

#### Why Next.js is a great fit for this project

- **Server Components** — gallery pages and the organizer dashboard fetch data on the server, so there's no loading spinner and SEO is free
- **API Route Handlers** — all your backend logic (presigned URLs, auth, ZIP downloads) lives in `app/api/` alongside your frontend
- **`next/image`** — automatic image optimization and lazy loading for thumbnails (can proxy from R2)
- **App Router** — file-based routing maps perfectly to your URL structure (`/e/[slug]` for guest uploads, `/dashboard/events/[id]` for organizers)
- **Server Actions** — form submissions (create event, update settings) without writing API endpoints
- **Middleware** — auth checks at the edge before hitting your pages
- **Single deployment** — one `next build` deploys both frontend and backend to Vercel

### Frontend Layer

| Layer | Technology | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | SSR/SSG + API routes + React Server Components |
| Styling | **Tailwind CSS** | Rapid UI development, mobile-first |
| State | **TanStack Query** | Client-side server state (gallery pagination, uploads) |
| QR Generation | **qrcode.react** | Generate QR codes client-side |
| Image Gallery | **react-photo-album** | Masonry/grid layouts for galleries |
| Upload UI | **react-dropzone** | Drag & drop + mobile file picker |
| Forms | **React Hook Form + zod** | Validated forms for event creation/settings |

### Backend Layer (all inside Next.js)

| Layer | Technology | Why |
|---|---|---|
| API Routes | **Next.js Route Handlers** | `app/api/` — replaces Express/Fastify entirely |
| Server Logic | **Server Components + Server Actions** | Data fetching and mutations without separate API calls |
| Database | **PostgreSQL** | Relational data (events, users, photos metadata) |
| ORM | **Drizzle ORM** | Type-safe, lightweight, great DX with Next.js |
| Auth | **NextAuth.js (Auth.js v5)** | Built for Next.js, supports credentials + OAuth |
| Storage SDK | **@aws-sdk/client-s3** | Works with R2 (S3-compatible) |
| QR Generation | **qrcode** npm package | Server-side QR as PNG/SVG in API routes |
| ZIP Creation | **archiver** | Stream ZIP files for bulk download |
| Image Processing | **sharp** | Generate thumbnails on upload confirm (Next.js bundles sharp already) |
| Real-time | **Server-Sent Events (SSE)** | Live slideshow via API route streaming |
| Validation | **zod** | Schema validation shared between client and server |

### Infrastructure

| Layer | Technology | Why |
|---|---|---|
| Object Storage | **Cloudflare R2** | $0 egress, S3-compatible |
| Database | **Neon** (serverless Postgres) | Free tier, scales well, no server mgmt |
| Hosting | **Vercel** | Native Next.js hosting, free tier, global edge |
| Domain/DNS | **Cloudflare** or **Vercel** | Free, pairs with R2 |

### Project Structure

```
app/
├── (marketing)/              ← Public pages (SSG for SEO)
│   ├── page.tsx                  Landing page
│   ├── pricing/page.tsx          Pricing page
│   └── layout.tsx                Marketing layout (navbar, footer)
│
├── (auth)/                   ← Auth pages
│   ├── login/page.tsx
│   └── register/page.tsx
│
├── dashboard/                ← Organizer dashboard (authenticated)
│   ├── layout.tsx                Dashboard shell (sidebar, auth check)
│   ├── page.tsx                  Event list
│   └── events/
│       ├── new/page.tsx          Create event form
│       └── [id]/
│           ├── page.tsx          Event gallery + stats
│           ├── settings/page.tsx Event settings
│           └── slideshow/page.tsx Live slideshow (fullscreen)
│
├── e/[slug]/                 ← Guest upload page (NO auth required)
│   └── page.tsx                  Mobile-friendly upload UI
│
├── api/                      ← API Route Handlers
│   ├── auth/[...nextauth]/route.ts
│   ├── events/
│   │   ├── route.ts              GET (list) / POST (create)
│   │   └── [id]/
│   │       ├── route.ts          GET / PATCH / DELETE
│   │       ├── qr/route.ts       GET QR code image
│   │       ├── download/route.ts GET streamed ZIP
│   │       └── media/
│   │           ├── route.ts      GET (list with pagination)
│   │           └── [mid]/route.ts GET / DELETE single media
│   └── e/[slug]/
│       ├── route.ts              GET event info for guests
│       ├── upload-url/route.ts   POST → presigned R2 URL
│       └── confirm/route.ts      POST → save metadata + gen thumbnail
│
├── layout.tsx                ← Root layout
└── globals.css               ← Tailwind base styles

lib/
├── db/
│   ├── schema.ts                 Drizzle schema (users, events, media)
│   ├── index.ts                  DB connection (Neon)
│   └── migrations/               Drizzle migration files
├── r2.ts                         R2 client + helper functions
├── auth.ts                       NextAuth config
└── utils.ts                      Shared utilities

components/
├── ui/                           Reusable UI components
├── upload/
│   ├── dropzone.tsx              Upload dropzone for guests
│   └── progress.tsx              Upload progress indicator
├── gallery/
│   ├── photo-grid.tsx            Masonry photo grid
│   └── lightbox.tsx              Full-screen photo viewer
├── qr-code.tsx                   QR code display component
└── slideshow.tsx                 Live slideshow component
```

---

## Database Schema (Core Tables)

```sql
-- Organizers / account holders
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    name            TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- Each event = one QR code = one gallery
CREATE TABLE events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    event_date      DATE,
    slug            TEXT UNIQUE NOT NULL,          -- used in URL: /e/<slug>
    is_active       BOOLEAN DEFAULT true,
    guests_can_view BOOLEAN DEFAULT false,         -- privacy: can guests see others' photos?
    expires_at      TIMESTAMPTZ,                   -- auto-expire after N months
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- Every uploaded photo/video
CREATE TABLE media (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID REFERENCES events(id) ON DELETE CASCADE,
    guest_name      TEXT,                          -- optional name from uploader
    original_key    TEXT NOT NULL,                  -- R2 object key for original
    thumbnail_key   TEXT,                           -- R2 object key for thumbnail
    file_name       TEXT NOT NULL,                  -- original file name
    mime_type       TEXT NOT NULL,
    file_size       BIGINT NOT NULL,               -- bytes
    width           INT,
    height          INT,
    uploaded_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_media_event ON media(event_id);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_user ON events(user_id);
```

---

## API Route Handlers (Next.js `app/api/`)

All backend logic lives inside Next.js Route Handlers. No separate server needed.

```
Auth (handled by NextAuth.js):
  POST   /api/auth/[...nextauth]     — login, register, session (built-in)

Events (authenticated via middleware):
  POST   /api/events                 — create event (or use Server Action)
  GET    /api/events                 — list my events
  GET    /api/events/[id]            — event details + stats
  PATCH  /api/events/[id]            — update settings
  DELETE /api/events/[id]            — delete event + all media
  GET    /api/events/[id]/qr         — get QR code image
  GET    /api/events/[id]/download   — stream ZIP of all originals

Guest Upload (no auth required):
  GET    /api/e/[slug]               — get event info (name, theme)
  POST   /api/e/[slug]/upload-url   — get presigned upload URL
  POST   /api/e/[slug]/confirm      — confirm upload, trigger thumbnail gen

Gallery:
  GET    /api/events/[id]/media      — list media with pagination
  DELETE /api/events/[id]/media/[mid] — delete single media
```

Note: Many read operations won't need API routes at all — Server Components
can query the database directly in the page component. API routes are mainly
needed for: presigned URL generation, file streaming (ZIP download), and
client-side mutations that can't use Server Actions.

---

## Monetization Model (like Eventoly)

Eventoly charges a **one-time fee per event** ($49), not a subscription. This is smart because:

- Low commitment for the buyer (no recurring charge anxiety)
- Clear value proposition ("pay once, get all your wedding photos")
- You can tier it:

| Plan | Price | Limits |
|---|---|---|
| Free Trial | $0 | 1 event, 50 photos, 7-day access |
| Party | $29 | 1 event, unlimited photos, 3-month access |
| Wedding | $49 | 1 event, unlimited photos + video, 12-month access, slideshow |
| Pro | $99 | 5 events, everything in Wedding + custom branding |

---

## Key Implementation Notes

### R2 Client Setup (`lib/r2.ts`)

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function getUploadUrl(eventId: string, fileName: string, contentType: string) {
  const key = `events/${eventId}/originals/${crypto.randomUUID()}_${fileName}`;
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const url = await getSignedUrl(r2, command, { expiresIn: 900 });
  return { url, key };
}
```

### Presigned URL Route Handler (`app/api/e/[slug]/upload-url/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getUploadUrl } from "@/lib/r2";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { fileName, contentType } = await request.json();

  const event = await db.query.events.findFirst({
    where: eq(events.slug, slug),
  });
  if (!event || !event.isActive) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const { url, key } = await getUploadUrl(event.id, fileName, contentType);
  return NextResponse.json({ url, key });
}
```

### Thumbnail Generation (on upload confirm)

```typescript
import sharp from "sharp";
import { r2 } from "@/lib/r2";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

export async function generateThumbnail(originalKey: string): Promise<string> {
  const original = await r2.send(new GetObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: originalKey,
  }));
  const buffer = Buffer.from(await original.Body!.transformToByteArray());
  const thumbnail = await sharp(buffer)
    .resize(400, 400, { fit: "inside" })
    .webp({ quality: 80 })
    .toBuffer();
  const thumbKey = originalKey
    .replace("/originals/", "/thumbnails/")
    .replace(/\.[^.]+$/, "_thumb.webp");
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: thumbKey,
    Body: thumbnail,
    ContentType: "image/webp",
  }));
  return thumbKey;
}
```

### ZIP Download Route Handler (`app/api/events/[id]/download/route.ts`)

```typescript
import { NextRequest } from "next/server";
import archiver from "archiver";
import { Readable } from "stream";
import { r2 } from "@/lib/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const files = await db.select().from(media).where(eq(media.eventId, id));

  const archive = archiver("zip", { zlib: { level: 1 } });
  const stream = new ReadableStream({
    start(controller) {
      archive.on("data", (chunk) => controller.enqueue(chunk));
      archive.on("end", () => controller.close());
      archive.on("error", (err) => controller.error(err));
    },
  });

  (async () => {
    for (const item of files) {
      const obj = await r2.send(new GetObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: item.originalKey,
      }));
      const nodeStream = obj.Body as Readable;
      archive.append(nodeStream, { name: item.fileName });
    }
    await archive.finalize();
  })();

  return new Response(stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="event-photos.zip"`,
    },
  });
}
```

### Guest Upload Page — Server Component (`app/e/[slug]/page.tsx`)

```typescript
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { UploadDropzone } from "@/components/upload/dropzone";

export default async function GuestUploadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await db.query.events.findFirst({
    where: eq(events.slug, slug),
  });

  if (!event || !event.isActive) notFound();

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 to-white px-4 py-8">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
        {event.description && (
          <p className="mt-2 text-gray-600">{event.description}</p>
        )}
        <UploadDropzone slug={slug} className="mt-8" />
      </div>
    </main>
  );
}
```

### Using `next/image` with R2 (`next.config.ts`)

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: `${process.env.R2_PUBLIC_DOMAIN}`,
      },
    ],
  },
};

export default nextConfig;
```

This lets you use `<Image src={thumbnailUrl} ... />` and Next.js will
automatically optimize, resize, and cache the images from R2.

---

## Environment Variables (`.env.local`)

```env
# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET=your-bucket-name
R2_PUBLIC_DOMAIN=pub-xxx.r2.dev        # or your custom domain

# Database (Neon)
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require

# NextAuth
NEXTAUTH_SECRET=generate-a-random-secret
NEXTAUTH_URL=http://localhost:3000

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

---

## Getting Started (Next Steps)

1. **Set up Cloudflare R2** — Create account → create bucket → generate API tokens
2. **Set up Neon Postgres** — Create database → run the schema above
3. **Scaffold the project** — `npx create-next-app@latest` with TypeScript + Tailwind + App Router
4. **Install deps** — `npm i drizzle-orm @neondatabase/serverless @aws-sdk/client-s3 @aws-sdk/s3-request-presigner next-auth@beta zod qrcode.react react-dropzone archiver`
5. **Build the guest upload flow first** — This is your core product loop (`/e/[slug]` page)
6. **Add organizer dashboard** — Event creation, gallery view, download
7. **Add QR code generation** — Simple wrapper around the event URL
8. **Add payment** — Stripe Checkout for one-time event purchases
