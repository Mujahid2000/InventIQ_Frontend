import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@/types";

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  initialized: boolean;
};

const initialState: AuthState = {
  token: null,
  user: null,
  initialized: false,
};

type AuthPayload = {
  token: string | null;
  user: AuthUser | null;
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateAuth(state, action: PayloadAction<AuthPayload>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.initialized = true;
    },
    loginSuccess(state, action: PayloadAction<{ token: string; user: AuthUser }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.initialized = true;
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.initialized = true;
    },
  },
});

export const { hydrateAuth, loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
