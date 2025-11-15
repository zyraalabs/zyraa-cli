import { z } from "zod";

const tokenSchema = z.string().min(10, "Token must be at least 10 characters");

export function validateToken(token: unknown) {
  return tokenSchema.parse(token);
}
