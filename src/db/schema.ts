import {
  pgSchema,
  pgTable,
  pgEnum,
  uuid,
  date,
  numeric,
  text,
  timestamp,
  smallint,
  boolean,
} from "drizzle-orm/pg-core";

// Fixed, app-defined categories — unlike roles, not something a user manages
// themselves, so a Postgres enum (not a lookup table) enforces valid values
// at the DB level. Order here is just declaration order; the app controls
// display order separately. Shifts with no shift type (the column is
// nullable) are treated as a "General" bucket by the app — e.g. servers,
// whose hours don't line up with any of these three at all, so forcing a
// choice would be pure friction with no real signal.
export const shiftTypeEnum = pgEnum("shift_type", ["opening", "bd", "closing"]);

// Supabase manages the `auth` schema; we reference it for FKs and RLS
// (auth.uid()) without owning or migrating it ourselves.
const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

// A user-defined position (Bartender, Server, Event Bar, ...), each with its
// own base hourly wage — replaces the single flat rate that used to live on
// `settings`, since different roles are paid differently.
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  baseHourlyRate: numeric("base_hourly_rate", { precision: 6, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const shifts = pgTable("shifts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  // Nullable — a shift can be logged before any role has been set up.
  roleId: uuid("role_id").references(() => roles.id, { onDelete: "set null" }),
  // Nullable only because shifts logged before this field existed have no
  // value yet — the Add/Edit Tips form itself always requires picking one
  // going forward.
  shiftType: shiftTypeEnum("shift_type"),
  date: date("date").notNull(),
  hoursWorked: numeric("hours_worked", { precision: 5, scale: 2 }).notNull(),
  tipsAmount: numeric("tips_amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const wageEntries = pgTable("wage_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  grossPay: numeric("gross_pay", { precision: 10, scale: 2 }).notNull(),
  netPay: numeric("net_pay", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  // Set once a user dismisses this entry's payroll-discrepancy warning (see
  // src/lib/payroll-discrepancy.ts) — suppresses it permanently rather than
  // it reappearing on every load.
  discrepancyDismissed: boolean("discrepancy_dismissed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// One row per user.
export const settings = pgTable("settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  name: text("name"),
  state: text("state"),
  filingStatus: text("filing_status"),
  // Editable estimate; default reflects a typical marginal federal rate.
  estimatedIncomeTaxRate: numeric("estimated_income_tax_rate", {
    precision: 5,
    scale: 4,
  })
    .notNull()
    .default("0.12"),
  // Fixed statutory rate; stored (not hardcoded) so it survives a law change
  // without a code deploy, but the app should treat it as reference-only.
  ficaRate: numeric("fica_rate", { precision: 5, scale: 4 })
    .notNull()
    .default("0.0765"),
  weekStartDay: smallint("week_start_day").notNull().default(1), // 0 = Sunday, 1 = Monday
  defaultView: text("default_view").notNull().default("month"),
});
