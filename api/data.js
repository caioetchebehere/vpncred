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
    const hasConfig = !!(JSONBIN_BIN_ID && JSONBIN_API_KEY);
    console.log('loadFromJSONBin chamado:', {
        hasJSONBinConfig: hasConfig,
        hasBinId: !!JSONBIN_BIN_ID,
        hasApiKey: !!JSONBIN_API_KEY,
        globalStoreAvailable: !!globalStore,
        globalStoreCount: globalStore ? (globalStore.availableCredentials || []).length : 0
    });
    
    if (!JSONBIN_BIN_ID || !JSONBIN_API_KEY) {
        // Se não há configuração, usar armazenamento em memória global
        console.log('JSONBin não configurado. Retornando globalStore ou estrutura vazia');
        const result = globalStore || {
            availableCredentials: [],
            usedCredentials: []
        };
        console.log('Retornando dados (sem JSONBin):', {
            availableCount: (result.availableCredentials || []).length,
            usedCount: (result.usedCredentials || []).length
        });
        return result;
    }

    try {
        console.log('Tentando carregar do JSONBin:', {
            url: `${JSONBIN_API_URL}/${JSONBIN_BIN_ID}/latest`,
            hasApiKey: !!JSONBIN_API_KEY,
            hasBinId: !!JSONBIN_BIN_ID
        });
        
        const response = await fetch(`${JSONBIN_API_URL}/${JSONBIN_BIN_ID}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log('Resposta do JSONBin:', {
            status: response.status,
            ok: response.ok
        });

        if (response.ok) {
            const jsonData = await response.json();
            console.log('Resposta JSON do JSONBin recebida:', {
                hasRecord: !!jsonData.record,
                recordKeys: jsonData.record ? Object.keys(jsonData.record) : []
            });
            
            let result = jsonData.record || {
                availableCredentials: [],
                usedCredentials: []
            };
            
            console.log('Dados antes da validação:', {
                availableType: typeof result.availableCredentials,
                availableIsArray: Array.isArray(result.availableCredentials),
                availableValue: result.availableCredentials,
                usedType: typeof result.usedCredentials,
                usedIsArray: Array.isArray(result.usedCredentials)
            });
            
            // Garantir que os arrays existem e são válidos
            if (!Array.isArray(result.availableCredentials)) {
                console.warn('availableCredentials não é um array, convertendo. Tipo:', typeof result.availableCredentials, 'Valor:', result.availableCredentials);
                result.availableCredentials = [];
            }
            if (!Array.isArray(result.usedCredentials)) {
                console.warn('usedCredentials não é um array, convertendo. Tipo:', typeof result.usedCredentials);
                result.usedCredentials = [];
            }
            
            console.log('Dados carregados do JSONBin (após validação):', {
                availableCount: result.availableCredentials.length,
                usedCount: result.usedCredentials.length,
                firstFew: result.availableCredentials.slice(0, 3)
            });
            // Atualizar store global
            globalStore = result;
            return result;
        } else if (response.status === 404) {
            console.log('Bin não existe no JSONBin, criando estrutura vazia');
            // Bin não existe, criar estrutura vazia
            const empty = {
                availableCredentials: [],
                usedCredentials: []
            };
            globalStore = empty;
            return empty;
        } else {
            const errorText = await response.text().catch(() => 'Unable to read error');
            console.error('Error loading from JSONBin:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            // Retornar store global ou estrutura vazia
            return globalStore || {
                availableCredentials: [],
                usedCredentials: []
            };
        }
    } catch (error) {
        console.error('Error loading from JSONBin (exception):', {
            message: error.message,
            stack: error.stack
        });
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
    
    console.log('saveToJSONBin chamado. JSONBin configurado:', !!(JSONBIN_BIN_ID && JSONBIN_API_KEY));
    console.log('Dados sendo salvos:', {
        availableCount: (data.availableCredentials || []).length,
        usedCount: (data.usedCredentials || []).length
    });

    if (!JSONBIN_BIN_ID || !JSONBIN_API_KEY) {
        // Se não há configuração, apenas atualizar memória global
        console.log('JSONBin não configurado. Dados salvos apenas em memória (globalStore).');
        console.warn('ATENÇÃO: Sem JSONBin configurado, os dados serão perdidos quando a função serverless for reiniciada!');
        return;
    }

    try {
        console.log('Tentando salvar no JSONBin:', {
            url: `${JSONBIN_API_URL}/${JSONBIN_BIN_ID}`,
            dataSize: JSON.stringify(data).length
        });
        
        const response = await fetch(`${JSONBIN_API_URL}/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'X-Master-Key': JSONBIN_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unable to read error');
            console.error('Error saving to JSONBin:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
        } else {
            console.log('Dados salvos com sucesso no JSONBin');
        }
    } catch (error) {
        console.error('Error saving to JSONBin (exception):', {
            message: error.message,
            stack: error.stack
        });
    }
}

