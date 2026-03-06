import type { DashboardSnapshot } from '../api/modules/dashboard';

export type ProtectedNavigationGroupKey =
  | 'overview'
  | 'operations'
  | 'commerce'
  | 'administration';

export type ProtectedNavigationItem = {
  key: string;
  label: string;
  icon: string;
  href: string;
  menuKey: string;
  group: ProtectedNavigationGroupKey;
  drawerSubtitle: string;
  getSubtitle: (snapshot: DashboardSnapshot | null) => string;
  getBadgeValue?: (snapshot: DashboardSnapshot | null) => string | number | null;
};

export const PROTECTED_NAVIGATION_GROUPS: Array<{
  key: ProtectedNavigationGroupKey;
  label: string;
}> = [
  { key: 'overview', label: 'Overview' },
  { key: 'operations', label: 'Operations' },
  { key: 'commerce', label: 'Commerce' },
  { key: 'administration', label: 'Administration' },
];

export const PROTECTED_NAVIGATION_ITEMS: ProtectedNavigationItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'view-dashboard-outline',
    href: '/(protected)/dashboard',
    menuKey: 'dashboard',
    group: 'overview',
    drawerSubtitle: 'Live overview of farm operations.',
    getSubtitle: (snapshot) =>
      snapshot?.fetchedAt
        ? `Snapshot refreshed ${snapshot.fetchedAt.slice(11, 16)}`
        : 'Live overview of farm operations.',
  },
  {
    key: 'fields',
    label: 'Fields',
    icon: 'map-outline',
    href: '/(protected)/fields',
    menuKey: 'fields',
    group: 'operations',
    drawerSubtitle: 'Field boundaries, acreage, and status.',
    getSubtitle: (snapshot) =>
      `${snapshot?.fieldsActive ?? 0} active of ${snapshot?.fieldsTotal ?? 0} fields`,
    getBadgeValue: (snapshot) => snapshot?.fieldsTotal ?? 0,
  },
  {
    key: 'lots',
    label: 'Lots',
    icon: 'sprout-outline',
    href: '/(protected)/lots',
    menuKey: 'lots',
    group: 'operations',
    drawerSubtitle: 'Lot activity, field links, and lifecycle.',
    getSubtitle: (snapshot) =>
      `${snapshot?.lotsActive ?? 0} active of ${snapshot?.lotsTotal ?? 0} lots`,
    getBadgeValue: (snapshot) => snapshot?.lotsTotal ?? 0,
  },
  {
    key: 'tasks',
    label: 'Tasks',
    icon: 'clipboard-check-outline',
    href: '/(protected)/tasks',
    menuKey: 'tasks',
    group: 'operations',
    drawerSubtitle: 'Operational task planning and execution.',
    getSubtitle: (snapshot) => `${snapshot?.tasksTotal ?? 0} queued operations`,
    getBadgeValue: (snapshot) => snapshot?.tasksTotal ?? 0,
  },
  {
    key: 'equipment',
    label: 'Equipment',
    icon: 'tractor-variant',
    href: '/(protected)/equipment',
    menuKey: 'equipment',
    group: 'operations',
    drawerSubtitle: 'Equipment, usage logs, and maintenance.',
    getSubtitle: (snapshot) => `${snapshot?.equipmentTotal ?? 0} tracked assets`,
    getBadgeValue: (snapshot) => snapshot?.equipmentTotal ?? 0,
  },
  {
    key: 'inventory',
    label: 'Inventory',
    icon: 'archive-outline',
    href: '/(protected)/inventory',
    menuKey: 'inventory',
    group: 'commerce',
    drawerSubtitle: 'Products, categories, taxes, and warehouses.',
    getSubtitle: (snapshot) =>
      `${snapshot?.productsTotal ?? 0} products and ${snapshot?.inventoryRowsTotal ?? 0} stock rows`,
    getBadgeValue: (snapshot) => snapshot?.productsTotal ?? 0,
  },
  {
    key: 'orders',
    label: 'Orders',
    icon: 'cart-outline',
    href: '/(protected)/orders',
    menuKey: 'orders',
    group: 'commerce',
    drawerSubtitle: 'Orders, vouchers, and sales transactions.',
    getSubtitle: (snapshot) =>
      `${snapshot?.ordersTotal ?? 0} orders and ${snapshot?.lowStockAlertsTotal ?? 0} low-stock alerts`,
    getBadgeValue: (snapshot) => snapshot?.ordersTotal ?? 0,
  },
  {
    key: 'finance',
    label: 'Finance',
    icon: 'cash-multiple',
    href: '/(protected)/finance',
    menuKey: 'finance',
    group: 'commerce',
    drawerSubtitle: 'Transactions, groups, and cash movement.',
    getSubtitle: () => 'Transactions, groups, and cash movement.',
  },
  {
    key: 'crops',
    label: 'Crops',
    icon: 'leaf',
    href: '/(protected)/crops',
    menuKey: 'crops',
    group: 'commerce',
    drawerSubtitle: 'Crops, cycles, and logbook records.',
    getSubtitle: (snapshot) =>
      `${snapshot?.cropsTotal ?? 0} crops and ${snapshot?.productionCyclesTotal ?? 0} production cycles`,
    getBadgeValue: (snapshot) => snapshot?.cropsTotal ?? 0,
  },
  {
    key: 'livestock',
    label: 'Livestock',
    icon: 'cow',
    href: '/(protected)/livestock',
    menuKey: 'livestock',
    group: 'commerce',
    drawerSubtitle: 'Animals, housing, and weather rules.',
    getSubtitle: () => 'Animals, housing, and weather rules.',
  },
  {
    key: 'management',
    label: 'Management',
    icon: 'account-group-outline',
    href: '/(protected)/management',
    menuKey: 'users',
    group: 'administration',
    drawerSubtitle: 'Users, roles, and invites.',
    getSubtitle: () => 'Users, roles, and invites.',
  },
  {
    key: 'contacts',
    label: 'Contacts',
    icon: 'card-account-phone-outline',
    href: '/(protected)/contacts',
    menuKey: 'contacts',
    group: 'administration',
    drawerSubtitle: 'Standalone farm contact directory.',
    getSubtitle: (snapshot) => `${snapshot?.contactsTotal ?? 0} farm contacts`,
    getBadgeValue: (snapshot) => snapshot?.contactsTotal ?? 0,
  },
  {
    key: 'account',
    label: 'Account',
    icon: 'account-circle-outline',
    href: '/(protected)/account',
    menuKey: 'settings',
    group: 'administration',
    drawerSubtitle: 'Profile context, access, and subscription.',
    getSubtitle: () => 'Profile context, access, and subscription.',
  },
];

export function toProtectedPath(href: string): string {
  return href.replace('/(protected)', '');
}
