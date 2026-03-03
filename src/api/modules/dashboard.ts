import { apiClient } from '../client';
import { OPENAPI_BLOCKER_IDS } from './openapi-blockers';
import { isRecord } from './runtime-parsers';

type DashboardEntity = {
  status?: string;
};

export type DashboardSnapshot = {
  fetchedAt: string;
  fieldsTotal: number;
  fieldsActive: number;
  fieldsInactive: number;
  lotsTotal: number;
  lotsActive: number;
  lotsInactive: number;
  cropsTotal: number;
  productsTotal: number;
  inventoryRowsTotal: number;
  equipmentTotal: number;
  tasksTotal: number;
  contactsTotal: number;
  ordersTotal: number;
  productionCyclesTotal: number;
  lowStockAlertsTotal: number;
};

function readEntityArray(payload: unknown, key: string): DashboardEntity[] {
  if (!isRecord(payload)) return [];
  const value = payload[key];
  return Array.isArray(value) ? (value as DashboardEntity[]) : [];
}

function countActive(rows: DashboardEntity[]): number {
  return rows.filter((row) => row?.status !== 'inactive').length;
}

function countInactive(rows: DashboardEntity[]): number {
  return rows.filter((row) => row?.status === 'inactive').length;
}

function parseSnapshot(payload: unknown): DashboardSnapshot {
  const fields = readEntityArray(payload, 'fields');
  const lots = readEntityArray(payload, 'lots');
  const crops = readEntityArray(payload, 'crops');
  const products = readEntityArray(payload, 'products');
  const inventory = readEntityArray(payload, 'productInventory');
  const equipment = readEntityArray(payload, 'equipment');
  const tasks = readEntityArray(payload, 'tasks');
  const contacts = readEntityArray(payload, 'contacts');
  const orders = readEntityArray(payload, 'orders');
  const cycles = readEntityArray(payload, 'productionCycles');
  const lowStock = readEntityArray(payload, 'lowStockAlerts');

  return {
    fetchedAt: new Date().toISOString(),
    fieldsTotal: fields.length,
    fieldsActive: countActive(fields),
    fieldsInactive: countInactive(fields),
    lotsTotal: lots.length,
    lotsActive: countActive(lots),
    lotsInactive: countInactive(lots),
    cropsTotal: crops.length,
    productsTotal: products.length,
    inventoryRowsTotal: inventory.length,
    equipmentTotal: equipment.length,
    tasksTotal: tasks.length,
    contactsTotal: contacts.length,
    ordersTotal: orders.length,
    productionCyclesTotal: cycles.length,
    lowStockAlertsTotal: lowStock.length,
  };
}

// TODO(openapi-blocker: QH-OAPI-005): Replace unknown response parsing once dashboard snapshot is typed in OpenAPI.
export async function getDashboardSnapshot(token: string): Promise<DashboardSnapshot> {
  const { data } = await apiClient.get<unknown>('/dashboard/snapshot', { token });
  return parseSnapshot(data);
}

export const DASHBOARD_RESPONSE_SCHEMA_BLOCKER_ID =
  OPENAPI_BLOCKER_IDS.DASHBOARD_SNAPSHOT_RESPONSE_SCHEMA;
