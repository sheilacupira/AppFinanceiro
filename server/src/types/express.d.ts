declare namespace Express {
  interface Request {
    auth?: {
      userId: string;
      tenantId: string;
      role: 'OWNER' | 'ADMIN' | 'MEMBER';
    };
  }
}
