import type {
  AnimalGroup,
  AnimalHealthCheck,
  AnimalRecord,
  AnimalYieldRecord,
  HousingConsumptionLog,
  HousingMaintenanceRecord,
  HousingUnit,
  WeatherAlertRule,
} from '../../api/modules/livestock';
import type { MapCoordinate } from '../../utils/geojson';
import { fromGeoJsonPolygon } from '../../utils/geojson';

export type LivestockTab = 'animals' | 'housing' | 'weather';

export const LIVESTOCK_TAB_OPTIONS = [
  { value: 'animals', label: 'Animals' },
  { value: 'housing', label: 'Housing' },
  { value: 'weather', label: 'Weather' },
] as const;

export const ANIMAL_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const;

export const WEATHER_OPERATOR_OPTIONS = [
  { value: '>', label: '>' },
  { value: '>=', label: '>=' },
  { value: '<', label: '<' },
  { value: '<=', label: '<=' },
  { value: '=', label: '=' },
] as const;

export const WEATHER_CONDITION_OPTIONS = [
  { value: 'temperature', label: 'Temperature' },
  { value: 'humidity', label: 'Humidity' },
  { value: 'wind_speed', label: 'Wind Speed' },
  { value: 'rainfall', label: 'Rainfall' },
] as const;

export const WEATHER_SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
] as const;

export type AnimalFormValues = {
  name: string;
  species: string;
  breed: string;
  tagNumber: string;
  healthStatus: string;
  activeStatus: string;
  quantity: string;
  groupId: string;
  housingUnitId: string;
  lastVetVisit: string;
  notes: string;
};

export type AnimalGroupFormValues = {
  name: string;
  species: string;
  status: string;
  notes: string;
};

export type HealthCheckFormValues = {
  date: string;
  status: string;
  notes: string;
  performedBy: string;
};

export type YieldRecordFormValues = {
  date: string;
  yieldType: string;
  amount: string;
  unit: string;
  notes: string;
};

export type HousingUnitFormValues = {
  barnName: string;
  unitCode: string;
  fieldId: string;
  capacity: string;
  currentStatus: string;
  animalTypesCsv: string;
  boundaryPoints: MapCoordinate[];
  notes: string;
};

export type HousingMaintenanceFormValues = {
  date: string;
  maintenanceType: string;
  status: string;
  cost: string;
  notes: string;
};

export type HousingConsumptionFormValues = {
  date: string;
  feedAmount: string;
  waterAmount: string;
  unit: string;
  notes: string;
};

