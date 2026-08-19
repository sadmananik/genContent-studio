import { apiRequest } from "../../lib/apiClient";

const initialUserState = {
  currentUser: null,
  profile: null,
  users: [],
  loading: false,
  error: null
};

export function createUserReducer(set) {
  return {
    userState: initialUserState,

    setCurrentUser: (user) => {
      set((state) => ({
        userState: {
          ...state.userState,
          currentUser: user,
          profile: user
        }
      }));
    },

    getUserProfile: async () => {
      setUserRequest(set);

      try {
        const user = await apiRequest("/api/users/me");
        set((state) => ({
          userState: {
            ...state.userState,
            currentUser: user,
            profile: user,
            loading: false,
            error: null
          },
          auth: {
            ...state.auth,
            user
          }
        }));
        return user;
      } catch (error) {
        setUserError(set, error);
        throw error;
      }
    },

    updateUserProfile: async (updates) => {
      setUserRequest(set);

      try {
        const user = await apiRequest("/api/users/me", {
          method: "PUT",
          body: JSON.stringify(updates)
        });
        set((state) => ({
          userState: {
            ...state.userState,
            currentUser: user,
            profile: user,
            loading: false,
            error: null
          }
        }));
        return user;
      } catch (error) {
        setUserError(set, error);
        throw error;
      }
    },

    listUsers: async () => {
      setUserRequest(set);

      try {
        const users = await apiRequest("/api/users");
        set((state) => ({
          userState: {
            ...state.userState,
            users,
            loading: false,
            error: null
          }
        }));
        return users;
      } catch (error) {
        setUserError(set, error);
        throw error;
      }
    },

    clearUserState: () => {
      set({ userState: initialUserState });
    }
  };
}

function setUserRequest(set) {
  set((state) => ({
    userState: {
      ...state.userState,
      loading: true,
      error: null
    }
  }));
}

function setUserError(set, error) {
  set((state) => ({
    userState: {
      ...state.userState,
      loading: false,
      error: error.message || "User request failed"
    }
  }));
}
