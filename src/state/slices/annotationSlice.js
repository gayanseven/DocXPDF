export const createAnnotationSlice = (set, get) => ({
  annotations: [], // { id, page, type:'pen'|'highlighter'|'rect'|'ellipse'|'arrow', points?, x?,y?,w?,h?, color, strokeWidth, opacity }
  selectedAnnotationId: null,

  addAnnotation: (annotation) => {
    const before = get().annotations;
    const after = [...before, annotation];
    set({ annotations: after });
    get().pushHistory({ sliceKey: 'annotations', before, after });
  },

  removeAnnotation: (id) => {
    const before = get().annotations;
    const after = before.filter((a) => a.id !== id);
    set({ annotations: after, selectedAnnotationId: null });
    get().pushHistory({ sliceKey: 'annotations', before, after });
  },

  setSelectedAnnotation: (id) => set({ selectedAnnotationId: id }),
});
