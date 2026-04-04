type ReconciliationChangeListener = () => void;

const listeners = new Set<ReconciliationChangeListener>();

export function emitReconciliationChange() {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // Ignore listener errors so one screen cannot break updates for others.
    }
  }
}

export function subscribeToReconciliationChanges(listener: ReconciliationChangeListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
