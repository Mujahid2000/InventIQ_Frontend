import { appApi } from "./base";
import type { ApiList, ApiObject, EntityMutationPayload, IdPayload } from "./types";

const categoriesApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<ApiList, void>({
      query: () => "/api/categories",
      providesTags: ["Categories"],
    }),
    createCategory: builder.mutation<ApiObject, ApiObject>({
      query: (body) => ({
        url: "/api/categories",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Categories", "Products", "Logs"],
    }),
    updateCategory: builder.mutation<ApiObject, EntityMutationPayload>({
      query: ({ id, body }) => ({
        url: `/api/categories/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Categories", "Products", "Logs"],
    }),
    deleteCategory: builder.mutation<ApiObject, IdPayload>({
      query: ({ id }) => ({
        url: `/api/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Categories", "Products", "Logs"],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
