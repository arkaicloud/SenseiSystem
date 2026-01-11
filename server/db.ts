// Load environment variables first
import "./env";

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Build connection string from individual PG variables if DATABASE_URL is not available
function getConnectionConfig() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }
  
  // Try to build from individual PG variables
  const host = process.env.PGHOST;
  const port = process.env.PGPORT;
  const user = process.env.PGUSER;
  const password = process.env.PGPASSWORD;
  const database = process.env.PGDATABASE;
  
  if (host && user && password && database) {
    return {
      host,
      port: port ? parseInt(port) : 5432,
      user,
      password,
      database,
    };
  }
  
  return null;
}

const connectionConfig = getConnectionConfig();

// Log da conexão (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  if (connectionConfig) {
    const logUrl = process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@') || 
      `postgres://${process.env.PGUSER}:****@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
    console.log('Conectando ao banco PostgreSQL:', logUrl);
  } else {
    console.log('⚠️ Nenhuma configuração de banco de dados disponível');
  }
}

// Configuração da pool - usando driver pg padrão para Replit PostgreSQL
export const pool = connectionConfig 
  ? new Pool(connectionConfig)
  : null;

export const db = pool ? drizzle(pool, { schema }) : null;