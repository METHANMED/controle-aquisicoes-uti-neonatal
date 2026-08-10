import { asc, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  equipmentItems,
  InsertUser,
  procurementStages,
  supplierProfiles,
  supplierQuotes,
  userPermissions,
  users,
} from "../drizzle/schema";
import {
  STAGE_DEFINITIONS,
  type StageKey,
  type StageStatus,
} from "../shared/procurement";
import { ENV } from "./_core/env";
import { defaultPermissionsForRole, permissionKeys, type AppPermissions } from "./permissions";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod", "passwordHash"] as const;

  textFields.forEach(field => {
    if (user[field] === undefined) return;
    const value = user[field] ?? null;
    values[field] = value;
    updateSet[field] = value;
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

/**
 * Ensures a local admin account exists, using ADMIN_EMAIL / ADMIN_PASSWORD.
 * Runs on server startup. Safe to call every boot: re-hashes and updates the
 * password each time so rotating ADMIN_PASSWORD and redeploying takes effect.
 */
export async function ensureAdminUser() {
  if (!ENV.adminEmail || !ENV.adminPassword) {
    console.warn("[Auth] ADMIN_EMAIL / ADMIN_PASSWORD not set — no local admin account will be created.");
    return;
  }
  const db = await getDb();
  if (!db) return;

  const email = ENV.adminEmail.trim().toLowerCase();
  const { hashPassword } = await import("./_core/password");
  const passwordHash = await hashPassword(ENV.adminPassword);
  const openId = `local:${email}`;

  await upsertUser({
    openId,
    email,
    name: ENV.ownerName,
    passwordHash,
    role: "admin",
    loginMethod: "password",
  });
  console.log(`[Auth] Local admin account ready for ${email}`);
}

/** Admin-created local account (email + password), no OAuth involved. */
export async function createLocalUser(input: {
  email: string;
  password: string;
  name: string | null;
  role: "user" | "admin" | "supplier";
}) {
  const db = await requireDb();
  const email = input.email.trim().toLowerCase();
  const existing = await getUserByEmail(email);
  if (existing) throw new Error("Já existe uma conta com este email.");

  const { hashPassword } = await import("./_core/password");
  const passwordHash = await hashPassword(input.password);
  const openId = `local:${email}`;

  await db.insert(users).values({
    openId,
    email,
    name: input.name,
    passwordHash,
    role: input.role,
    loginMethod: "password",
    lastSignedIn: new Date(),
  });

  return getUserByEmail(email);
}

export async function listEquipmentWithStages() {
  const db = await requireDb();
  const [items, stages] = await Promise.all([
    db.select().from(equipmentItems).orderBy(asc(equipmentItems.itemNumber)),
    db.select().from(procurementStages).orderBy(asc(procurementStages.id)),
  ]);

  const stagesByEquipment = new Map<number, typeof stages>();
  for (const stage of stages) {
    const equipmentStages = stagesByEquipment.get(stage.equipmentId) ?? [];
    equipmentStages.push(stage);
    stagesByEquipment.set(stage.equipmentId, equipmentStages);
  }

  return items.map(item => ({
    ...item,
    stages: stagesByEquipment.get(item.id) ?? [],
  }));
}

export async function getEquipmentById(id: number) {
  const db = await requireDb();
  const [item] = await db.select().from(equipmentItems).where(eq(equipmentItems.id, id)).limit(1);
  if (!item) return null;
  const stages = await db
    .select()
    .from(procurementStages)
    .where(eq(procurementStages.equipmentId, id))
    .orderBy(asc(procurementStages.id));
  return { ...item, stages };
}

export type EquipmentWriteInput = {
  name: string;
  brand: string | null;
  model: string | null;
  quantity: number;
  unitValueCents: number;
  invoiceUrl: string | null;
};

export async function createEquipment(input: EquipmentWriteInput, userId: number) {
  const db = await requireDb();
  const id = await db.transaction(async tx => {
    const [maxItem] = await tx
      .select({ value: sql<number>`coalesce(max(${equipmentItems.itemNumber}), 0)` })
      .from(equipmentItems);
    const itemNumber = Number(maxItem?.value ?? 0) + 1;
    const [insertResult] = await tx.insert(equipmentItems).values({
      itemNumber,
      ...input,
      totalValueCents: input.quantity * input.unitValueCents,
      createdBy: userId,
    });
    const equipmentId = Number(insertResult.insertId);

    await tx.insert(procurementStages).values(
      STAGE_DEFINITIONS.map(stage => ({
        equipmentId,
        stageKey: stage.key,
        status: "pending" as const,
        updatedBy: userId,
      })),
    );
    return equipmentId;
  });
  return getEquipmentById(id);
}

export async function updateEquipment(
  id: number,
  input: EquipmentWriteInput,
) {
  const db = await requireDb();
  await db
    .update(equipmentItems)
    .set({
      ...input,
      totalValueCents: input.quantity * input.unitValueCents,
    })
    .where(eq(equipmentItems.id, id));
  return getEquipmentById(id);
}

export async function updateProcurementStage(input: {
  equipmentId: number;
  stageKey: StageKey;
  status: StageStatus;
  stageDate: number | null;
  notes: string | null;
  userId: number;
}) {
  const db = await requireDb();
  await db
    .update(procurementStages)
    .set({
      status: input.status,
      stageDate: input.stageDate,
      notes: input.notes,
      updatedBy: input.userId,
    })
    .where(
      sql`${procurementStages.equipmentId} = ${input.equipmentId} and ${procurementStages.stageKey} = ${input.stageKey}`,
    );
  return getEquipmentById(input.equipmentId);
}

export async function getDashboardOverview() {
  const items = await listEquipmentWithStages();
  const allStages = items.flatMap(item => item.stages);
  const completedStages = allStages.filter(stage => stage.status === "completed").length;
  const totalStages = items.length * STAGE_DEFINITIONS.length;
  const blockedStages = allStages.filter(stage => stage.status === "blocked").length;
  const completedItems = items.filter(
    item => item.stages.length === STAGE_DEFINITIONS.length && item.stages.every(stage => stage.status === "completed"),
  ).length;
  const activeItems = items.filter(item =>
    item.stages.some(stage => stage.status === "in_progress" || stage.status === "completed" || stage.status === "blocked"),
  ).length;

  const stageSummary = STAGE_DEFINITIONS.map(definition => {
    const stages = allStages.filter(stage => stage.stageKey === definition.key);
    return {
      ...definition,
      pending: stages.filter(stage => stage.status === "pending").length,
      inProgress: stages.filter(stage => stage.status === "in_progress").length,
      completed: stages.filter(stage => stage.status === "completed").length,
      blocked: stages.filter(stage => stage.status === "blocked").length,
    };
  });

  const db = await requireDb();
  const recentUpdates = await db
    .select({
      id: procurementStages.id,
      equipmentId: procurementStages.equipmentId,
      equipmentName: equipmentItems.name,
      itemNumber: equipmentItems.itemNumber,
      stageKey: procurementStages.stageKey,
      status: procurementStages.status,
      stageDate: procurementStages.stageDate,
      notes: procurementStages.notes,
      updatedAt: procurementStages.updatedAt,
    })
    .from(procurementStages)
    .innerJoin(equipmentItems, eq(procurementStages.equipmentId, equipmentItems.id))
    .where(sql`${procurementStages.status} <> 'pending' or ${procurementStages.stageDate} is not null or ${procurementStages.notes} is not null`)
    .orderBy(desc(procurementStages.updatedAt))
    .limit(6);

  return {
    totalItems: items.length,
    totalUnits: items.reduce((sum, item) => sum + item.quantity, 0),
    totalValueCents: items.reduce((sum, item) => sum + item.totalValueCents, 0),
    completedItems,
    activeItems,
    blockedStages,
    completedStages,
    totalStages,
    overallProgress: totalStages === 0 ? 0 : Math.round((completedStages / totalStages) * 100),
    stageSummary,
    recentUpdates,
  };
}

export async function getEffectivePermissions(userId: number, role: "user" | "admin" | "supplier") {
  if (role === "admin") return defaultPermissionsForRole("admin");
  const db = await requireDb();
  const [stored] = await db.select().from(userPermissions).where(eq(userPermissions.userId, userId)).limit(1);
  if (!stored) return defaultPermissionsForRole(role);
  const permissions = Object.fromEntries(permissionKeys.map(key => [key, stored[key]])) as unknown as AppPermissions;
  return { ...permissions, canViewBudgetValues: false };
}

export async function getSupplierProfile(userId: number) {
  const db = await requireDb();
  const [profile] = await db.select().from(supplierProfiles).where(eq(supplierProfiles.userId, userId)).limit(1);
  return profile ?? null;
}

export async function listUsersWithAccess() {
  const db = await requireDb();
  const [allUsers, allPermissions, allProfiles] = await Promise.all([
    db.select().from(users).orderBy(desc(users.lastSignedIn)),
    db.select().from(userPermissions),
    db.select().from(supplierProfiles),
  ]);
  const permissionsByUser = new Map(allPermissions.map(row => [row.userId, row]));
  const profileByUser = new Map(allProfiles.map(row => [row.userId, row]));

  return allUsers.map(user => {
    const stored = permissionsByUser.get(user.id);
    const permissions = user.role === "admin" || !stored
      ? defaultPermissionsForRole(user.role)
      : {
          ...(Object.fromEntries(permissionKeys.map(key => [key, stored[key]])) as unknown as AppPermissions),
          canViewBudgetValues: false,
        };
    return {
      ...user,
      permissions,
      supplierProfile: profileByUser.get(user.id) ?? null,
    };
  });
}

export async function updateUserAccess(input: {
  userId: number;
  role: "user" | "admin" | "supplier";
  isActive: boolean;
  permissions: AppPermissions;
  companyName: string | null;
  cnpj: string | null;
  contactPhone: string | null;
  updatedBy: number;
}) {
  const db = await requireDb();
  await db.transaction(async tx => {
    await tx.update(users).set({ role: input.role, isActive: input.isActive }).where(eq(users.id, input.userId));
    const permissions = input.role === "admin"
      ? defaultPermissionsForRole("admin")
      : { ...input.permissions, canViewBudgetValues: false };
    await tx
      .insert(userPermissions)
      .values({ userId: input.userId, ...permissions, updatedBy: input.updatedBy })
      .onDuplicateKeyUpdate({ set: { ...permissions, updatedBy: input.updatedBy } });

    if (input.role === "supplier" || input.companyName || input.cnpj || input.contactPhone) {
      await tx
        .insert(supplierProfiles)
        .values({
          userId: input.userId,
          companyName: input.companyName,
          cnpj: input.cnpj,
          contactPhone: input.contactPhone,
        })
        .onDuplicateKeyUpdate({
          set: {
            companyName: input.companyName,
            cnpj: input.cnpj,
            contactPhone: input.contactPhone,
          },
        });
    }
  });
  return listUsersWithAccess();
}

export async function upsertSupplierProfile(input: {
  userId: number;
  companyName: string | null;
  cnpj: string | null;
  contactPhone: string | null;
}) {
  const db = await requireDb();
  await db
    .insert(supplierProfiles)
    .values(input)
    .onDuplicateKeyUpdate({
      set: {
        companyName: input.companyName,
        cnpj: input.cnpj,
        contactPhone: input.contactPhone,
      },
    });
  return getSupplierProfile(input.userId);
}

export async function listSupplierPortalItems(supplierUserId: number) {
  const db = await requireDb();
  const [items, quotes] = await Promise.all([
    db
      .select({
        id: equipmentItems.id,
        itemNumber: equipmentItems.itemNumber,
        name: equipmentItems.name,
        brand: equipmentItems.brand,
        model: equipmentItems.model,
        quantity: equipmentItems.quantity,
      })
      .from(equipmentItems)
      .orderBy(asc(equipmentItems.itemNumber)),
    db.select().from(supplierQuotes).where(eq(supplierQuotes.supplierUserId, supplierUserId)),
  ]);
  const quoteByEquipment = new Map(quotes.map(quote => [quote.equipmentId, quote]));
  return items.map(item => ({ ...item, quote: quoteByEquipment.get(item.id) ?? null }));
}

export async function upsertSupplierQuote(input: {
  supplierUserId: number;
  equipmentId: number;
  unitValueCents: number;
  offeredBrand: string | null;
  offeredModel: string | null;
  leadTimeDays: number | null;
  notes: string | null;
  status: "draft" | "submitted";
}) {
  const db = await requireDb();
  await db
    .insert(supplierQuotes)
    .values(input)
    .onDuplicateKeyUpdate({
      set: {
        unitValueCents: input.unitValueCents,
        offeredBrand: input.offeredBrand,
        offeredModel: input.offeredModel,
        leadTimeDays: input.leadTimeDays,
        notes: input.notes,
        status: input.status,
      },
    });
  return listSupplierPortalItems(input.supplierUserId);
}

export async function listAllSupplierQuotes() {
  const db = await requireDb();
  return db
    .select({
      quoteId: supplierQuotes.id,
      equipmentId: supplierQuotes.equipmentId,
      itemNumber: equipmentItems.itemNumber,
      equipmentName: equipmentItems.name,
      quantity: equipmentItems.quantity,
      supplierUserId: supplierQuotes.supplierUserId,
      supplierName: users.name,
      supplierEmail: users.email,
      companyName: supplierProfiles.companyName,
      unitValueCents: supplierQuotes.unitValueCents,
      offeredBrand: supplierQuotes.offeredBrand,
      offeredModel: supplierQuotes.offeredModel,
      leadTimeDays: supplierQuotes.leadTimeDays,
      notes: supplierQuotes.notes,
      status: supplierQuotes.status,
      updatedAt: supplierQuotes.updatedAt,
    })
    .from(supplierQuotes)
    .innerJoin(equipmentItems, eq(supplierQuotes.equipmentId, equipmentItems.id))
    .innerJoin(users, eq(supplierQuotes.supplierUserId, users.id))
    .leftJoin(supplierProfiles, eq(supplierQuotes.supplierUserId, supplierProfiles.userId))
    .orderBy(asc(equipmentItems.itemNumber), asc(users.name));
}
