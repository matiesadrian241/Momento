import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  bigint,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  events: many(events),
}));

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    description: text("description"),
    eventDate: date("event_date"),
    slug: text("slug").unique().notNull(),
    isActive: boolean("is_active").default(true),
    guestsCanView: boolean("guests_can_view").default(false),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_events_slug").on(table.slug),
    index("idx_events_user").on(table.userId),
  ]
);

export const eventsRelations = relations(events, ({ one, many }) => ({
  user: one(users, { fields: [events.userId], references: [users.id] }),
  media: many(media),
}));

export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .references(() => events.id, { onDelete: "cascade" })
      .notNull(),
    guestName: text("guest_name"),
    originalKey: text("original_key").notNull(),
    thumbnailKey: text("thumbnail_key"),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    fileSize: bigint("file_size", { mode: "number" }).notNull(),
    width: integer("width"),
    height: integer("height"),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_media_event").on(table.eventId)]
);

export const mediaRelations = relations(media, ({ one }) => ({
  event: one(events, { fields: [media.eventId], references: [events.id] }),
}));
