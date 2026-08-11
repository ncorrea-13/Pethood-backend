import type { PayloadToken } from '../shared/jwt';

declare global {
  namespace Express {
    interface Request {
      usuario?: PayloadToken;
    }
  }
}

export {};
