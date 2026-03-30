import { appApi } from "./base";
import type { ApiList, LogsQueryPayload } from "./types";

const logsApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getLogs: builder.query<ApiList, LogsQueryPayload>({
      query: ({ limit, page }) => `/api/logs?limit=${limit}&page=${page}`,
      providesTags: ["Logs"],
    }),
  }),
});

export const { useGetLogsQuery, useLazyGetLogsQuery } = logsApi;
