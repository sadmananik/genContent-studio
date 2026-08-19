import { apiRequest } from "../../lib/apiClient";

const initialAiState = {
  textResponse: null,
  imageResponse: null,
  chatHistory: [],
  loading: false,
  error: null
};

export function createAiReducer(set) {
  return {
    aiState: initialAiState,

    sendTextGenerationRequest: async (payload) => {
      setAiRequest(set);

      try {
        const response = await apiRequest("/api/text-content", {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        set((state) => ({
          aiState: {
            ...state.aiState,
            textResponse: response,
            loading: false,
            error: null
          }
        }));
        return response;
      } catch (error) {
        setAiError(set, error);
        throw error;
      }
    },

    sendImageGenerationRequest: async (payload) => {
      setAiRequest(set);

      try {
        const response = await apiRequest("/api/image-content", {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        set((state) => ({
          aiState: {
            ...state.aiState,
            imageResponse: response,
            loading: false,
            error: null
          }
        }));
        return response;
      } catch (error) {
        setAiError(set, error);
        throw error;
      }
    },

    fetchProjectChatHistory: async (projectId) => {
      setAiRequest(set);

      try {
        const chatHistory = await apiRequest(`/api/projects/${projectId}/chats`);
        set((state) => ({
          aiState: {
            ...state.aiState,
            chatHistory,
            loading: false,
            error: null
          }
        }));
        return chatHistory;
      } catch (error) {
        setAiError(set, error);
        throw error;
      }
    },

    saveAiResponse: async (payload) => {
      setAiRequest(set);

      try {
        const chat = await apiRequest("/api/chats", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        set((state) => ({
          aiState: {
            ...state.aiState,
            chatHistory: [chat, ...state.aiState.chatHistory],
            loading: false,
            error: null
          }
        }));
        return chat;
      } catch (error) {
        setAiError(set, error);
        throw error;
      }
    },

    toggleAiResponseFavourite: async (chatId, isFavourite) => {
      setAiRequest(set);

      try {
        const chat = await apiRequest(`/api/chats/${chatId}/favourite`, {
          method: "PATCH",
          body: JSON.stringify({ isFavourite })
        });
        set((state) => ({
          aiState: {
            ...state.aiState,
            chatHistory: state.aiState.chatHistory.map((item) =>
              item._id === chat._id || item.id === chat.id ? chat : item
            ),
            loading: false,
            error: null
          }
        }));
        return chat;
      } catch (error) {
        setAiError(set, error);
        throw error;
      }
    },

    updateAiResponse: async (chatId, updates) => {
      setAiRequest(set);

      try {
        const chat = await apiRequest(`/api/chats/${chatId}`, {
          method: "PATCH",
          body: JSON.stringify(updates)
        });
        set((state) => ({
          aiState: {
            ...state.aiState,
            chatHistory: state.aiState.chatHistory.map((item) =>
              item._id === chat._id || item.id === chat.id ? chat : item
            ),
            loading: false,
            error: null
          }
        }));
        return chat;
      } catch (error) {
        setAiError(set, error);
        throw error;
      }
    },

    deleteAiResponse: async (chatId) => {
      setAiRequest(set);

      try {
        await apiRequest(`/api/chats/${chatId}`, {
          method: "DELETE"
        });
        set((state) => ({
          aiState: {
            ...state.aiState,
            chatHistory: state.aiState.chatHistory.filter(
              (item) => item._id !== chatId && item.id !== chatId
            ),
            loading: false,
            error: null
          }
        }));
      } catch (error) {
        setAiError(set, error);
        throw error;
      }
    },

    clearAiState: () => {
      set({ aiState: initialAiState });
    }
  };
}

function setAiRequest(set) {
  set((state) => ({
    aiState: {
      ...state.aiState,
      loading: true,
      error: null
    }
  }));
}

function setAiError(set, error) {
  set((state) => ({
    aiState: {
      ...state.aiState,
      loading: false,
      error: error.message || "AI request failed"
    }
  }));
}
