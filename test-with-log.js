const fs = require('fs');
const path = require('path');

// Função para escrever logs em arquivo
function writeLog(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(path.join(__dirname, 'debug.log'), logMessage);
  console.log(message);
}

writeLog('=== INICIANDO TESTE COM LOG ===');
writeLog(`Node.js version: ${process.version}`);
writeLog(`Current directory: ${process.cwd()}`);

try {
  writeLog('Carregando dotenv...');
  require('dotenv').config();
  writeLog('Dotenv carregado com sucesso');
  
  writeLog(`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
  writeLog(`PORT: ${process.env.PORT || 'undefined'}`);
  writeLog(`DATABASE_URL: ${process.env.DATABASE_URL ? 'DEFINIDA' : 'INDEFINIDA'}`);
  
  writeLog('Carregando Express...');
  const express = require('express');
  writeLog('Express carregado com sucesso');
  
  const app = express();
  const port = process.env.PORT || 3000;
  
  writeLog(`Tentando iniciar servidor na porta ${port}...`);
  
  app.get('/', (req, res) => {
    writeLog('Requisição recebida na rota /');
    res.json({ 
      message: 'Servidor funcionando!', 
      timestamp: new Date().toISOString(),
      port: port
    });
  });
  
  const server = app.listen(port, '127.0.0.1', () => {
    writeLog(`✅ Servidor iniciado com sucesso em http://localhost:${port}`);
    
    // Manter vivo por 30 segundos
    setTimeout(() => {
      writeLog('Encerrando servidor após 30 segundos...');
      server.close(() => {
        writeLog('Servidor encerrado');
        process.exit(0);
      });
    }, 30000);
  });
  
  server.on('error', (err) => {
    writeLog(`❌ Erro no servidor: ${err.message}`);
    writeLog(`Código do erro: ${err.code}`);
    if (err.code === 'EADDRINUSE') {
      writeLog(`Porta ${port} já está em uso`);
    }
  });
  
} catch (error) {
  writeLog(`❌ Erro fatal: ${error.message}`);
  writeLog(`Stack trace: ${error.stack}`);
}

writeLog('=== FIM DO SCRIPT ===');