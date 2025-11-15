export interface TokenPayload {
  userId: string;
  email: string;
  apiEndpoint: string;
  permissions: string[];
  exp: number;
}
