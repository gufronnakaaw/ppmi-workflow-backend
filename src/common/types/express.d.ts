import 'express';

declare module 'express' {
  export interface Request {
    fullurl: string;
    credentials: {
      id: string;
      fullname: string;
      roles?: string[];
      is_admin: boolean;
    };
  }
}
