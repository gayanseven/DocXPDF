export const createFormSlice = (set, get) => ({
  fieldValues: {},

  setFieldValue: (name, value) =>
    set((s) => ({ fieldValues: { ...s.fieldValues, [name]: value } })),

  clearAllFields: () => {
    const before = get().fieldValues;
    set({ fieldValues: {} });
    get().pushHistory({ sliceKey: 'fieldValues', before, after: {} });
  },
});