// Função para inicializar dados
async function initializeData(forceRefresh = false) {
    const now = Date.now();
    
    // Se forçado a atualizar ou cache expirado, recarregar
    if (forceRefresh || !cache || (now - cacheTimestamp) >= CACHE_TTL) {
        console.log('Inicializando dados (forceRefresh:', forceRefresh, 'cache:', !!cache, ')');
        
        // Tentar carregar do JSONBin ou usar store global
        const data = await loadFromJSONBin();
        
        // Garantir que sempre retornamos arrays válidos
        const validatedData = {
            availableCredentials: Array.isArray(data.availableCredentials) 
                ? data.availableCredentials 
                : [],
            usedCredentials: Array.isArray(data.usedCredentials) 
                ? data.usedCredentials 
                : []
        };
        
        console.log('Dados carregados e validados:', {
            availableCount: validatedData.availableCredentials.length,
            usedCount: validatedData.usedCredentials.length,
            hasJSONBin: !!(JSONBIN_BIN_ID && JSONBIN_API_KEY),
            originalAvailableType: typeof data.availableCredentials,
            originalUsedType: typeof data.usedCredentials
        });
        
        // Atualizar cache
        cache = validatedData;
        cacheTimestamp = now;
        globalStore = validatedData; // Garantir que globalStore também está atualizado
        
        return validatedData;
    }
    
    console.log('Usando cache existente:', {
        availableCount: (cache.availableCredentials || []).length,
        usedCount: (cache.usedCredentials || []).length
    });
    
    // Usar cache se ainda válido
    return cache;
}

// Função para salvar dados
async function saveData(data) {
    // Validar e garantir que temos arrays válidos
    const validatedData = {
        availableCredentials: Array.isArray(data.availableCredentials) 
            ? data.availableCredentials 
            : [],
        usedCredentials: Array.isArray(data.usedCredentials) 
            ? data.usedCredentials 
            : []
    };
    
    console.log('Salvando dados:', {
        availableCount: validatedData.availableCredentials.length,
        usedCount: validatedData.usedCredentials.length,
        originalAvailableType: typeof data.availableCredentials,
        originalUsedType: typeof data.usedCredentials
    });
    
    // Atualizar store global primeiro
    globalStore = { ...validatedData };
    
    // Atualizar cache
    cache = { ...validatedData };
    cacheTimestamp = Date.now();

    // Salvar no JSONBin (ou apenas em memória se não configurado)
    await saveToJSONBin(validatedData);
    
    console.log('Dados salvos. Cache atualizado:', {
        availableCount: cache.availableCredentials.length,
        usedCount: cache.usedCredentials.length
    });
}

// Função para obter dados atuais
function getData() {
    // Retornar cache se disponível, senão store global, senão estrutura vazia
    let data = cache || globalStore || {
        availableCredentials: [],
        usedCredentials: []
    };
    
    // Garantir que sempre retornamos arrays válidos
    if (!Array.isArray(data.availableCredentials)) {
        console.warn('getData: availableCredentials não é array, corrigindo');
        data = {
            ...data,
            availableCredentials: []
        };
    }
    if (!Array.isArray(data.usedCredentials)) {
        console.warn('getData: usedCredentials não é array, corrigindo');
        data = {
            ...data,
            usedCredentials: []
        };
    }
    
    console.log('getData() retornando:', {
        availableCount: data.availableCredentials.length,
        usedCount: data.usedCredentials.length,
        source: cache ? 'cache' : (globalStore ? 'globalStore' : 'empty')
    });
    
    return data;
}

module.exports = {
    getData,
    initializeData,
    saveData
};
