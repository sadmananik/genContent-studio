import { apiRequest } from "../../lib/apiClient";

const initialTemplateState = {
  templates: [],
  favoriteTemplates: [],
  myTemplates: [],
  recentTemplates: [],
  selectedTemplate: null,
  tagSuggestions: [],
  loading: false,
  favoriteLoading: false,
  myLoading: false,
  error: null
};

export function createTemplateReducer(set) {
  return {
    templateState: initialTemplateState,

    fetchTemplates: async (filters = {}) => {
      setTemplateLoading(set, "loading", true);

      try {
        const query = new URLSearchParams();

        if (filters.search) query.set("search", filters.search);
        if (filters.type && filters.type !== "all") query.set("type", filters.type);
        if (filters.category && filters.category !== "all") {
          query.set("category", filters.category);
        }
        if (filters.sort && filters.sort !== "newest") query.set("sort", filters.sort);

        const templates = await apiRequest(`/api/templates${query.size ? `?${query}` : ""}`);
        set((state) => ({
          templateState: { ...state.templateState, templates, loading: false, error: null }
        }));
        return templates;
      } catch (error) {
        setTemplateError(set, error, "loading");
        throw error;
      }
    },

    fetchMyTemplates: async () => {
      setTemplateLoading(set, "myLoading", true);

      try {
        const myTemplates = await apiRequest("/api/templates/mine");
        set((state) => ({
          templateState: { ...state.templateState, myTemplates, myLoading: false, error: null }
        }));
        return myTemplates;
      } catch (error) {
        setTemplateError(set, error, "myLoading");
        throw error;
      }
    },

    fetchFavoriteTemplates: async () => {
      setTemplateLoading(set, "favoriteLoading", true);

      try {
        const favoriteTemplates = await apiRequest("/api/templates/favorites");
        set((state) => ({
          templateState: {
            ...state.templateState,
            favoriteTemplates,
            favoriteLoading: false,
            error: null
          }
        }));
        return favoriteTemplates;
      } catch (error) {
        setTemplateError(set, error, "favoriteLoading");
        throw error;
      }
    },

    fetchRecentTemplates: async () => {
      try {
        const recentTemplates = await apiRequest("/api/templates/recent");
        set((state) => ({
          templateState: { ...state.templateState, recentTemplates, error: null }
        }));
        return recentTemplates;
      } catch (error) {
        set((state) => ({
          templateState: {
            ...state.templateState,
            error: error.message || "Recent templates request failed"
          }
        }));
        throw error;
      }
    },

    fetchTemplateTagSuggestions: async (search = "") => {
      const query = new URLSearchParams();
      const normalizedSearch = search.trim();

      if (normalizedSearch) {
        query.set("search", normalizedSearch);
      }

      const tagSuggestions = await apiRequest(
        `/api/templates/tags${query.size ? `?${query}` : ""}`
      );
      set((state) => ({
        templateState: { ...state.templateState, tagSuggestions, error: null }
      }));
      return tagSuggestions;
    },

    publishTemplate: async (projectId, payload) => {
      const template = await apiRequest(`/api/templates/projects/${projectId}`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      set((state) => ({
        templateState: {
          ...state.templateState,
          myTemplates: [template, ...state.templateState.myTemplates],
          templates:
            template.visibility === "public"
              ? [template, ...state.templateState.templates]
              : state.templateState.templates,
          error: null
        }
      }));
      return template;
    },

    updateTemplate: async (templateId, payload) => {
      const template = await apiRequest(`/api/templates/${templateId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      set((state) => ({ templateState: replaceTemplateEverywhere(state.templateState, template) }));
      return template;
    },

    updateTemplateVisibility: async (templateId, visibility) => {
      const template = await apiRequest(`/api/templates/${templateId}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ visibility })
      });
      set((state) => ({ templateState: replaceTemplateEverywhere(state.templateState, template) }));
      return template;
    },

    deleteTemplate: async (templateId) => {
      await apiRequest(`/api/templates/${templateId}`, { method: "DELETE" });
      set((state) => ({
        templateState: {
          ...state.templateState,
          templates: removeTemplate(state.templateState.templates, templateId),
          myTemplates: removeTemplate(state.templateState.myTemplates, templateId),
          favoriteTemplates: removeTemplate(state.templateState.favoriteTemplates, templateId),
          recentTemplates: removeTemplate(state.templateState.recentTemplates, templateId),
          selectedTemplate:
            getTemplateId(state.templateState.selectedTemplate) === templateId
              ? null
              : state.templateState.selectedTemplate,
          error: null
        }
      }));
    },

    useTemplate: async (templateId, payload = {}) => {
      const result = await apiRequest(`/api/templates/${templateId}/use`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      set((state) => {
        const template = findTemplate(state.templateState, templateId);
        const updatedTemplate = template
          ? { ...template, useCount: result.template.useCount }
          : null;

        return {
          projectState: {
            ...state.projectState,
            projects: [result.project, ...state.projectState.projects],
            currentProject: result.project
          },
          templateState: {
            ...(updatedTemplate
              ? replaceTemplateEverywhere(state.templateState, updatedTemplate)
              : state.templateState),
            recentTemplates: updatedTemplate
              ? [
                  { ...updatedTemplate, lastUsedAt: new Date().toISOString() },
                  ...removeTemplate(state.templateState.recentTemplates, templateId)
                ].slice(0, 6)
              : state.templateState.recentTemplates,
            error: null
          }
        };
      });
      return result;
    },

    toggleTemplateFavorite: async (templateId, shouldFavorite) => {
      await apiRequest(`/api/templates/${templateId}/favorite`, {
        method: shouldFavorite ? "PUT" : "DELETE"
      });
      set((state) => {
        const template = findTemplate(state.templateState, templateId);

        if (!template) {
          return {};
        }

        const updatedTemplate = { ...template, isFavorite: shouldFavorite };
        const nextTemplateState = replaceTemplateEverywhere(state.templateState, updatedTemplate);

        return {
          templateState: {
            ...nextTemplateState,
            favoriteTemplates: shouldFavorite
              ? [
                  updatedTemplate,
                  ...removeTemplate(state.templateState.favoriteTemplates, templateId)
                ]
              : removeTemplate(state.templateState.favoriteTemplates, templateId)
          }
        };
      });
    },

    voteTemplate: async (templateId, voteType) => {
      const vote = await apiRequest(`/api/templates/${templateId}/vote`, {
        method: "POST",
        body: JSON.stringify({ voteType })
      });
      set((state) => {
        const template = findTemplate(state.templateState, templateId);
        if (!template) return {};

        return {
          templateState: replaceTemplateEverywhere(state.templateState, {
            ...template,
            ...vote
          })
        };
      });
      return vote;
    },

    setSelectedTemplate: (selectedTemplate) => {
      set((state) => ({
        templateState: { ...state.templateState, selectedTemplate }
      }));
    },

    clearTemplateState: () => set({ templateState: initialTemplateState })
  };
}

