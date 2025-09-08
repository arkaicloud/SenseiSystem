// Load environment variables first
import "./env";

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Log da conexão (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  console.log('Conectando ao banco PostgreSQL:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@'));
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });