import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren, RefObject } from 'react';
import type { ScrollView } from 'react-native';

type FormValidationContextValue = {
  errors: Record<string, string | undefined>;
  registerFieldLayout: (field: string, y: number) => void;
};

export type FormValidationProviderValue = FormValidationContextValue;

const FormValidationContext = createContext<FormValidationContextValue | null>(null);

export type FieldValidationRule<FieldName extends string> = {
  field: FieldName;
  message: string;
  isValid: boolean;
};

export function FormValidationProvider({
  value,
  children,
}: PropsWithChildren<{ value: FormValidationContextValue }>) {
  return <FormValidationContext.Provider value={value}>{children}</FormValidationContext.Provider>;
}

export function useFormFieldValidation() {
  return useContext(FormValidationContext);
}

export function useFormValidation<FieldName extends string>(
  scrollRef?: RefObject<ScrollView | null>,
) {
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const fieldPositionsRef = useRef(new Map<FieldName, number>());

  const registerFieldLayout = useCallback((field: FieldName, y: number) => {
    fieldPositionsRef.current.set(field, y);
  }, []);

  const scrollToField = useCallback(
    (field: FieldName) => {
      const y = fieldPositionsRef.current.get(field);
      if (y === undefined) {
        return;
      }

      scrollRef?.current?.scrollTo?.({
        y: Math.max(0, y - 24),
        animated: true,
      });
    },
    [scrollRef],
  );

  const clearFieldError = useCallback((field: FieldName) => {
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setErrors({});
  }, []);

  const validate = useCallback(
    (rules: FieldValidationRule<FieldName>[]) => {
      const nextErrors: Partial<Record<FieldName, string>> = {};
      let firstInvalidField: FieldName | null = null;

      for (const rule of rules) {
        if (rule.isValid) {
          continue;
        }

        nextErrors[rule.field] = rule.message;
        if (firstInvalidField === null) {
          firstInvalidField = rule.field;
        }
      }

      setErrors(nextErrors);

      if (firstInvalidField !== null) {
        setTimeout(() => {
          scrollToField(firstInvalidField);
        }, 0);
        return false;
      }

      return true;
    },
    [scrollToField],
  );

  const providerValue = useMemo<FormValidationContextValue>(
    () => ({
      errors: errors as Record<string, string | undefined>,
      registerFieldLayout: (field, y) => registerFieldLayout(field as FieldName, y),
    }),
    [errors, registerFieldLayout],
  );

  return {
    errors,
    clearFieldError,
    reset,
    validate,
    providerValue,
  };
}
