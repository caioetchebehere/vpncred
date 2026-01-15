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

        const { userName, branchNumber, userPassword } = req.body;

        if (!userName || !branchNumber || !userPassword) {
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
            return res.status(401).json({ error: 'Senha incorreta para este usuário' });
        }

        const availableCredentials = data.availableCredentials || [];
        if (availableCredentials.length === 0) {
            return res.status(400).json({ error: 'Não há credenciais disponíveis' });
        }

        // Pegar a primeira credencial disponível
        const credential = availableCredentials.shift();
        
        // Registrar uso
        const usedCredential = {
            credential: credential,
            userName: userName,
            branchNumber: branchNumber,
            timestamp: new Date().toLocaleString('pt-BR')
        };

        const usedCredentials = data.usedCredentials || [];
        usedCredentials.push(usedCredential);

        // Salvar dados atualizados
        await saveData({
            availableCredentials: availableCredentials,
            usedCredentials: usedCredentials
        });

        return res.status(200).json({
            success: true,
            credential: credential,
            userName: userName,
            branchNumber: branchNumber,
            timestamp: usedCredential.timestamp
        });
    } catch (error) {
        console.error('Error generating credential:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message || 'An unexpected error occurred'
        });
    }
};
