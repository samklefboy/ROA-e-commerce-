import type { Request } from "express";

export type AuthUser = {
  id: string;
  phone: string;
  isVerified: boolean;
  hasStore: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthenticatedRequest = Request & {
  user: {
    id: string;
    phone: string;
    hasStore: boolean;
  };
};
