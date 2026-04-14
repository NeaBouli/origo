import { create } from 'zustand';
export const useUI = create((set) => ({
  screen: 'universe',
  toasts: [],
  setScreen: (screen) => set({ screen }),
  showToast: (message, type = 'info') => {
    const id = Date.now();
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 3000);
  },
  dismissToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));
