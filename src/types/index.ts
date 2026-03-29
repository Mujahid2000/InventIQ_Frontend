export type UserRole = "admin" | "manager";

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
}
