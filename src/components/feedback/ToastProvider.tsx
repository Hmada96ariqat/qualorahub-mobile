import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Snackbar } from 'react-native-paper';
import { palette } from '../../theme/tokens';

type ToastVariant = 'info' | 'success' | 'error';

export type ToastOptions = {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
};

type ToastState = ToastOptions & {
  visible: boolean;
};

type ToastContextValue = {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

type ToastProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    setToast({
      visible: true,
      variant: 'info',
      duration: 3000,
      ...options,
    });
  }, []);

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      showToast,
      hideToast,
    }),
    [showToast, hideToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <Snackbar
        visible={Boolean(toast?.visible)}
        onDismiss={hideToast}
        duration={toast?.duration ?? 3000}
        action={
          toast?.actionLabel
            ? {
                label: toast.actionLabel,
                onPress: () => {
                  toast.onAction?.();
                  hideToast();
                },
              }
            : undefined
        }
        style={toast?.variant ? SNACKBAR_VARIANT_STYLES[toast.variant] : undefined}
        testID={toast?.testID ?? 'toast.snackbar'}
      >
        {toast?.message ?? ''}
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }

  return context;
}

const SNACKBAR_VARIANT_STYLES: Record<ToastVariant, { backgroundColor: string }> = {
  info: { backgroundColor: palette.primaryDark },
  success: { backgroundColor: palette.success },
  error: { backgroundColor: palette.destructive },
};
