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
Guest's Phone                  Your Node.js API              Cloudflare R2
     |                              |                             |
     |  1. POST /api/upload/request |                             |
     |  (eventId, fileName, type)   |                             |
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
     |  5. POST /api/upload/confirm |                              |
     |  (eventId, fileKey)          |                              |
     |----------------------------->|                              |
     |                              |  6. Save metadata to DB      |
```

This **presigned URL pattern** is critical — the photo never touches your Node.js server, so:
- Your server stays lightweight (no large file buffering)
- Uploads are fast (direct to R2's edge)
- You can handle hundreds of concurrent uploads without scaling your server

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

### Frontend (React)

| Layer | Technology | Why |
|---|---|---|
| Framework | **Vite + React** | Fast dev experience, lightweight |
| Styling | **Tailwind CSS** | Rapid UI development, mobile-first |
| State | **TanStack Query** | Server state management, caching |
| Routing | **React Router v7** | Standard, well-supported |
| QR Generation | **qrcode.react** | Generate QR codes client-side |
| Image Gallery | **react-photo-album** | Masonry/grid layouts for galleries |
| Upload UI | **react-dropzone** | Drag & drop + mobile file picker |

### Backend (Node.js)

| Layer | Technology | Why |
|---|---|---|
| Runtime | **Node.js 20+** | LTS, stable |
| Framework | **Express** or **Fastify** | Fastify is faster, Express has more ecosystem |
| Database | **PostgreSQL** | Relational data (events, users, photos metadata) |
| ORM | **Drizzle ORM** | Type-safe, lightweight, great DX |
| Auth | **JWT + bcrypt** | For organizers; guests don't need auth |
| Storage SDK | **@aws-sdk/client-s3** | Works with R2 (S3-compatible) |
| QR Generation | **qrcode** npm package | Server-side QR as PNG/SVG |
| ZIP Creation | **archiver** | Stream ZIP files for bulk download |
| Image Processing | **sharp** | Generate thumbnails on upload confirm |
| Real-time | **Socket.io** or **SSE** | Live slideshow feature |
| Validation | **zod** | Schema validation for API inputs |

### Infrastructure

| Layer | Technology | Why |
|---|---|---|
| Object Storage | **Cloudflare R2** | $0 egress, S3-compatible |
| Database | **Neon** (serverless Postgres) | Free tier, scales well, no server mgmt |
| Hosting (API) | **Railway** or **Fly.io** | Easy Node.js deployment |
| Hosting (Frontend) | **Cloudflare Pages** or **Vercel** | Free tier, global CDN |
| Domain/DNS | **Cloudflare** | Free, pairs with R2 |

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

## API Endpoints (Core)

```
Auth:
  POST   /api/auth/register          — organizer signup
  POST   /api/auth/login             — organizer login

Events (authenticated):
  POST   /api/events                 — create event
  GET    /api/events                 — list my events
  GET    /api/events/:id             — event details + stats
  PATCH  /api/events/:id             — update settings
  DELETE /api/events/:id             — delete event + all media
  GET    /api/events/:id/qr          — get QR code image
  GET    /api/events/:id/download    — stream ZIP of all originals

Guest Upload (no auth):
  GET    /api/e/:slug                — get event info (name, theme)
  POST   /api/e/:slug/upload-url    — get presigned upload URL
  POST   /api/e/:slug/confirm       — confirm upload, trigger thumbnail gen

Gallery:
  GET    /api/events/:id/media       — list media with pagination
  GET    /api/events/:id/media/:mid  — get single media details + URLs
  DELETE /api/events/:id/media/:mid  — delete single media
```

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

### Presigned URL Upload (Node.js + R2)

```javascript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function getUploadUrl(eventId, fileName, contentType) {
  const key = `events/${eventId}/originals/${crypto.randomUUID()}_${fileName}`;
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const url = await getSignedUrl(r2, command, { expiresIn: 900 }); // 15 min
  return { url, key };
}
```

### Thumbnail Generation (on upload confirm)

```javascript
import sharp from "sharp";

async function generateThumbnail(originalKey) {
  const original = await r2.send(new GetObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: originalKey,
  }));
  const buffer = Buffer.from(await original.Body.transformToByteArray());
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

### ZIP Download (streaming, memory-efficient)

```javascript
import archiver from "archiver";

app.get("/api/events/:id/download", async (req, res) => {
  const media = await db.select().from(mediaTable).where(eq(mediaTable.eventId, req.params.id));
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="event-photos.zip"`);
  const archive = archiver("zip", { zlib: { level: 1 } }); // fast compression
  archive.pipe(res);
  for (const item of media) {
    const obj = await r2.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: item.originalKey,
    }));
    archive.append(obj.Body, { name: item.fileName });
  }
  await archive.finalize();
});
```

---

## Getting Started (Next Steps)

1. **Set up Cloudflare R2** — Create account → create bucket → generate API tokens
2. **Set up Neon Postgres** — Create database → run the schema above
3. **Scaffold the backend** — `npm init` + Express/Fastify + Drizzle
4. **Scaffold the frontend** — `npm create vite@latest` with React + TypeScript
5. **Build the guest upload flow first** — This is your core product loop
6. **Add organizer dashboard** — Event creation, gallery view, download
7. **Add QR code generation** — Simple wrapper around the event URL
8. **Add payment** — Stripe Checkout for one-time event purchases