function replaceTemplateEverywhere(state, template) {
  const replace = (items, includePublicOnly = false) => {
    const withoutTemplate = removeTemplate(items, getTemplateId(template));

    if (includePublicOnly && template.visibility !== "public") {
      return withoutTemplate;
    }

    return items.some((item) => getTemplateId(item) === getTemplateId(template))
      ? items.map((item) => (getTemplateId(item) === getTemplateId(template) ? template : item))
      : includePublicOnly && template.visibility === "public"
        ? [template, ...withoutTemplate]
        : withoutTemplate;
  };

  return {
    ...state,
    templates: replace(state.templates, true),
    myTemplates: replace(state.myTemplates),
    favoriteTemplates: state.favoriteTemplates.map((item) =>
      getTemplateId(item) === getTemplateId(template) ? { ...template, isFavorite: true } : item
    ),
    recentTemplates: state.recentTemplates.map((item) =>
      getTemplateId(item) === getTemplateId(template) ? { ...item, ...template } : item
    ),
    selectedTemplate:
      getTemplateId(state.selectedTemplate) === getTemplateId(template)
        ? template
        : state.selectedTemplate,
    error: null
  };
}

function findTemplate(state, templateId) {
  return [
    ...state.templates,
    ...state.myTemplates,
    ...state.favoriteTemplates,
    ...state.recentTemplates
  ].find((item) => getTemplateId(item) === templateId);
}

function removeTemplate(items, templateId) {
  return items.filter((item) => getTemplateId(item) !== templateId);
}

function getTemplateId(template) {
  return template?.id || template?._id;
}

function setTemplateLoading(set, key, value) {
  set((state) => ({
    templateState: { ...state.templateState, [key]: value, error: null }
  }));
}

function setTemplateError(set, error, loadingKey) {
  set((state) => ({
    templateState: {
      ...state.templateState,
      [loadingKey]: false,
      error: error.message || "Template request failed"
    }
  }));
}
