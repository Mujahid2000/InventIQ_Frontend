import { appApi } from "./base";
import type { ApiList, ApiObject, EntityMutationPayload, IdPayload } from "./types";

const productsApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<ApiList, void>({
      query: () => "/api/products",
      providesTags: ["Products"],
    }),
    createProduct: builder.mutation<ApiObject, ApiObject>({
      query: (body) => ({
        url: "/api/products",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Products", "Dashboard", "Restock", "Logs"],
    }),
    updateProduct: builder.mutation<ApiObject, EntityMutationPayload>({
      query: ({ id, body }) => ({
        url: `/api/products/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Products", "Dashboard", "Restock", "Logs"],
    }),
    deleteProduct: builder.mutation<ApiObject, IdPayload>({
      query: ({ id }) => ({
        url: `/api/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Products", "Dashboard", "Restock", "Logs"],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi;
