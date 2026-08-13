function getInitialTheme() {
  const saved = localStorage.getItem('pdfeditor.theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const createUiSlice = (set, get) => ({
  toasts: [],
  theme: getInitialTheme(),
  loading: false,
  recoverableSession: null,

  setLoading: (loading) => set({ loading }),

  setTheme: (theme) => {
    localStorage.setItem('pdfeditor.theme', theme);
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('pdfeditor.theme', next);
    set({ theme: next });
  },

  setRecoverableSession: (session) => set({ recoverableSession: session }),

  addToast: ({ type = 'info', message, duration = 3000 }) =>
    set((s) => {
      const id = crypto.randomUUID();
      // Auto-remove after duration via a timeout (set outside Zustand).
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
      return { toasts: [...s.toasts, { id, type, message }] };
    }),

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
});
