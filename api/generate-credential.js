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
        console.log('Generate credential request received');
        console.log('Request body:', req.body);
        console.log('Request body type:', typeof req.body);
        console.log('Request body keys:', req.body ? Object.keys(req.body) : 'null');
        
        // Verificar configuração do JSONBin
        const hasJSONBin = !!(process.env.JSONBIN_BIN_ID && process.env.JSONBIN_API_KEY);
        console.log('Configuração JSONBin:', {
            hasJSONBin: hasJSONBin,
            hasBinId: !!process.env.JSONBIN_BIN_ID,
            hasApiKey: !!process.env.JSONBIN_API_KEY,
            binId: process.env.JSONBIN_BIN_ID ? process.env.JSONBIN_BIN_ID.substring(0, 10) + '...' : 'não configurado'
        });
        
        // Forçar atualização para garantir dados mais recentes
        console.log('Iniciando carregamento de dados...');
        await initializeData(true);
        const data = getData();
        
        console.log('Dados brutos obtidos:', {
            dataType: typeof data,
            dataKeys: Object.keys(data || {}),
            rawAvailable: data?.availableCredentials,
            rawAvailableType: typeof data?.availableCredentials,
            rawAvailableIsArray: Array.isArray(data?.availableCredentials)
        });
        
        // Garantir que temos arrays válidos
        const availableCredentials = Array.isArray(data.availableCredentials) 
            ? [...data.availableCredentials] 
            : [];
        const usedCredentials = Array.isArray(data.usedCredentials) 
            ? [...data.usedCredentials] 
            : [];
        
        console.log('Dados carregados para geração (após validação):', {
            availableCount: availableCredentials.length,
            usedCount: usedCredentials.length,
            hasJSONBin: hasJSONBin,
            dataType: typeof data,
            availableIsArray: Array.isArray(data.availableCredentials),
            firstFewCredentials: availableCredentials.slice(0, 3)
        });

        // Verificar se o body foi parseado corretamente
        if (!req.body || typeof req.body !== 'object') {
            console.error('Request body inválido:', req.body);
            return res.status(400).json({ error: 'Invalid request body' });
        }

        const { userName, branchNumber, userPassword } = req.body;

        if (!userName || !branchNumber || !userPassword) {
            console.error('Campos obrigatórios faltando:', { 
                userName: !!userName, 
                branchNumber: !!branchNumber, 
                userPassword: !!userPassword,
                bodyKeys: Object.keys(req.body || {})
            });
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validar senha do usuário
        const USER_PASSWORDS = {
            'Caio': '9011',
            'Isadora': '9012',
            'Vanessa': '9013',
            'Brasil': '9014',
            'Tiago': '9015',
            'Aurelio': '9016',
            'Joathan': '9017',
            'Maicon': '9018',
            'Daniel': '9019',
            'Wagner': '9020'
        };

        const correctPassword = USER_PASSWORDS[userName];
        if (!correctPassword || userPassword !== correctPassword) {
            console.error('Senha incorreta para usuário:', userName);
            return res.status(401).json({ error: 'Senha incorreta para este usuário' });
        }

        console.log('Credenciais disponíveis:', availableCredentials.length);
        
        if (availableCredentials.length === 0) {
            const hasJSONBin = !!(process.env.JSONBIN_BIN_ID && process.env.JSONBIN_API_KEY);
            console.error('Nenhuma credencial disponível. Dados completos:', {
                availableCredentials: availableCredentials,
                dataKeys: Object.keys(data),
                hasJSONBin: hasJSONBin,
                dataAvailableCount: availableCredentials.length,
                rawData: JSON.stringify(data).substring(0, 500)
            });
            
            let errorMessage = 'Não há credenciais disponíveis';
            if (!hasJSONBin) {
                errorMessage += '. ATENÇÃO: JSONBin não está configurado. Os dados são perdidos entre requisições. Configure JSONBin.io para persistência.';
            }
            
            return res.status(400).json({ 
                error: errorMessage,
                requiresJSONBin: !hasJSONBin
            });
        }

        // Pegar a primeira credencial disponível (remover do array)
        const credential = availableCredentials.shift();
        
        if (!credential || typeof credential !== 'string') {
            console.error('Credencial inválida obtida:', credential);
            return res.status(500).json({ 
                error: 'Erro ao processar credencial',
                message: 'A credencial obtida é inválida'
            });
        }
        
        // Registrar uso
        const usedCredential = {
            credential: credential,
            userName: userName,
            branchNumber: branchNumber,
            timestamp: new Date().toLocaleString('pt-BR')
        };

        usedCredentials.push(usedCredential);

        // Salvar dados atualizados
        console.log('Salvando dados atualizados:', {
            availableCount: availableCredentials.length,
            usedCount: usedCredentials.length
        });
        
        const dataToSave = {
            availableCredentials: availableCredentials,
            usedCredentials: usedCredentials
        };
        
        await saveData(dataToSave);
        
        // Verificar se os dados foram salvos corretamente
        const savedData = getData();
        console.log('Dados após salvar (verificação):', {
            availableCount: (savedData.availableCredentials || []).length,
            usedCount: (savedData.usedCredentials || []).length
        });
        
        console.log('Dados salvos com sucesso. Credencial gerada:', credential);

        return res.status(200).json({
            success: true,
            credential: credential,
            userName: userName,
            branchNumber: branchNumber,
            timestamp: usedCredential.timestamp,
            // Incluir dados atualizados na resposta
            data: {
                availableCredentials: availableCredentials,
                usedCredentials: usedCredentials
            }
        });
    } catch (error) {
        console.error('Error generating credential:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message || 'An unexpected error occurred',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
