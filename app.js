// Configurações
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'essilor@lux';
const LOW_STOCK_THRESHOLD = 50;
const API_BASE_URL = '/api/credentials';

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

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadLocalData();
    setupEventListeners();
    loadCredentialsFromAPI();
    updateUI();
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
    
    // Auto-preenchimento do número da filial
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

// Carregar credenciais da API
async function loadCredentialsFromAPI() {
    try {
        const response = await fetch(`${API_BASE_URL}?action=all`);
        if (response.ok) {
            const data = await response.json();
            availableCredentials = data.available || [];
            usedCredentials = data.used || [];
            updateUI();
        } else {
            const data = await response.json().catch(() => ({}));
            if (data.setupRequired || data.error?.includes('KV') || data.error?.includes('environment variables')) {
                console.warn('Vercel KV não configurado. Veja CONFIGURAR_KV.md para instruções.');
            } else {
                console.error('Erro ao carregar credenciais:', response.statusText);
            }
        }
    } catch (error) {
        console.error('Erro ao carregar credenciais:', error);
        // Não mostrar erro na UI ao carregar, apenas no console
    }
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
        saveLocalData();
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
    saveLocalData();
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
            const content = e.target.result;
            const lines = content.split('\n').filter(line => line.trim() !== '');
            
            if (lines.length === 0) {
                showStatus('uploadStatus', 'O arquivo está vazio.', 'error');
                return;
            }

            // Enviar para API
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'upload',
                    credentials: lines,
                    adminUsername: ADMIN_USERNAME,
                    adminPassword: ADMIN_PASSWORD
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Recarregar credenciais da API
                await loadCredentialsFromAPI();
                showStatus('uploadStatus', data.message || `${lines.length} credenciais adicionadas com sucesso!`, 'success');
                fileInput.value = '';
            } else {
                // Tratamento especial para erro de KV não configurado
                if (data.setupRequired || data.error?.includes('KV') || data.error?.includes('environment variables')) {
                    const errorMsg = '⚠️ Vercel KV não está configurado! ' + 
                                   'Acesse o dashboard do Vercel → Settings → Storage → Connect no banco KV. ' +
                                   'Veja o arquivo CONFIGURAR_KV.md para instruções detalhadas.';
                    showStatus('uploadStatus', errorMsg, 'error');
                } else {
                    showStatus('uploadStatus', data.error || 'Erro ao fazer upload das credenciais', 'error');
                }
            }
        } catch (error) {
            showStatus('uploadStatus', 'Erro ao processar o arquivo: ' + error.message, 'error');
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

    // Validar senha do usuário
    const correctPassword = USER_PASSWORDS[userName];
    if (!correctPassword || userPassword !== correctPassword) {
        alert('Senha incorreta para este usuário. Verifique a senha e tente novamente.');
        return;
    }

    try {
        // Enviar para API
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'generate',
                userName,
                branchNumber,
                userPassword
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Recarregar credenciais da API
            await loadCredentialsFromAPI();
            
            // Mostrar credencial gerada no card
            showGeneratedCredential(data.credential, data.userName, data.branchNumber, data.timestamp);

            // Limpar formulário
            document.getElementById('generateForm').reset();
        } else {
            alert(data.error || 'Erro ao gerar credencial');
        }
    } catch (error) {
        alert('Erro ao conectar com o servidor: ' + error.message);
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
async function exportToExcel() {
    try {
        // Garantir que temos os dados mais recentes
        await loadCredentialsFromAPI();
        
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
    } catch (error) {
        alert('Erro ao exportar relatório: ' + error.message);
    }
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
    saveLocalData();
}

function updateThemeIcon() {
    const icon = document.querySelector('.theme-icon');
    icon.textContent = isDarkMode ? '☀️' : '🌙';
}

// Persistência de dados locais (apenas para tema e estado admin)
function saveLocalData() {
    localStorage.setItem('vpn_isAdmin', JSON.stringify(isAdmin));
    localStorage.setItem('vpn_isDarkMode', JSON.stringify(isDarkMode));
}

function loadLocalData() {
    const savedIsAdmin = localStorage.getItem('vpn_isAdmin');
    const savedDarkMode = localStorage.getItem('vpn_isDarkMode');

    if (savedIsAdmin) {
        isAdmin = JSON.parse(savedIsAdmin);
    }

    if (savedDarkMode) {
        isDarkMode = JSON.parse(savedDarkMode);
        document.body.classList.toggle('dark-mode', isDarkMode);
        updateThemeIcon();
    }
}
