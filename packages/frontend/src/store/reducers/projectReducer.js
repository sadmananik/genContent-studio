import { apiRequest } from "../../lib/apiClient";
import { DEV_AUTH_BYPASS_ENABLED } from "../../lib/devAuth";
import {
  createLocalProject,
  deleteLocalProject,
  getLocalProjectById,
  inviteLocalProjectCollaborator,
  listLocalProjects,
  updateLocalProject
} from "../../lib/localProjectStore";

const initialProjectState = {
  projects: [],
  currentProject: null,
  loading: false,
  error: null
};

export function createProjectReducer(set) {
  return {
    projectState: initialProjectState,

    fetchProjects: async () => {
      setProjectRequest(set);

      try {
        const projects = DEV_AUTH_BYPASS_ENABLED
          ? listLocalProjects()
          : await apiRequest("/api/projects");

        set((state) => ({
          projectState: {
            ...state.projectState,
            projects,
            loading: false,
            error: null
          }
        }));
        return projects;
      } catch (error) {
        setProjectError(set, error);
        throw error;
      }
    },

    fetchProjectById: async (projectId) => {
      setProjectRequest(set);

      try {
        const project = DEV_AUTH_BYPASS_ENABLED
          ? getLocalProjectById(projectId)
          : await apiRequest(`/api/projects/${projectId}`);

        set((state) => ({
          projectState: {
            ...state.projectState,
            currentProject: project,
            loading: false,
            error: null
          }
        }));
        return project;
      } catch (error) {
        setProjectError(set, error);
        throw error;
      }
    },

    createProject: async (payload) => {
      setProjectRequest(set);

      try {
        const project = DEV_AUTH_BYPASS_ENABLED
          ? createLocalProject(payload)
          : await apiRequest("/api/projects", {
              method: "POST",
              body: JSON.stringify(payload)
            });

        set((state) => ({
          projectState: {
            ...state.projectState,
            projects: [project, ...state.projectState.projects],
            currentProject: project,
            loading: false,
            error: null
          }
        }));
        return project;
      } catch (error) {
        setProjectError(set, error);
        throw error;
      }
    },

    updateProject: async (projectId, updates) => {
      setProjectRequest(set);

      try {
        const project = DEV_AUTH_BYPASS_ENABLED
          ? updateLocalProject(projectId, updates)
          : await apiRequest(`/api/projects/${projectId}`, {
              method: "PUT",
              body: JSON.stringify(updates)
            });

        set((state) => ({
          projectState: {
            ...state.projectState,
            projects: state.projectState.projects.map((item) =>
              item._id === project._id || item.id === project.id ? project : item
            ),
            currentProject:
              state.projectState.currentProject?._id === project._id ||
              state.projectState.currentProject?.id === project.id
                ? project
                : state.projectState.currentProject,
            loading: false,
            error: null
          }
        }));
        return project;
      } catch (error) {
        setProjectError(set, error);
        throw error;
      }
    },

    inviteProjectCollaborator: async (projectId, email) => {
      setProjectRequest(set);

      try {
        const project = DEV_AUTH_BYPASS_ENABLED
          ? inviteLocalProjectCollaborator(projectId, email)
          : await apiRequest(`/api/projects/${projectId}/invite`, {
              method: "PATCH",
              body: JSON.stringify({ email })
            });

        set((state) => ({
          projectState: {
            ...state.projectState,
            projects: state.projectState.projects.map((item) =>
              item._id === project._id || item.id === project.id ? project : item
            ),
            currentProject:
              state.projectState.currentProject?._id === project._id ||
              state.projectState.currentProject?.id === project.id
                ? project
                : state.projectState.currentProject,
            loading: false,
            error: null
          }
        }));
        return project;
      } catch (error) {
        setProjectError(set, error);
        throw error;
      }
    },

    deleteProject: async (projectId) => {
      setProjectRequest(set);

      try {
        if (DEV_AUTH_BYPASS_ENABLED) {
          deleteLocalProject(projectId);
        } else {
          await apiRequest(`/api/projects/${projectId}`, {
            method: "DELETE"
          });
        }

        set((state) => ({
          projectState: {
            ...state.projectState,
            projects: state.projectState.projects.filter(
              (project) => project._id !== projectId && project.id !== projectId
            ),
            currentProject:
              state.projectState.currentProject?._id === projectId ||
              state.projectState.currentProject?.id === projectId
                ? null
                : state.projectState.currentProject,
            loading: false,
            error: null
          }
        }));
      } catch (error) {
        setProjectError(set, error);
        throw error;
      }
    },

    setCurrentProject: (project) => {
      set((state) => ({
        projectState: {
          ...state.projectState,
          currentProject: project
        }
      }));
    },

    clearProjectState: () => {
      set({ projectState: initialProjectState });
    }
  };
}

function setProjectRequest(set) {
  set((state) => ({
    projectState: {
      ...state.projectState,
      loading: true,
      error: null
    }
  }));
}

function setProjectError(set, error) {
  set((state) => ({
    projectState: {
      ...state.projectState,
      loading: false,
      error: error.message || "Project request failed"
    }
  }));
}
