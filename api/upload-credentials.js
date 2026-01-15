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
        // Forçar atualização para garantir dados mais recentes
        await initializeData(true);
        const data = getData();

        // Verificar se o body foi parseado corretamente
        if (!req.body) {
            return res.status(400).json({ error: 'Request body is required' });
        }

        const { credentials } = req.body;

        if (!credentials || !Array.isArray(credentials)) {
            return res.status(400).json({ error: 'Invalid credentials format. Expected an array of credentials.' });
        }

        // Adicionar credenciais ao estoque (evitando duplicatas)
        let addedCount = 0;
        const availableCredentials = data.availableCredentials || [];
        
        credentials.forEach(credential => {
            const trimmedCredential = credential.trim();
            if (trimmedCredential && !availableCredentials.includes(trimmedCredential)) {
                availableCredentials.push(trimmedCredential);
                addedCount++;
            }
        });

        // Salvar dados atualizados
        await saveData({
            availableCredentials: availableCredentials,
            usedCredentials: data.usedCredentials || []
        });

        return res.status(200).json({
            success: true,
            message: `${addedCount} credenciais adicionadas com sucesso!`,
            addedCount: addedCount
        });
    } catch (error) {
        console.error('Error uploading credentials:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message || 'An unexpected error occurred'
        });
    }
};
