// Load environment variables first
import "./env";

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Configuração SSL para aceitar certificados com domínios diferentes
neonConfig.pipelineConnect = false;
neonConfig.useSecureWebSocket = true;

// Log da conexão (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  console.log('Conectando ao banco PostgreSQL:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@'));
}

// Configuração da pool com SSL flexível
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Aceita certificados self-signed ou com nomes diferentes
  }
};

export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });