import { appApi } from "./base";
import type { ApiList, ApiObject, IdPayload, RestockUpdatePayload } from "./types";

const restockApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getRestockQueue: builder.query<ApiList, void>({
      query: () => "/api/restock",
      providesTags: ["Restock"],
    }),
    updateRestockItem: builder.mutation<ApiObject, RestockUpdatePayload>({
      query: ({ id, amount }) => ({
        url: `/api/restock/${id}`,
        method: "PUT",
        body: { amount },
      }),
      invalidatesTags: ["Restock", "Products", "Dashboard", "Logs"],
    }),
    deleteRestockItem: builder.mutation<ApiObject, IdPayload>({
      query: ({ id }) => ({
        url: `/api/restock/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Restock", "Products", "Dashboard", "Logs"],
    }),
  }),
});

export const { useGetRestockQueueQuery, useUpdateRestockItemMutation, useDeleteRestockItemMutation } =
  restockApi;
