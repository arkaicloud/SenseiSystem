import { config } from "dotenv";
import * as fs from "fs";

// Load environment variables before any other imports
config();

// If DATABASE_URL is still not loaded, try to manually parse .env file
if (!process.env.DATABASE_URL) {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('DATABASE_URL=')) {
        const value = trimmedLine.substring('DATABASE_URL='.length);
        process.env.DATABASE_URL = value;
        console.log('Manually loaded DATABASE_URL from .env file');
        break;
      }
    }
  } catch (error) {
    console.error('Error reading .env file:', error);
  }
}

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}