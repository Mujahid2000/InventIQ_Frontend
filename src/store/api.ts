import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { clearStoredAuth, readStoredAuth } from "@/lib/auth-storage";
import { logout } from "@/store/authSlice";
import type { RootState } from "@/store/store";
import type { AuthUser } from "@/types";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!baseUrl && process.env.NODE_ENV === "development") {
  console.warn("NEXT_PUBLIC_API_URL is not set");
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { getState }) => {
    headers.set("Content-Type", "application/json");

    const stateToken = (getState() as RootState).auth.token;
    const token = stateToken || readStoredAuth().token;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

const baseQueryWithAuthHandling: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    clearStoredAuth();
    api.dispatch(logout());

    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
  }

  return result;
};

type ApiObject = Record<string, unknown>;
type ApiList = ApiObject[];

type AuthResponse = {
  token: string;
  user: AuthUser;
};

type LoginPayload = {
  email: string;
  password: string;
};

type SignupPayload = {
  name: string;
  email: string;
  password: string;
};

type CreateOrderPayload = {
  customerName: string;
  items: Array<{
    product: string;
    quantity: number;
  }>;
};

type UpdateOrderStatusPayload = {
  id: string;
  status: string;
};

type IdPayload = {
  id: string;
};

type EntityMutationPayload = {
  id: string;
  body: ApiObject;
};

type RestockUpdatePayload = {
  id: string;
  amount: number;
};

type LogsQueryPayload = {
  limit: number;
  page: number;
};

export const appApi = createApi({
  reducerPath: "appApi",
  baseQuery: baseQueryWithAuthHandling,
  tagTypes: ["Auth", "Dashboard", "Orders", "Products", "Categories", "Restock", "Logs"],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginPayload>({
      query: (body) => ({
        url: "/api/auth/login",
        method: "POST",
        body,
      }),
    }),
    signup: builder.mutation<AuthResponse, SignupPayload>({
      query: (body) => ({
        url: "/api/auth/signup",
        method: "POST",
        body,
      }),
    }),
    getDashboardStats: builder.query<ApiObject, void>({
      query: () => "/api/dashboard/stats",
      providesTags: ["Dashboard"],
    }),
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
    getLogs: builder.query<ApiList, LogsQueryPayload>({
      query: ({ limit, page }) => `/api/logs?limit=${limit}&page=${page}`,
      providesTags: ["Logs"],
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useGetDashboardStatsQuery,
  useGetOrdersQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation,
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetRestockQueueQuery,
  useUpdateRestockItemMutation,
  useDeleteRestockItemMutation,
  useGetLogsQuery,
  useLazyGetLogsQuery,
} = appApi;
