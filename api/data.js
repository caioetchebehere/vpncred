// Armazenamento de dados usando um serviço de armazenamento JSON online
// Suporta JSONBin.io ou pode ser configurado para usar outro serviço

// Node.js 18+ tem fetch nativo no Vercel
const JSONBIN_API_URL = process.env.JSONBIN_API_URL || 'https://api.jsonbin.io/v3/b';
const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY || '';
const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID || '';

// Armazenamento em memória compartilhado (persiste durante a execução da função)
// Nota: Em Serverless Functions, isso é compartilhado entre requisições na mesma instância
let globalStore = null;

// Cache com timestamp para reduzir chamadas à API
let cache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 1000; // 1 segundo (reduzido para atualizações mais rápidas)

// Função para carregar dados do JSONBin
async function loadFromJSONBin() {
    if (!JSONBIN_BIN_ID || !JSONBIN_API_KEY) {
        // Se não há configuração, usar armazenamento em memória global
        return globalStore || {
            availableCredentials: [],
            usedCredentials: []
        };
    }

    try {
        const response = await fetch(`${JSONBIN_API_URL}/${JSONBIN_BIN_ID}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const result = data.record || {
                availableCredentials: [],
                usedCredentials: []
            };
            // Atualizar store global
            globalStore = result;
            return result;
        } else if (response.status === 404) {
            // Bin não existe, criar estrutura vazia
            const empty = {
                availableCredentials: [],
                usedCredentials: []
            };
            globalStore = empty;
            return empty;
        } else {
            console.error('Error loading from JSONBin:', response.status);
            // Retornar store global ou estrutura vazia
            return globalStore || {
                availableCredentials: [],
                usedCredentials: []
            };
        }
    } catch (error) {
        console.error('Error loading from JSONBin:', error);
        // Retornar store global ou estrutura vazia
        return globalStore || {
            availableCredentials: [],
            usedCredentials: []
        };
    }
}

// Função para salvar dados no JSONBin
async function saveToJSONBin(data) {
    // Atualizar store global primeiro
    globalStore = { ...data };

    if (!JSONBIN_BIN_ID || !JSONBIN_API_KEY) {
        // Se não há configuração, apenas atualizar memória global
        return;
    }

    try {
        const response = await fetch(`${JSONBIN_API_URL}/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'X-Master-Key': JSONBIN_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            console.error('Error saving to JSONBin:', response.status);
        }
    } catch (error) {
        console.error('Error saving to JSONBin:', error);
    }
}

// Função para inicializar dados
async function initializeData(forceRefresh = false) {
    const now = Date.now();
    
    // Se forçado a atualizar ou cache expirado, recarregar
    if (forceRefresh || !cache || (now - cacheTimestamp) >= CACHE_TTL) {
        // Tentar carregar do JSONBin ou usar store global
        const data = await loadFromJSONBin();
        
        // Atualizar cache
        cache = data;
        cacheTimestamp = now;
        
        return data;
    }
    
    // Usar cache se ainda válido
    return cache;
}

// Função para salvar dados
async function saveData(data) {
    // Atualizar store global primeiro
    globalStore = { ...data };
    
    // Atualizar cache
    cache = { ...data };
    cacheTimestamp = Date.now();

    // Salvar no JSONBin (ou apenas em memória se não configurado)
    await saveToJSONBin(data);
}

// Função para obter dados atuais
function getData() {
    // Retornar cache se disponível, senão store global, senão estrutura vazia
    return cache || globalStore || {
        availableCredentials: [],
        usedCredentials: []
    };
}

module.exports = {
    getData,
    initializeData,
    saveData
};
