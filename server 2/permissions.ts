import type { User } from "../drizzle/schema";

export const permissionKeys = [
  "canViewDashboard",
  "canViewItems",
  "canEditItems",
  "canViewStages",
  "canEditStages",
  "canViewInvoices",
  "canManageInvoices",
  "canViewBudgetValues",
  "canViewSupplierQuotes",
  "canSubmitQuotes",
] as const;

export type PermissionKey = (typeof permissionKeys)[number];
export type AppPermissions = Record<PermissionKey, boolean>;

const adminPermissions: AppPermissions = {
  canViewDashboard: true,
  canViewItems: true,
  canEditItems: true,
  canViewStages: true,
  canEditStages: true,
  canViewInvoices: true,
  canManageInvoices: true,
  canViewBudgetValues: true,
  canViewSupplierQuotes: true,
  canSubmitQuotes: true,
};

const trackingPermissions: AppPermissions = {
  canViewDashboard: true,
  canViewItems: true,
  canEditItems: false,
  canViewStages: true,
  canEditStages: false,
  canViewInvoices: true,
  canManageInvoices: false,
  canViewBudgetValues: false,
  canViewSupplierQuotes: false,
  canSubmitQuotes: false,
};

const supplierPermissions: AppPermissions = {
  canViewDashboard: false,
  canViewItems: true,
  canEditItems: false,
  canViewStages: false,
  canEditStages: false,
  canViewInvoices: false,
  canManageInvoices: false,
  canViewBudgetValues: false,
  canViewSupplierQuotes: false,
  canSubmitQuotes: true,
};

export function defaultPermissionsForRole(role: User["role"]): AppPermissions {
  if (role === "admin") return { ...adminPermissions };
  if (role === "supplier") return { ...supplierPermissions };
  return { ...trackingPermissions };
}

