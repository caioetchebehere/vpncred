// Configurações
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'essilor@lux';
const LOW_STOCK_THRESHOLD = 50;

// Mapeamento de usuários e filiais
const USER_BRANCHES = {
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

// Mapeamento de senhas dos usuários (senha = número da filial)
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

// Estado da aplicação
let isAdmin = false;
let availableCredentials = [];
let usedCredentials = [];
let isDarkMode = false;

// URL base da API (será detectada automaticamente)
const API_BASE_URL = window.location.origin;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    // Carregar preferência de tema do localStorage (apenas tema, não credenciais)
    const savedDarkMode = localStorage.getItem('vpn_isDarkMode');
    if (savedDarkMode) {
        isDarkMode = JSON.parse(savedDarkMode);
        document.body.classList.toggle('dark-mode', isDarkMode);
        updateThemeIcon();
    }
});

// Event Listeners
function setupEventListeners() {
    // Toggle de tema
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Autenticação Admin
    document.getElementById('adminAuthForm').addEventListener('submit', handleAdminAuth);
    document.getElementById('logoutAdminBtn').addEventListener('click', handleLogoutAdmin);

    // Upload
    document.getElementById('uploadBtn').addEventListener('click', handleUpload);

    // Geração de credenciais
    document.getElementById('generateForm').addEventListener('submit', handleGenerateCredential);
    
    // Preencher número da filial automaticamente quando usuário é selecionado
    document.getElementById('userName').addEventListener('change', function() {
        const selectedUser = this.value;
        if (selectedUser && USER_BRANCHES[selectedUser]) {
            document.getElementById('branchNumber').value = USER_BRANCHES[selectedUser];
        } else {
            document.getElementById('branchNumber').value = '';
        }
    });

    // Export
    document.getElementById('exportBtn').addEventListener('click', exportToExcel);
}

// Autenticação Admin
function handleAdminAuth(e) {
    e.preventDefault();
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('adminAuthError');

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        isAdmin = true;
        errorDiv.textContent = '';
        document.getElementById('adminAuthSection').classList.add('hidden');
        document.getElementById('uploadSection').classList.remove('hidden');
        // Salvar apenas preferência de admin no localStorage (temporário, apenas para sessão)
        localStorage.setItem('vpn_isAdmin', JSON.stringify(isAdmin));
    } else {
        errorDiv.textContent = 'Usuário ou senha incorretos!';
        isAdmin = false;
    }
}

function handleLogoutAdmin() {
    isAdmin = false;
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminAuthError').textContent = '';
    document.getElementById('adminAuthSection').classList.remove('hidden');
    document.getElementById('uploadSection').classList.add('hidden');
    localStorage.removeItem('vpn_isAdmin');
}


