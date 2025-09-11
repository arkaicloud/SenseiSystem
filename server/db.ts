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

// Configuração da pool com SSL mas sem verificação de certificado
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Aceita certificados mesmo com IP/domínio inválido
    checkServerIdentity: () => undefined // Desabilita verificação de identidade
  }
};

export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });