import {
  bigint,
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "supplier"]).default("user").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const equipmentItems = mysqlTable(
  "equipment_items",
  {
    id: int("id").autoincrement().primaryKey(),
    itemNumber: int("itemNumber").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    brand: varchar("brand", { length: 255 }),
    model: text("model"),
    quantity: int("quantity").default(1).notNull(),
    unitValueCents: int("unitValueCents").default(0).notNull(),
    totalValueCents: int("totalValueCents").default(0).notNull(),
    invoiceUrl: text("invoiceUrl"),
    createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("equipment_item_number_unique").on(table.itemNumber),
    index("equipment_name_idx").on(table.name),
  ],
);

export const procurementStages = mysqlTable(
  "procurement_stages",
  {
    id: int("id").autoincrement().primaryKey(),
    equipmentId: int("equipmentId")
      .notNull()
      .references(() => equipmentItems.id, { onDelete: "cascade" }),
    stageKey: mysqlEnum("stageKey", [
      "acquisition",
      "invoice_link",
      "shipping",
      "expected_delivery",
      "delivery",
      "installation",
    ]).notNull(),
    status: mysqlEnum("status", [
      "pending",
      "in_progress",
      "completed",
      "blocked",
    ])
      .default("pending")
      .notNull(),
    // Data de negócio da etapa: UTC Unix timestamp em milissegundos.
    stageDate: bigint("stageDate", { mode: "number" }),
    notes: text("notes"),
    updatedBy: int("updatedBy").references(() => users.id, { onDelete: "set null" }),
    // Metadados técnicos de auditoria, mantidos em UTC pelo banco.
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("equipment_stage_unique").on(table.equipmentId, table.stageKey),
    index("stage_status_idx").on(table.status),
  ],
);

export const userPermissions = mysqlTable("user_permissions", {
  userId: int("userId")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  canViewDashboard: boolean("canViewDashboard").default(true).notNull(),
  canViewItems: boolean("canViewItems").default(true).notNull(),
  canEditItems: boolean("canEditItems").default(false).notNull(),
  canViewStages: boolean("canViewStages").default(true).notNull(),
  canEditStages: boolean("canEditStages").default(false).notNull(),
  canViewInvoices: boolean("canViewInvoices").default(true).notNull(),
  canManageInvoices: boolean("canManageInvoices").default(false).notNull(),
  canViewBudgetValues: boolean("canViewBudgetValues").default(false).notNull(),
  canViewSupplierQuotes: boolean("canViewSupplierQuotes").default(false).notNull(),
  canSubmitQuotes: boolean("canSubmitQuotes").default(false).notNull(),
  updatedBy: int("updatedBy").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const supplierProfiles = mysqlTable("supplier_profiles", {
  userId: int("userId")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  companyName: varchar("companyName", { length: 255 }),
  cnpj: varchar("cnpj", { length: 18 }),
  contactPhone: varchar("contactPhone", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const supplierQuotes = mysqlTable(
  "supplier_quotes",
  {
    id: int("id").autoincrement().primaryKey(),
    equipmentId: int("equipmentId")
      .notNull()
      .references(() => equipmentItems.id, { onDelete: "cascade" }),
    supplierUserId: int("supplierUserId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    unitValueCents: int("unitValueCents").notNull(),
    offeredBrand: varchar("offeredBrand", { length: 255 }),
    offeredModel: text("offeredModel"),
    leadTimeDays: int("leadTimeDays"),
    notes: text("notes"),
    status: mysqlEnum("status", ["draft", "submitted"]).default("draft").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("supplier_equipment_quote_unique").on(table.supplierUserId, table.equipmentId),
    index("quote_equipment_idx").on(table.equipmentId),
    index("quote_status_idx").on(table.status),
  ],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type EquipmentItem = typeof equipmentItems.$inferSelect;
export type InsertEquipmentItem = typeof equipmentItems.$inferInsert;
export type ProcurementStage = typeof procurementStages.$inferSelect;
export type InsertProcurementStage = typeof procurementStages.$inferInsert;
export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = typeof userPermissions.$inferInsert;
export type SupplierProfile = typeof supplierProfiles.$inferSelect;
export type SupplierQuote = typeof supplierQuotes.$inferSelect;
export type InsertSupplierQuote = typeof supplierQuotes.$inferInsert;
