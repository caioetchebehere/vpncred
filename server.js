const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const XLSX = require('xlsx');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para OPTIONS (preflight)
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// express.static deve vir depois das rotas da API para não interceptar

// Configuração do multer para upload de arquivos
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

// Função para ler dados do arquivo JSON
async function readData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Se o arquivo não existir, retorna estrutura padrão
        return {
            credentials: [],
            usedCredentials: [],
            generatedHistory: []
        };
    }
}

// Função para salvar dados no arquivo JSON
async function saveData(data) {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Rota para obter credenciais
app.get('/api/credentials', async (req, res) => {
    try {
        const data = await readData();
        res.json(data.credentials);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para obter credenciais usadas
app.get('/api/used-credentials', async (req, res) => {
    try {
        const data = await readData();
        res.json(data.usedCredentials);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para obter histórico
app.get('/api/history', async (req, res) => {
    try {
        const data = await readData();
        res.json(data.generatedHistory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para fazer upload de credenciais
app.post('/api/upload-credentials', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            console.error('Erro no multer:', err);
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ error: 'Arquivo muito grande. Tamanho máximo: 10MB' });
                }
                return res.status(400).json({ error: `Erro no upload: ${err.message}` });
            }
            return res.status(400).json({ error: `Erro ao processar arquivo: ${err.message}` });
        }
        next();
    });
}, async (req, res) => {
    try {
        console.log('=== UPLOAD INICIADO ===');
        console.log('Method:', req.method);
        console.log('URL:', req.url);
        console.log('Has File:', !!req.file);
        console.log('File Name:', req.file?.originalname);
        console.log('Content-Type:', req.headers['content-type']);
        console.log('======================');

        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        const fileName = req.file.originalname.toLowerCase();
        const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
        
        let credentials = [];

        if (isExcel) {
            // Processa arquivo Excel
            try {
                const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                jsonData.forEach((row, index) => {
                    if (row && row.length >= 2) {
                        const username = String(row[0]).trim();
                        const password = String(row[1]).trim();
                        
                        if (username && password) {
                            credentials.push({
                                id: Date.now() + index,
                                username: username,
                                password: password,
                                inUse: false
                            });
                        }
                    }
                });
            } catch (excelError) {
                return res.status(400).json({ error: `Erro ao processar arquivo Excel: ${excelError.message}` });
            }
        } else {
            // Processa arquivo de texto
            try {
                const text = req.file.buffer.toString('utf8');
                if (!text || text.trim().length === 0) {
                    return res.status(400).json({ error: 'Arquivo de texto está vazio' });
                }
                
                const cleanText = text.replace(/^\uFEFF/, '');
                const lines = cleanText.split(/\r?\n/).filter(line => line.trim());

                if (lines.length === 0) {
                    return res.status(400).json({ error: 'Nenhuma linha válida encontrada no arquivo' });
                }

                lines.forEach((line, index) => {
                    let parts = [];
                    
                    if (line.includes(',')) {
                        parts = line.split(',').map(p => p.trim());
                    } else if (line.includes(';')) {
                        parts = line.split(';').map(p => p.trim());
                    } else if (line.includes('\t')) {
                        parts = line.split('\t').map(p => p.trim());
                    } else {
                        parts = line.split(/\s+/).filter(p => p.trim());
                    }
                    
                    if (parts.length >= 2) {
                        const username = parts[0].trim();
                        const password = parts[1].trim();
                        
                        if (username && password) {
                            credentials.push({
                                id: Date.now() + index,
                                username: username,
                                password: password,
                                inUse: false
                            });
                        }
                    }
                });
            } catch (textError) {
                return res.status(400).json({ error: `Erro ao processar arquivo de texto: ${textError.message}` });
            }
        }

        if (credentials.length === 0) {
            return res.status(400).json({ error: 'Nenhuma credencial válida encontrada no arquivo. Formato esperado: usuário,senha (por linha)' });
        }

        // Salva as credenciais e zera o histórico
        try {
            const data = await readData();
            data.credentials = credentials;
            data.usedCredentials = [];
            data.generatedHistory = [];
            await saveData(data);

            return res.json({ 
                success: true, 
                count: credentials.length,
                message: `${credentials.length} credenciais importadas com sucesso`
            });
        } catch (saveError) {
            return res.status(500).json({ error: `Erro ao salvar credenciais: ${saveError.message}` });
        }
    } catch (error) {
        console.error('Erro no upload:', error);
        return res.status(500).json({ error: error.message || 'Erro desconhecido ao processar arquivo' });
    }
});

// Rota para gerar uma nova credencial
app.post('/api/generate-credential', async (req, res) => {
    try {
        const { userName, branchNumber, userPassword } = req.body;

        // Validações básicas
        if (!userName || !branchNumber || !userPassword) {
            return res.status(400).json({ error: 'Dados incompletos' });
        }

        const data = await readData();
        const { credentials, usedCredentials } = data;

        if (credentials.length === 0) {
            return res.status(400).json({ error: 'Nenhuma credencial disponível' });
        }

        // Encontra a primeira credencial não utilizada
        let availableCredential = null;
        for (let cred of credentials) {
            if (!usedCredentials.includes(cred.id)) {
                availableCredential = cred;
                break;
            }
        }

        if (!availableCredential) {
            return res.status(400).json({ error: 'Todas as credenciais já foram utilizadas' });
        }

        // Marca como utilizada
        usedCredentials.push(availableCredential.id);

        // Registra no histórico
        const record = {
            id: Date.now(),
            vpnUser: availableCredential.username,
            vpnPassword: availableCredential.password,
            generatedBy: userName,
            branch: branchNumber,
            dateTime: new Date().toLocaleString('pt-BR'),
            timestamp: new Date().toISOString()
        };

        data.generatedHistory.push(record);
        await saveData(data);

        res.json({
            success: true,
            credential: {
                vpnUser: availableCredential.username,
                vpnPassword: availableCredential.password,
                generatedBy: userName,
                branch: branchNumber,
                dateTime: record.dateTime
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para obter estatísticas
app.get('/api/stats', async (req, res) => {
    try {
        const data = await readData();
        res.json({
            totalCredentials: data.credentials.length,
            usedCredentials: data.usedCredentials.length,
            availableCredentials: data.credentials.length - data.usedCredentials.length,
            totalGenerated: data.generatedHistory.length,
            lastGeneration: data.generatedHistory.length > 0 
                ? data.generatedHistory[data.generatedHistory.length - 1].dateTime 
                : null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Servir arquivos estáticos (deve vir depois das rotas da API)
// Apenas para arquivos que não começam com /api
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    express.static('.')(req, res, next);
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({ 
        error: err.message || 'Erro interno do servidor',
        success: false
    });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Rota não encontrada',
        success: false
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
