import { apiRequest } from "../../lib/apiClient";

const initialAiState = {
  textResponse: null,
  imageResponse: null,
  chatHistory: [],
  favouriteResponses: [],
  loading: false,
  error: null
};

export function createAiReducer(set) {
  async function runAiRequest(request, applySuccess) {
    setAiRequest(set);

    try {
      const response = await request();

      set((state) => ({
        aiState: {
          ...state.aiState,
          ...applySuccess(state.aiState, response),
          loading: false,
          error: null
        }
      }));
      return response;
    } catch (error) {
      setAiError(set, error);
      throw error;
    }
  }

  return {
    aiState: initialAiState,

    generateTextFromPrompt: async (payload) => {
      return runAiRequest(
        () =>
          apiRequest("/api/ai/generate-text", {
            method: "POST",
            body: JSON.stringify(payload)
          }),
        (aiState, response) => ({ textResponse: response })
      );
    },

    sendTextGenerationRequest: async (payload) => {
      return runAiRequest(
        () =>
          apiRequest("/api/text-content", {
            method: "PUT",
            body: JSON.stringify(payload)
          }),
        (aiState, response) => ({ textResponse: response })
      );
    },

    sendImageGenerationRequest: async (payload) => {
      return runAiRequest(
        () =>
          apiRequest("/api/image-content", {
            method: "PUT",
            body: JSON.stringify(payload)
          }),
        (aiState, response) => ({ imageResponse: response })
      );
    },

    fetchProjectChatHistory: async (projectId) => {
      return runAiRequest(
        () => apiRequest(`/api/projects/${projectId}/chats`),
        (aiState, chatHistory) => ({ chatHistory })
      );
    },

    fetchFavouriteResponses: async () => {
      return runAiRequest(
        () => apiRequest("/api/chats/favourites"),
        (aiState, favouriteResponses) => ({ favouriteResponses })
      );
    },

    saveAiResponse: async (payload) => {
      return runAiRequest(
        () =>
          apiRequest("/api/chats", {
            method: "POST",
            body: JSON.stringify(payload)
          }),
        (aiState, chat) => ({ chatHistory: [chat, ...aiState.chatHistory] })
      );
    },

    toggleAiResponseFavourite: async (chatId, isFavourite) => {
      return runAiRequest(
        () =>
          apiRequest(`/api/chats/${chatId}/favourite`, {
            method: "PATCH",
            body: JSON.stringify({ isFavourite })
          }),
        (aiState, chat) => ({
          chatHistory: aiState.chatHistory.map((item) =>
            item._id === chat._id || item.id === chat.id ? chat : item
          ),
          favouriteResponses: chat.isFavourite
            ? aiState.favouriteResponses.map((item) =>
                item._id === chat._id || item.id === chat.id ? chat : item
              )
            : aiState.favouriteResponses.filter(
                (item) => item._id !== chat._id && item.id !== chat.id
              )
        })
      );
    },

    updateAiResponse: async (chatId, updates) => {
      return runAiRequest(
        () =>
          apiRequest(`/api/chats/${chatId}`, {
            method: "PATCH",
            body: JSON.stringify(updates)
          }),
        (aiState, chat) => ({
          chatHistory: aiState.chatHistory.map((item) =>
            item._id === chat._id || item.id === chat.id ? chat : item
          )
        })
      );
    },

    deleteAiResponse: async (chatId) => {
      return runAiRequest(
        () =>
          apiRequest(`/api/chats/${chatId}`, {
            method: "DELETE"
          }),
        (aiState) => ({
          chatHistory: aiState.chatHistory.filter(
            (item) => item._id !== chatId && item.id !== chatId
          )
        })
      );
    },

    clearAiError: () => {
      set((state) => ({
        aiState: {
          ...state.aiState,
          error: null
        }
      }));
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