export type WeatherRuleFormValues = {
  lotId: string;
  fieldId: string;
  name: string;
  condition: string;
  operator: string;
  value: string;
  unit: string;
  severity: string;
  enabled: boolean;
  customMessage: string;
  notifyInApp: boolean;
  notifyEmail: boolean;
  notifySms: boolean;
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function toAnimalFormValues(animal?: AnimalRecord | null): AnimalFormValues {
  if (!animal) {
    return {
      name: '',
      species: '',
      breed: '',
      tagNumber: '',
      healthStatus: '',
      activeStatus: 'active',
      quantity: '1',
      groupId: '',
      housingUnitId: '',
      lastVetVisit: '',
      notes: '',
    };
  }

  return {
    name: animal.name,
    species: animal.species ?? '',
    breed: animal.breed ?? '',
    tagNumber: animal.tagNumber ?? '',
    healthStatus: animal.healthStatus ?? '',
    activeStatus: (animal.activeStatus ?? 'active').toLowerCase(),
    quantity: animal.quantity === null ? '1' : String(animal.quantity),
    groupId: animal.groupId ?? '',
    housingUnitId: animal.currentHousingUnitId ?? '',
    lastVetVisit: animal.lastVetVisit ?? '',
    notes: '',
  };
}

export function toAnimalGroupFormValues(group?: AnimalGroup | null): AnimalGroupFormValues {
  if (!group) {
    return {
      name: '',
      species: '',
      status: 'active',
      notes: '',
    };
  }

  return {
    name: group.name,
    species: group.species ?? '',
    status: (group.status ?? 'active').toLowerCase(),
    notes: group.notes ?? '',
  };
}

export function toHealthCheckFormValues(record?: AnimalHealthCheck | null): HealthCheckFormValues {
  if (!record) {
    return {
      date: todayIsoDate(),
      status: '',
      notes: '',
      performedBy: '',
    };
  }

  return {
    date: record.date ? record.date.slice(0, 10) : todayIsoDate(),
    status: record.status ?? '',
    notes: record.notes ?? '',
    performedBy: record.performedBy ?? '',
  };
}

export function toYieldRecordFormValues(record?: AnimalYieldRecord | null): YieldRecordFormValues {
  if (!record) {
    return {
      date: todayIsoDate(),
      yieldType: '',
      amount: '',
      unit: '',
      notes: '',
    };
  }

  return {
    date: record.date ? record.date.slice(0, 10) : todayIsoDate(),
    yieldType: record.yieldType ?? '',
    amount: record.amount === null ? '' : String(record.amount),
    unit: record.unit ?? '',
    notes: record.notes ?? '',
  };
}

export function toHousingUnitFormValues(unit?: HousingUnit | null): HousingUnitFormValues {
  if (!unit) {
    return {
      barnName: '',
      unitCode: '',
      fieldId: '',
      capacity: '',
      currentStatus: 'active',
      animalTypesCsv: '',
      boundaryPoints: [],
      notes: '',
    };
  }

  return {
    barnName: unit.barnName,
    unitCode: unit.unitCode ?? '',
    fieldId: unit.fieldId ?? '',
    capacity: unit.capacity === null ? '' : String(unit.capacity),
    currentStatus: (unit.currentStatus ?? 'active').toLowerCase(),
    animalTypesCsv: unit.animalTypes.join(', '),
    boundaryPoints: fromGeoJsonPolygon(unit.shapePolygon),
    notes: unit.notes ?? '',
  };
}

export function toHousingMaintenanceFormValues(
  record?: HousingMaintenanceRecord | null,
): HousingMaintenanceFormValues {
  if (!record) {
    return {
      date: todayIsoDate(),
      maintenanceType: '',
      status: '',
      cost: '',
      notes: '',
    };
  }

  return {
    date: record.date ? record.date.slice(0, 10) : todayIsoDate(),
    maintenanceType: record.maintenanceType ?? '',
    status: record.status ?? '',
    cost: record.cost === null ? '' : String(record.cost),
    notes: record.notes ?? '',
  };
}

export function toHousingConsumptionFormValues(
  record?: HousingConsumptionLog | null,
): HousingConsumptionFormValues {
  if (!record) {
    return {
      date: todayIsoDate(),
      feedAmount: '',
      waterAmount: '',
      unit: '',
      notes: '',
    };
  }

  return {
    date: record.date ? record.date.slice(0, 10) : todayIsoDate(),
    feedAmount: record.feedAmount === null ? '' : String(record.feedAmount),
    waterAmount: record.waterAmount === null ? '' : String(record.waterAmount),
    unit: record.unit ?? '',
    notes: record.notes ?? '',
  };
}

export function toWeatherRuleFormValues(rule?: WeatherAlertRule | null): WeatherRuleFormValues {
  if (!rule) {
    return {
      lotId: '',
      fieldId: '',
      name: '',
      condition: 'temperature',
      operator: '>=',
      value: '',
      unit: 'C',
      severity: 'medium',
      enabled: true,
      customMessage: '',
      notifyInApp: true,
      notifyEmail: false,
      notifySms: false,
    };
  }

  return {
    lotId: rule.lotId ?? '',
    fieldId: rule.fieldId ?? '',
    name: rule.name,
    condition: rule.condition ?? 'temperature',
    operator: rule.operator ?? '>=',
    value: rule.value === null ? '' : String(rule.value),
    unit: rule.unit ?? 'C',
    severity: rule.severity ?? 'medium',
    enabled: rule.enabled,
    customMessage: rule.customMessage ?? '',
    notifyInApp: true,
    notifyEmail: false,
    notifySms: false,
  };
}

export function parseCsvValues(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}
