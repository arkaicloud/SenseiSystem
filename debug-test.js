const fs = require('fs');

console.log('Iniciando teste de debug...');
fs.writeFileSync('debug.log', 'Teste de escrita de arquivo funcionou!\n');

const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Servidor funcionando!');
});

const port = 3001;
app.listen(port, () => {
    const message = `Servidor rodando na porta ${port}`;
    console.log(message);
    fs.appendFileSync('debug.log', message + '\n');
});

setTimeout(() => {
    fs.appendFileSync('debug.log', 'Teste finalizado após 5 segundos\n');
    process.exit(0);
}, 5000);