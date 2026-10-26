declare global {
  namespace Express {
    interface Request {
      authUser: {
        id: string;
        phone: string;
      };
    }
  }
}

export {};
