const initialCollaborationState = {
  activeCollaborators: [],
  socketConnected: false,
  imageLock: {
    locked: false,
    holder: null
  },
  loading: false,
  error: null
};

export function createCollaborationReducer(set) {
  return {
    collaborationState: initialCollaborationState,

    setActiveCollaborators: (activeCollaborators) => {
      set((state) => ({
        collaborationState: {
          ...state.collaborationState,
          activeCollaborators,
          error: null
        }
      }));
    },

    setSocketConnected: (socketConnected) => {
      set((state) => ({
        collaborationState: {
          ...state.collaborationState,
          socketConnected,
          error: null
        }
      }));
    },

    setImageLock: (holder) => {
      set((state) => ({
        collaborationState: {
          ...state.collaborationState,
          imageLock: {
            locked: Boolean(holder),
            holder
          },
          error: null
        }
      }));
    },

    clearImageLock: () => {
      set((state) => ({
        collaborationState: {
          ...state.collaborationState,
          imageLock: initialCollaborationState.imageLock
        }
      }));
    },

    setCollaborationError: (error) => {
      set((state) => ({
        collaborationState: {
          ...state.collaborationState,
          loading: false,
          error: error?.message || error || "Collaboration request failed"
        }
      }));
    },

    clearCollaborationState: () => {
      set({ collaborationState: initialCollaborationState });
    }
  };
}
