import { appApi } from "./base";
import type { ApiObject } from "./types";

const dashboardApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<ApiObject, void>({
      query: () => "/api/dashboard/stats",
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetDashboardStatsQuery } = dashboardApi;
