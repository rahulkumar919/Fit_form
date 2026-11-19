/**
 * NextAuth v5 (Auth.js beta) route handler.
 * This single file handles all /api/auth/* requests.
 */

import { handlers } from "@/lib/auth/auth";

export const { GET, POST } = handlers;
