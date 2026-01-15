const { getData, initializeData, saveData } = require('./data.js');

module.exports = async (req, res) => {
    // Sempre definir headers JSON primeiro
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Log para debug
        console.log('Upload request received');
        console.log('Request method:', req.method);
        console.log('Content-Type:', req.headers['content-type']);
        console.log('Body type:', typeof req.body);
        console.log('Body keys:', req.body ? Object.keys(req.body) : 'null');
        
        // Forçar atualização para garantir dados mais recentes
        await initializeData(true);
        const data = getData();

        // Verificar se o body foi parseado corretamente
        if (!req.body) {
            console.error('Request body is missing');
            return res.status(400).json({ error: 'Request body is required' });
        }

        const { credentials } = req.body;
        
        // Log do que foi recebido
        if (credentials) {
            console.log(`Credentials received: ${Array.isArray(credentials) ? credentials.length : 'not an array'}`);
            if (Array.isArray(credentials) && credentials.length > 0) {
                console.log('First credential sample:', credentials[0]);
                console.log('Last credential sample:', credentials[credentials.length - 1]);
            }
        }

        if (!credentials) {
            console.error('Credentials field is missing in request body');
            return res.status(400).json({ error: 'Credentials field is required' });
        }

        if (!Array.isArray(credentials)) {
            console.error('Credentials is not an array:', typeof credentials);
            return res.status(400).json({ error: 'Invalid credentials format. Expected an array of credentials.' });
        }

        if (credentials.length === 0) {
            console.error('Credentials array is empty');
            return res.status(400).json({ error: 'Credentials array is empty. Please provide at least one credential.' });
        }

        console.log(`Recebendo ${credentials.length} credenciais para processar`);

        // Adicionar credenciais ao estoque (evitando duplicatas)
        let addedCount = 0;
        let duplicateCount = 0;
        const availableCredentials = [...(data.availableCredentials || [])]; // Criar cópia do array
        
        credentials.forEach((credential, index) => {
            if (!credential || typeof credential !== 'string') {
                console.warn(`Credencial inválida no índice ${index}:`, credential);
                return;
            }
            
            const trimmedCredential = credential.trim();
            
            if (trimmedCredential.length === 0) {
                return; // Ignorar strings vazias após trim
            }
            
            if (!availableCredentials.includes(trimmedCredential)) {
                availableCredentials.push(trimmedCredential);
                addedCount++;
            } else {
                duplicateCount++;
            }
        });

        console.log(`Processadas: ${addedCount} adicionadas, ${duplicateCount} duplicadas, ${availableCredentials.length} total`);

        // Preparar dados para salvar
        const dataToSave = {
            availableCredentials: availableCredentials,
            usedCredentials: data.usedCredentials || []
        };
        
        console.log('Dados preparados para salvar:', {
            availableCount: dataToSave.availableCredentials.length,
            usedCount: dataToSave.usedCredentials.length
        });

        // Salvar dados atualizados
        await saveData(dataToSave);
        
        // Verificar se os dados foram salvos corretamente
        const savedData = getData();
        console.log('Dados após salvar (verificação):', {
            availableCount: (savedData.availableCredentials || []).length,
            usedCount: (savedData.usedCredentials || []).length
        });

        return res.status(200).json({
            success: true,
            message: `${addedCount} credenciais adicionadas com sucesso!${duplicateCount > 0 ? ` (${duplicateCount} duplicadas ignoradas)` : ''}`,
            addedCount: addedCount,
            duplicateCount: duplicateCount,
            totalReceived: credentials.length,
            totalAvailable: availableCredentials.length
        });
    } catch (error) {
        console.error('Error uploading credentials:', error);
        console.error('Error stack:', error.stack);
        console.error('Request body type:', typeof req.body);
        console.error('Request body keys:', req.body ? Object.keys(req.body) : 'null');
        
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message || 'An unexpected error occurred',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
