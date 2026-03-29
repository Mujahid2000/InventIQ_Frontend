"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { readStoredAuth, setTokenCookie } from "@/lib/auth-storage";
import { hydrateAuth } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { store } from "@/store/store";

function AuthHydrator({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const { token, user } = readStoredAuth();

    if (token) {
      setTokenCookie(token);
    }

    dispatch(hydrateAuth({ token, user }));
  }, [dispatch]);

  return <>{children}</>;
}

export default function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthHydrator>{children}</AuthHydrator>
    </Provider>
  );
}
