// Load environment variables first
import "./env";

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Log da conexão (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  console.log('Conectando ao banco PostgreSQL:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@'));
}

// Configuração da pool - usando driver pg padrão para Replit PostgreSQL
export const pool = process.env.DATABASE_URL 
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

export const db = pool ? drizzle(pool, { schema }) : null;