import { appApi } from "./base";
import type { AuthResponse, LoginPayload, SignupPayload } from "./types";

const authApi = appApi.injectEndpoints({
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
  }),
});

export const { useLoginMutation, useSignupMutation } = authApi;
