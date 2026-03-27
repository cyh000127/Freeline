import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '@/theme/colors';

type ToastType = 'success' | 'error' | 'info';

type ToastPayload = {
  message: string;
  type?: ToastType;
};

type ToastContextValue = {
  showToast: (payload: ToastPayload) => void;
};

type ToastState = {
  id: number;
  message: string;
  type: ToastType;
};

const ToastContext = createContext<ToastContextValue | null>(null);
const TOAST_DURATION_MS = 2400;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current));
    }, TOAST_DURATION_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, [toast]);

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast: ({ message, type = 'info' }) => {
        setToast({
          id: Date.now(),
          message,
          type,
        });
      },
    }),
    [],
  );

  const iconName =
    toast?.type === 'success' ? 'check-circle' : toast?.type === 'error' ? 'alert-circle' : 'info';

  return (
    <ToastContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        <View pointerEvents="box-none" style={styles.overlay}>
          {toast ? (
            <View
              pointerEvents="none"
              style={[
                styles.toast,
                toast.type === 'success'
                  ? styles.toastSuccess
                  : toast.type === 'error'
                    ? styles.toastError
                    : styles.toastInfo,
              ]}
            >
              <Feather color="#FFFFFF" name={iconName} size={18} />
              <Text style={styles.message}>{toast.message}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 20,
    zIndex: 5000,
    elevation: 5000,
  },
  toast: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    zIndex: 5001,
  },
  toastSuccess: {
    backgroundColor: palette.success,
  },
  toastError: {
    backgroundColor: palette.danger,
  },
  toastInfo: {
    backgroundColor: palette.ink,
  },
  message: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
});
