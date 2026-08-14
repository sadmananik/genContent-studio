import { apiRequest } from "../../lib/apiClient";
import { clearAuthState, getAuthSession, saveAuthSession, setDemoLogin } from "../../lib/auth";

const initialSession = getAuthSession();

const initialAuthState = {
  user: initialSession?.user || null,
  token: initialSession?.token || null,
  isAuthenticated: Boolean(initialSession?.token),
  loading: false,
  error: null
};

export function createAuthReducer(set, get) {
  return {
    auth: initialAuthState,

    registerUser: async (payload) => {
      setAuthRequest(set);

      try {
        const session = await apiRequest("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(payload)
        });

        saveAuthSession(session);
        setAuthSuccess(set, session);
        return session;
      } catch (error) {
        setAuthError(set, error);
        throw error;
      }
    },

    loginUser: async (payload) => {
      setAuthRequest(set);

      try {
        const session = await apiRequest("/api/auth/login", {
          method: "POST",
          body: JSON.stringify(payload)
        });

        saveAuthSession(session);
        setAuthSuccess(set, session);
        return session;
      } catch (error) {
        setAuthError(set, error);
        throw error;
      }
    },

    logoutUser: () => {
      clearAuthState();
      get().clearUserState();
      get().clearProjectState();
      get().clearAiState();
      get().clearCollaborationState();
      set({ auth: { ...initialAuthState, user: null, token: null, isAuthenticated: false } });
    },

    getAuthenticatedUser: async () => {
      setAuthRequest(set);

      try {
        const user = await apiRequest("/api/users/me");
        const session = getAuthSession();
        const nextSession = { token: session?.token, user };

        if (nextSession.token) {
          saveAuthSession(nextSession);
        }

        set((state) => ({
          auth: {
            ...state.auth,
            user,
            token: nextSession.token || state.auth.token,
            isAuthenticated: Boolean(nextSession.token || state.auth.token),
            loading: false,
            error: null
          }
        }));

        get().setCurrentUser(user);
        return user;
      } catch (error) {
        setAuthError(set, error);
        throw error;
      }
    },

    setDemoAuthenticated: (user = { name: "Sadman Anik" }) => {
      setDemoLogin();
      set((state) => ({
        auth: {
          ...state.auth,
          user,
          token: null,
          isAuthenticated: true,
          loading: false,
          error: null
        }
      }));
    }
  };
}

function setAuthRequest(set) {
  set((state) => ({
    auth: {
      ...state.auth,
      loading: true,
      error: null
    }
  }));
}

function setAuthSuccess(set, session) {
  set((state) => ({
    auth: {
      ...state.auth,
      user: session.user,
      token: session.token,
      isAuthenticated: Boolean(session.token),
      loading: false,
      error: null
    }
  }));
}

function setAuthError(set, error) {
  set((state) => ({
    auth: {
      ...state.auth,
      loading: false,
      error: error.message || "Authentication request failed"
    }
  }));
}
