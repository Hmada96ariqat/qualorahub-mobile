import { ApiError } from '../../../api/client';
import {
  buildPracticeValidationFields,
  getDynamicFieldsForPractice,
  getPracticeRequirement,
  getPracticeRequirementAnyOfKey,
} from './practiceConfig';
import type { LogbookFormField, LogbookOperationFamily } from './types';
import { toNullableNumber } from './helpers';

export type LogbookFieldErrors = Record<string, string>;

const normalizeToken = (value: string): string =>
  value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

const isBlank = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim().length === 0;
  }

  return false;
};

const requiredFieldMessage = (field: LogbookFormField): string => `${field.label} is required.`;
const requiredPositiveNumberMessage = (field: LogbookFormField): string =>
  `${field.label} must be greater than 0.`;

const toObjectValue = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
};

const buildFieldSpec = (key: string, label: string): LogbookFormField => ({
  key,
  label,
  type: 'text',
});

type RawApiFieldError = {
  field: string;
  message: string;
  code: 'required' | 'unsupported';
};

const fromMessage = (message: string): RawApiFieldError | null => {
  const requiredMatch = message.match(/^([a-zA-Z_][a-zA-Z0-9_]*) is required$/);
  if (requiredMatch) {
    return {
      field: requiredMatch[1],
      message: `${requiredMatch[1]} is required.`,
      code: 'required',
    };
  }

  const invalidColumnMatch = message.match(
    /Invalid column name in payload:\s*([a-zA-Z_][a-zA-Z0-9_]*)/i,
  );
  if (invalidColumnMatch) {
    return {
      field: invalidColumnMatch[1],
      message: `Unsupported field "${invalidColumnMatch[1]}" in this form.`,
      code: 'unsupported',
    };
  }

  return null;
};

const readString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const normalizeApiFieldKey = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  const normalized = trimmed
    .replace(/^payload\./, '')
    .replace(/^details\./, '')
    .replace(/^payload\.details\./, '')
    .replace(/^workers\.\d+\./, 'workers.')
    .replace(/^payload\.workers\.\d+\./, 'workers.');

  if (normalized.startsWith('workers.')) {
    return 'workers';
  }

  return normalized;
};

const pickMessage = (defaultMessage: string, fieldLabel: string | null): string => {
  if (!fieldLabel) {
    return defaultMessage.endsWith('.') ? defaultMessage : `${defaultMessage}.`;
  }

  const leadingToken = defaultMessage.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\b/)?.[1] ?? null;
  const shouldReplaceLeadingToken =
    leadingToken !== null &&
    (leadingToken.includes('_') || leadingToken === leadingToken.toLowerCase());
  const normalized = shouldReplaceLeadingToken
    ? defaultMessage.replace(/^([a-zA-Z_][a-zA-Z0-9_]*)/, fieldLabel)
    : defaultMessage;

  return normalized.endsWith('.') ? normalized : `${normalized}.`;
};

export function validateRequiredFields(
  fields: LogbookFormField[],
  formData: Record<string, unknown>,
): LogbookFieldErrors {
  const errors: LogbookFieldErrors = {};

  for (const field of fields) {
    if (!field.required) {
      continue;
    }

    const value = formData[field.key];

    if (field.type === 'checkbox') {
      if (!value) {
        errors[field.key] = requiredFieldMessage(field);
      }
      continue;
    }

    if (field.type === 'products_editor') {
      if (!Array.isArray(value) || value.length === 0) {
        errors[field.key] = requiredFieldMessage(field);
      }
      continue;
    }

    if (field.type === 'number') {
      const numericValue = toNullableNumber(value);
      if (numericValue === null) {
        errors[field.key] = requiredFieldMessage(field);
        continue;
      }

      if (numericValue <= 0) {
        errors[field.key] = requiredPositiveNumberMessage(field);
      }
      continue;
    }

    if (isBlank(value)) {
      errors[field.key] = requiredFieldMessage(field);
    }
  }

  return errors;
}

export function buildHarvestValidationFields(): LogbookFormField[] {
  return [buildFieldSpec('workers', 'Workers')];
}