// Upload de credenciais (apenas admin)
async function handleUpload() {
    if (!isAdmin) {
        showStatus('uploadStatus', 'Acesso negado. Faça a autenticação de administrador primeiro.', 'error');
        return;
    }

    const fileInput = document.getElementById('credentialFile');
    const file = fileInput.files[0];

    if (!file) {
        showStatus('uploadStatus', 'Por favor, selecione um arquivo TXT.', 'error');
        return;
    }

    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
        showStatus('uploadStatus', 'Por favor, selecione um arquivo TXT válido.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            let content = e.target.result;
            
            // Normalizar quebras de linha (Windows \r\n, Mac \r, Unix \n)
            content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            
            // Dividir por linhas e processar
            const allLines = content.split('\n');
            
            // Processar e filtrar linhas válidas
            const credentials = allLines
                .map(line => {
                    // Remover espaços no início e fim
                    const trimmed = line.trim();
                    // Remover caracteres de controle invisíveis
                    return trimmed.replace(/[\x00-\x1F\x7F]/g, '');
                })
                .filter(line => {
                    // Filtrar linhas vazias e apenas espaços
                    return line.length > 0;
                });
            
            console.log(`Arquivo processado: ${allLines.length} linhas totais, ${credentials.length} credenciais válidas`);
            
            if (credentials.length === 0) {
                showStatus('uploadStatus', 'O arquivo está vazio ou não contém credenciais válidas.', 'error');
                return;
            }

            // Enviar credenciais para a API
            showStatus('uploadStatus', `Processando ${credentials.length} credenciais...`, 'info');
            
            const response = await fetch(`${API_BASE_URL}/api/upload-credentials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    credentials: credentials
                })
            });

            // Verificar se a resposta é JSON antes de fazer parse
            const contentType = response.headers.get('content-type');
            let result;
            
            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            } else {
                // Se não for JSON, ler como texto para ver o erro
                const text = await response.text();
                console.error('Resposta não-JSON recebida:', text);
                showStatus('uploadStatus', `Erro no servidor (${response.status}): A API não retornou JSON válido. Verifique se a API está funcionando corretamente.`, 'error');
                return;
            }

            if (response.ok && result.success) {
                console.log('Upload bem-sucedido:', result);
                
                // Limpar input primeiro
                fileInput.value = '';
                
                // Se a resposta incluir os dados atualizados, usar diretamente
                if (result.data && result.data.availableCredentials) {
                    console.log('Usando dados da resposta do upload:', {
                        available: result.data.availableCredentials.length,
                        used: result.data.usedCredentials.length
                    });
                    
                    // Atualizar arrays diretamente com os dados da resposta
                    availableCredentials = result.data.availableCredentials;
                    usedCredentials = result.data.usedCredentials;
                    
                    // Atualizar UI imediatamente
                    updateUI();
                    
                    // Mostrar resultado detalhado
                    let message = result.message;
                    if (result.totalReceived) {
                        message += ` (${result.totalReceived} recebidas, ${result.addedCount} adicionadas)`;
                    }
                    showStatus('uploadStatus', message, 'success');
                } else {
                    // Fallback: recarregar da API se os dados não vieram na resposta
                    console.log('Dados não incluídos na resposta, recarregando da API...');
                    
                    // Mostrar resultado detalhado
                    let message = result.message;
                    if (result.totalReceived) {
                        message += ` (${result.totalReceived} recebidas, ${result.addedCount} adicionadas)`;
                    }
                    showStatus('uploadStatus', message, 'success');
                    
                    // Aguardar um pouco mais para garantir que o servidor salvou
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Invalidar qualquer cache e recarregar dados da API
                    console.log('Recarregando dados após upload...');
                    await loadData();
                    
                    // Verificar se os dados foram carregados
                    console.log('Dados após reload:', {
                        available: availableCredentials.length,
                        used: usedCredentials.length
                    });
                    
                    // Forçar atualização da UI novamente para garantir
                    updateUI();
                }
            } else {
                const errorMsg = result?.error || result?.message || 'Erro ao fazer upload das credenciais';
                console.error('Erro no upload:', result);
                showStatus('uploadStatus', errorMsg, 'error');
            }
        } catch (error) {
            console.error('Erro ao processar upload:', error);
            console.error('Erro completo:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            
            let errorMessage = 'Erro ao processar o arquivo: ' + error.message;
            
            // Mensagens de erro mais amigáveis
            if (error.message.includes('JSON')) {
                errorMessage = 'Erro ao comunicar com o servidor. Verifique se a API está funcionando corretamente.';
            } else if (error.message.includes('fetch')) {
                errorMessage = 'Erro de conexão. Verifique sua conexão com a internet e se o servidor está online.';
            } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                errorMessage = 'Erro de rede. Verifique sua conexão e tente novamente.';
            }
            
            showStatus('uploadStatus', errorMessage, 'error');
        }
    };
    reader.readAsText(file);
}

// Gerar credencial
async function handleGenerateCredential(e) {
    e.preventDefault();

    const userName = document.getElementById('userName').value;
    const branchNumber = document.getElementById('branchNumber').value;
    const userPassword = document.getElementById('userPassword').value;

    if (!userName || !branchNumber || !userPassword) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    try {
        // Enviar requisição para gerar credencial
        const response = await fetch(`${API_BASE_URL}/api/generate-credential`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userName: userName,
                branchNumber: branchNumber,
                userPassword: userPassword
            })
        });

        // Verificar se a resposta é JSON antes de fazer parse
        const contentType = response.headers.get('content-type');
        let result;
        
        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
        } else {
            // Se não for JSON, ler como texto para ver o erro
            const text = await response.text();
            console.error('Resposta não-JSON recebida:', text);
            alert(`Erro no servidor (${response.status}): A API não retornou JSON válido. Verifique se a API está funcionando corretamente.`);
            return;
        }

        if (response.ok && result.success) {
            // Recarregar dados da API
            await loadData();
            
            // Mostrar credencial gerada no card
            showGeneratedCredential(result.credential, result.userName, result.branchNumber, result.timestamp);

            // Limpar formulário
            document.getElementById('generateForm').reset();
        } else {
            alert(result.error || 'Erro ao gerar credencial');
        }
    } catch (error) {
        console.error('Erro ao gerar credencial:', error);
        let errorMessage = 'Erro ao gerar credencial: ' + error.message;
        
        // Mensagens de erro mais amigáveis
        if (error.message.includes('JSON')) {
            errorMessage = 'Erro ao comunicar com o servidor. Verifique se a API está funcionando corretamente.';
        } else if (error.message.includes('fetch')) {
            errorMessage = 'Erro de conexão. Verifique sua conexão com a internet e se o servidor está online.';
        }
        
        alert(errorMessage);
    }
}

// Atualizar UI
function updateUI() {
    // A seção admin sempre está visível, mas o conteúdo muda baseado na autenticação
    const adminSection = document.getElementById('adminSection');
    adminSection.classList.remove('hidden');
    
    // Se já está autenticado, mostrar seção de upload
    if (isAdmin) {
        document.getElementById('adminAuthSection').classList.add('hidden');
        document.getElementById('uploadSection').classList.remove('hidden');
    } else {
        document.getElementById('adminAuthSection').classList.remove('hidden');
        document.getElementById('uploadSection').classList.add('hidden');
    }

    // Atualizar estatísticas
    const availableCount = availableCredentials.length;
    const usedCount = usedCredentials.length;
    const totalCount = availableCount + usedCount;

    document.getElementById('availableCount').textContent = availableCount;
    document.getElementById('usedCount').textContent = usedCount;
    document.getElementById('totalCount').textContent = totalCount;

    // Alerta de estoque baixo
    const warningDiv = document.getElementById('lowStockWarning');
    if (availableCount < LOW_STOCK_THRESHOLD) {
        warningDiv.classList.remove('hidden');
    } else {
        warningDiv.classList.add('hidden');
    }
}

// Mostrar credencial gerada no card
function showGeneratedCredential(credential, userName, branchNumber, timestamp) {
    document.getElementById('generatedCredential').textContent = credential;
    document.getElementById('generatedUser').textContent = userName;
    document.getElementById('generatedBranch').textContent = branchNumber;
    document.getElementById('generatedTimestamp').textContent = timestamp;
    
    const card = document.getElementById('generatedCredentialCard');
    card.classList.remove('hidden');
    
    // Scroll suave até o card
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Exportar para Excel
function exportToExcel() {
    const wb = XLSX.utils.book_new();

    // Aba 1: Credenciais Utilizadas
    const usedData = [
        ['Credencial', 'Usuário', 'Filial', 'Data/Hora de Uso']
    ];

    usedCredentials.forEach(item => {
        usedData.push([
            item.credential,
            item.userName,
            item.branchNumber,
            item.timestamp
        ]);
    });

    const wsUsed = XLSX.utils.aoa_to_sheet(usedData);
    XLSX.utils.book_append_sheet(wb, wsUsed, 'Credenciais Utilizadas');

    // Aba 2: Credenciais Não Utilizadas
    const unusedData = [
        ['Credencial']
    ];

    availableCredentials.forEach(credential => {
        unusedData.push([credential]);
    });

    const wsUnused = XLSX.utils.aoa_to_sheet(unusedData);
    XLSX.utils.book_append_sheet(wb, wsUnused, 'Credenciais Não Utilizadas');

    // Gerar nome do arquivo com data
    const date = new Date().toISOString().split('T')[0];
    const fileName = `relatorio_credenciais_vpn_${date}.xlsx`;

    // Salvar arquivo
    XLSX.writeFile(wb, fileName);
}

// Funções auxiliares
function showStatus(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `status-message ${type}`;
    setTimeout(() => {
        element.textContent = '';
        element.className = 'status-message';
    }, 5000);
}

// Toggle de tema
function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    updateThemeIcon();
    // Salvar apenas preferência de tema no localStorage
    localStorage.setItem('vpn_isDarkMode', JSON.stringify(isDarkMode));
}

function updateThemeIcon() {
    const icon = document.querySelector('.theme-icon');
    icon.textContent = isDarkMode ? '☀️' : '🌙';
}

// Carregar dados da API
async function loadData() {
    try {
        // Adicionar timestamp para evitar cache do navegador
        const timestamp = new Date().getTime();
        const response = await fetch(`${API_BASE_URL}/api/get-credentials?t=${timestamp}`, {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        // Verificar se a resposta é JSON antes de fazer parse
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            // Se não for JSON, ler como texto para debug
            const text = await response.text();
            console.error('Resposta não-JSON recebida ao carregar credenciais:', text.substring(0, 200));
            // Em caso de erro, usar arrays vazios
            availableCredentials = [];
            usedCredentials = [];
            updateUI();
            return;
        }

        if (response.ok) {
            // Atualizar arrays de credenciais
            const newAvailable = data.availableCredentials || [];
            const newUsed = data.usedCredentials || [];
            
            console.log('Dados recebidos da API:', {
                available: newAvailable.length,
                used: newUsed.length,
                previousAvailable: availableCredentials.length,
                previousUsed: usedCredentials.length
            });
            
            // Sempre atualizar, mesmo se parecer igual (pode haver diferenças não detectadas)
            availableCredentials = newAvailable;
            usedCredentials = newUsed;
            
            console.log('Arrays atualizados:', {
                available: availableCredentials.length,
                used: usedCredentials.length
            });
            
            updateUI();
        } else {
            console.error('Erro ao carregar credenciais:', data.error);
            // Em caso de erro, usar arrays vazios
            availableCredentials = [];
            usedCredentials = [];
            updateUI();
        }
    } catch (error) {
        console.error('Erro ao carregar credenciais:', error);
        // Em caso de erro, usar arrays vazios
        availableCredentials = [];
        usedCredentials = [];
        updateUI();
    }

    // Carregar estado de admin do localStorage (apenas para sessão)
    const savedIsAdmin = localStorage.getItem('vpn_isAdmin');
    if (savedIsAdmin) {
        isAdmin = JSON.parse(savedIsAdmin);
        if (isAdmin) {
            document.getElementById('adminAuthSection').classList.add('hidden');
            document.getElementById('uploadSection').classList.remove('hidden');
        }
    }
}
