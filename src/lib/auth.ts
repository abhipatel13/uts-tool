import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    accessToken?: string;
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      accessToken?: string;
      role?: string;
    } & DefaultSession["user"]
  }
}