export function validatePracticeRequirementFields(args: {
  family: LogbookOperationFamily | null | undefined;
  practiceCode: string | null | undefined;
  formData: Record<string, unknown>;
  baseFields?: LogbookFormField[];
}): { fieldErrors: LogbookFieldErrors; sectionError: string | null } {
  const requirement = getPracticeRequirement(args.family, args.practiceCode);
  if (!requirement) {
    return {
      fieldErrors: {},
      sectionError: null,
    };
  }

  const details = toObjectValue(args.formData.details);
  const dynamicFields = getDynamicFieldsForPractice(args.practiceCode);
  const fieldLabelByKey = new Map(dynamicFields.map((field) => [field.key, field.label]));
  const dynamicFieldByKey = new Map(dynamicFields.map((field) => [field.key, field]));
  const baseFieldByKey = new Map((args.baseFields ?? []).map((field) => [field.key, field] as const));
  const errors: LogbookFieldErrors = {};

  for (const key of requirement.requiredBaseFields) {
    const value = args.formData[key];
    const field = baseFieldByKey.get(key);

    if (field?.type === 'products_editor') {
      if (Array.isArray(value) && value.length > 0) {
        continue;
      }

      errors[key] = requiredFieldMessage(field);
      continue;
    }

    if (field?.type === 'number') {
      const numericValue = toNullableNumber(value);
      if (numericValue !== null && numericValue > 0) {
        continue;
      }

      errors[key] =
        numericValue === null
          ? requiredFieldMessage(field)
          : requiredPositiveNumberMessage(field);
      continue;
    }

    if (!isBlank(value)) {
      continue;
    }

    const label = field?.label ?? key;
    errors[key] = `${label} is required.`;
  }

  for (const key of requirement.requiredDetailFields) {
    const field = dynamicFieldByKey.get(key);
    const numericValue = field?.type === 'number' ? toNullableNumber(details[key]) : null;

    if (
      (field?.type === 'number' && numericValue !== null && numericValue > 0) ||
      (field?.type !== 'number' && !isBlank(details[key]))
    ) {
      continue;
    }

    const label = fieldLabelByKey.get(key) ?? key;
    errors[key] =
      field?.type === 'number'
        ? `${label} must be greater than 0.`
        : `${label} is required.`;
  }

  if (requirement.requireAnyDetailFieldKeys?.length) {
    const hasAnyDetailValue = requirement.requireAnyDetailFieldKeys.some((key) => {
      const field = dynamicFieldByKey.get(key);
      if (field?.type === 'number') {
        const numericValue = toNullableNumber(details[key]);
        return numericValue !== null && numericValue > 0;
      }

      return !isBlank(details[key]);
    });

    if (!hasAnyDetailValue) {
      const labels = requirement.requireAnyDetailFieldKeys.map(
        (key) => fieldLabelByKey.get(key) ?? key,
      );
      const message = `At least one of ${labels.join(', ')} is required.`;
      const groupKey = getPracticeRequirementAnyOfKey(requirement);

      if (groupKey) {
        errors[groupKey] = message;
      }

      return {
        fieldErrors: errors,
        sectionError: message,
      };
    }
  }

  return {
    fieldErrors: errors,
    sectionError: null,
  };
}

export function validateHarvestWorkerRows(value: unknown): LogbookFieldErrors {
  if (!Array.isArray(value) || value.length === 0) {
    return {
      workers: 'Workers is required.',
    };
  }

  const hasInvalidRow = value.some((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return true;
    }

    const row = entry as Record<string, unknown>;
    const quantity = toNullableNumber(row.quantity);
    return (
      isBlank(row.workerId) ||
      isBlank(row.workerName) ||
      isBlank(row.unit) ||
      quantity === null ||
      quantity <= 0
    );
  });

  return hasInvalidRow
    ? {
        workers: 'Select a worker and enter a positive quantity for each row.',
      }
    : {};
}

export function resolveApiFieldError(
  error: unknown,
  fields: LogbookFormField[],
): { fieldKey: string; message: string } | null {
  if (!(error instanceof ApiError)) {
    return null;
  }

  const details =
    error.details && typeof error.details === 'object'
      ? (error.details as Record<string, unknown>)
      : null;
  const parsedMessage = fromMessage(error.message);
  const detailsField = readString(details?.field);
  const messageField = parsedMessage?.field ?? null;
  const rawField = normalizeApiFieldKey(detailsField ?? messageField ?? '');

  if (!rawField) {
    return null;
  }

  const normalizedRaw = normalizeToken(rawField);
  const matchedField =
    fields.find((field) => field.key === rawField) ??
    fields.find((field) => normalizeToken(field.key) === normalizedRaw);

  if (!matchedField) {
    return null;
  }

  const baseMessage = (() => {
    if (parsedMessage?.code === 'required') {
      return `${matchedField.label} is required.`;
    }

    if (parsedMessage?.code === 'unsupported') {
      return `Unsupported field "${matchedField.label}" in this form.`;
    }

    return `${matchedField.label} is invalid.`;
  })();

  return {
    fieldKey: matchedField.key,
    message: pickMessage(baseMessage, matchedField.label),
  };
}

export { buildPracticeValidationFields };
