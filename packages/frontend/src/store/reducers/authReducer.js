import { apiRequest } from "../../lib/apiClient";
import { clearAuthState, getAuthSession, saveAuthSession } from "../../lib/auth";

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

        if (session.token) {
          saveAuthSession(session);
          setAuthSuccess(set, session);
        } else {
          finishAuthRequest(set);
        }

        return session;
      } catch (error) {
        setAuthError(set, error);
        throw error;
      }
    },

    loginUser: async (payload) => {
      setAuthRequest(set);

      try {
        const { rememberMe = false, ...credentials } = payload;
        const session = await apiRequest("/api/auth/login", {
          method: "POST",
          body: JSON.stringify(credentials)
        });

        saveAuthSession(session, rememberMe);
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
          saveAuthSession(nextSession, session?.rememberMe);
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
        clearAuthState();
        get().clearUserState();
        setAuthSessionError(set, error);
        throw error;
      }
    },

    verifyEmail: async (token) => {
      setAuthRequest(set);

      try {
        const response = await apiRequest("/api/auth/verify-email", {
          method: "POST",
          body: JSON.stringify({ token })
        });

        finishAuthRequest(set);
        return response;
      } catch (error) {
        setAuthError(set, error);
        throw error;
      }
    },

    resendVerificationEmail: async (email) => {
      setAuthRequest(set);

      try {
        const response = await apiRequest("/api/auth/resend-verification", {
          method: "POST",
          body: JSON.stringify({ email })
        });

        finishAuthRequest(set);
        return response;
      } catch (error) {
        setAuthError(set, error);
        throw error;
      }
    },

    requestPasswordReset: async (email) => {
      setAuthRequest(set);

      try {
        const response = await apiRequest("/api/auth/forgot-password", {
          method: "POST",
          body: JSON.stringify({ email })
        });

        finishAuthRequest(set);
        return response;
      } catch (error) {
        setAuthError(set, error);
        throw error;
      }
    },

    resetPassword: async (payload) => {
      setAuthRequest(set);

      try {
        const response = await apiRequest("/api/auth/reset-password", {
          method: "POST",
          body: JSON.stringify(payload)
        });

        clearAuthState();
        set((state) => ({
          auth: {
            ...state.auth,
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            error: null
          }
        }));
        return response;
      } catch (error) {
        setAuthError(set, error);
        throw error;
      }
    },

    clearAuthError: () => {
      set((state) => ({ auth: { ...state.auth, error: null } }));
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

function finishAuthRequest(set) {
  set((state) => ({
    auth: {
      ...state.auth,
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

function setAuthSessionError(set, error) {
  set((state) => ({
    auth: {
      ...state.auth,
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: error.message || "Authentication request failed"
    }
  }));
}
