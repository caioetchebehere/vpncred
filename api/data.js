// Armazenamento de dados usando Vercel KV (Redis nativo do Vercel)
// Alternativa simples e gratuita que funciona nativamente no Vercel

const { kv } = require('@vercel/kv');

// Chave para armazenar os dados no KV
const KV_KEY = 'vpn_credentials';

// Cache em memória para reduzir chamadas ao KV
let cache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 2000; // 2 segundos

// Armazenamento em memória como fallback se KV não estiver disponível
let memoryStore = {
    availableCredentials: [],
    usedCredentials: []
};

// Função para carregar dados do Vercel KV
async function loadFromKV() {
    try {
        // Verificar se @vercel/kv está disponível
        if (!kv) {
            console.log('Vercel KV não disponível, usando armazenamento em memória');
            return memoryStore;
        }

        console.log('Carregando dados do Vercel KV...');
        const data = await kv.get(KV_KEY);
        
        if (data) {
            console.log('Dados carregados do KV:', {
                availableCount: (data.availableCredentials || []).length,
                usedCount: (data.usedCredentials || []).length
            });
            
            // Garantir que temos arrays válidos
            const validatedData = {
                availableCredentials: Array.isArray(data.availableCredentials) 
                    ? data.availableCredentials 
                    : [],
                usedCredentials: Array.isArray(data.usedCredentials) 
                    ? data.usedCredentials 
                    : []
            };
            
            // Atualizar store em memória também
            memoryStore = validatedData;
            
            return validatedData;
        } else {
            console.log('Nenhum dado encontrado no KV, retornando estrutura vazia');
            const empty = {
                availableCredentials: [],
                usedCredentials: []
            };
            memoryStore = empty;
            return empty;
        }
    } catch (error) {
        console.error('Erro ao carregar do Vercel KV:', {
            message: error.message,
            stack: error.stack
        });
        console.log('Usando armazenamento em memória como fallback');
        return memoryStore;
    }
}

// Função para salvar dados no Vercel KV
async function saveToKV(data) {
    // Atualizar store em memória primeiro
    memoryStore = { ...data };
    
    try {
        // Verificar se @vercel/kv está disponível
        if (!kv) {
            console.log('Vercel KV não disponível, salvando apenas em memória');
            return;
        }

        // Validar e garantir que temos arrays válidos
        const validatedData = {
            availableCredentials: Array.isArray(data.availableCredentials) 
                ? data.availableCredentials 
                : [],
            usedCredentials: Array.isArray(data.usedCredentials) 
                ? data.usedCredentials 
                : []
        };

        console.log('Salvando dados no Vercel KV:', {
            availableCount: validatedData.availableCredentials.length,
            usedCount: validatedData.usedCredentials.length
        });

        await kv.set(KV_KEY, validatedData);
        
        console.log('Dados salvos com sucesso no Vercel KV');
    } catch (error) {
        console.error('Erro ao salvar no Vercel KV:', {
            message: error.message,
            stack: error.stack
        });
        console.log('Dados salvos apenas em memória (fallback)');
    }
}

// Função para inicializar dados
async function initializeData(forceRefresh = false) {
    const now = Date.now();
    
    // Se forçado a atualizar ou cache expirado, recarregar
    if (forceRefresh || !cache || (now - cacheTimestamp) >= CACHE_TTL) {
        console.log('Inicializando dados (forceRefresh:', forceRefresh, 'cache:', !!cache, ')');
        
        // Tentar carregar do KV ou usar store em memória
        const data = await loadFromKV();
        
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
            usedCount: validatedData.usedCredentials.length
        });
        
        // Atualizar cache
        cache = validatedData;
        cacheTimestamp = now;
        
        return validatedData;
    }
    
    console.log('Usando cache existente:', {
        availableCount: (cache.availableCredentials || []).length,
        usedCount: (cache.usedCredentials || []).length,
        cacheAge: now - cacheTimestamp
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
        usedCount: validatedData.usedCredentials.length
    });
    
    // Atualizar cache
    cache = { ...validatedData };
    cacheTimestamp = Date.now();

    // Salvar no KV (ou apenas em memória se não disponível)
    await saveToKV(validatedData);
    
    console.log('Dados salvos. Cache atualizado:', {
        availableCount: cache.availableCredentials.length,
        usedCount: cache.usedCredentials.length
    });
}

// Função para obter dados atuais
function getData() {
    // Retornar cache se disponível, senão store em memória, senão estrutura vazia
    let data = cache || memoryStore || {
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
        source: cache ? 'cache' : (memoryStore ? 'memoryStore' : 'empty')
    });
    
    return data;
}

module.exports = {
    getData,
    initializeData,
    saveData
};
