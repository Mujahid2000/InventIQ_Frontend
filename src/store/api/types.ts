import type { AuthUser } from "@/types";

export type ApiObject = Record<string, unknown>;
export type ApiList = ApiObject[];

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type SignupPayload = {
  name: string;
  email: string;
  password: string;
};

export type CreateOrderPayload = {
  customerName: string;
  items: Array<{
    product: string;
    quantity: number;
  }>;
};

export type UpdateOrderStatusPayload = {
  id: string;
  status: string;
};

export type IdPayload = {
  id: string;
};

export type EntityMutationPayload = {
  id: string;
  body: ApiObject;
};

export type RestockUpdatePayload = {
  id: string;
  amount: number;
};

export type LogsQueryPayload = {
  limit: number;
  page: number;
};
