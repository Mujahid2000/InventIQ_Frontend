import { appApi } from "./base";
import type {
  ApiList,
  ApiObject,
  CreateOrderPayload,
  IdPayload,
  UpdateOrderStatusPayload,
} from "./types";

const ordersApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<ApiList, void>({
      query: () => "/api/orders",
      providesTags: ["Orders"],
    }),
    createOrder: builder.mutation<ApiObject, CreateOrderPayload>({
      query: (body) => ({
        url: "/api/orders",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Orders", "Dashboard", "Products", "Restock", "Logs"],
    }),
    updateOrderStatus: builder.mutation<ApiObject, UpdateOrderStatusPayload>({
      query: ({ id, status }) => ({
        url: `/api/orders/${id}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["Orders", "Dashboard", "Logs"],
    }),
    cancelOrder: builder.mutation<ApiObject, IdPayload>({
      query: ({ id }) => ({
        url: `/api/orders/${id}/cancel`,
        method: "PUT",
      }),
      invalidatesTags: ["Orders", "Dashboard", "Products", "Restock", "Logs"],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation,
} = ordersApi;
