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

export const appApi = createApi({
  reducerPath: "appApi",
  baseQuery: baseQueryWithAuthHandling,
  tagTypes: ["Auth", "Dashboard", "Orders", "Products", "Categories", "Restock", "Logs"],
  endpoints: () => ({}),
});
