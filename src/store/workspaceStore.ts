import { create } from 'zustand'

interface WorkspaceState {
  selectedDocumentIds: string[]
  activeConversationId: string | null
  useHyde: boolean
  toggleDocument: (id: string) => void
  removeDocument: (id: string) => void
  clearDocuments: () => void
  setActiveConversation: (id: string | null) => void
  toggleHyde: () => void
  resetWorkspace: () => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  selectedDocumentIds: [],
  activeConversationId: null,
  useHyde: false,
  toggleDocument: (id) =>
    set((state) => ({
      selectedDocumentIds: state.selectedDocumentIds.includes(id)
        ? state.selectedDocumentIds.filter((documentId) => documentId !== id)
        : [...state.selectedDocumentIds, id],
    })),
  removeDocument: (id) =>
    set((state) => ({
      selectedDocumentIds: state.selectedDocumentIds.filter((documentId) => documentId !== id),
    })),
  clearDocuments: () => set({ selectedDocumentIds: [], activeConversationId: null }),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  toggleHyde: () => set((state) => ({ useHyde: !state.useHyde })),
  resetWorkspace: () =>
    set({ selectedDocumentIds: [], activeConversationId: null, useHyde: false }),
}))
