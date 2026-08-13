export const createFormSlice = (set) => ({
  fieldValues: {},

  setFieldValue: (name, value) =>
    set((s) => ({ fieldValues: { ...s.fieldValues, [name]: value } })),
});
