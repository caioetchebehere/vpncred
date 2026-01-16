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
let currentUser = null;

// API Base URL
const API_BASE = window.location.origin;

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    loadLocalData(); // Apenas para tema e estado admin local
    await loadDataFromAPI();
    setupEventListeners();
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

    // Export
    document.getElementById('exportBtn').addEventListener('click', exportToExcel);
}

// Autenticação Admin
async function handleAdminAuth(e) {
    e.preventDefault();
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('adminAuthError');

    try {
        const response = await fetch(`${API_BASE}/api/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password,
                type: 'admin'
            })
        });

        const data = await response.json();

        if (data.success) {
            isAdmin = true;
            errorDiv.textContent = '';
            document.getElementById('adminAuthSection').classList.add('hidden');
            document.getElementById('uploadSection').classList.remove('hidden');
            saveLocalData();
            await loadDataFromAPI();
        } else {
            errorDiv.textContent = data.message || 'Usuário ou senha incorretos!';
            isAdmin = false;
        }
    } catch (error) {
        errorDiv.textContent = 'Erro ao autenticar. Tente novamente.';
        console.error('Auth error:', error);
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

            // Processar credenciais: cada linha tem usuário VPN e senha VPN (separados por espaço ou tab)
            const credentials = lines
                .map(line => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;
                    
                    // Separar por espaço, tab ou múltiplos espaços
                    const parts = trimmed.split(/\s+/).filter(p => p);
                    
                    if (parts.length >= 2) {
                        return {
                            vpnUsername: parts[0],
                            vpnPassword: parts[1]
                        };
                    } else if (parts.length === 1) {
                        // Se tiver apenas uma parte, tratar como usuário (senha vazia)
                        return {
                            vpnUsername: parts[0],
                            vpnPassword: ''
                        };
                    }
                    return null;
                })
                .filter(c => c && c.vpnUsername);
            
            const response = await fetch(`${API_BASE}/api/credentials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'upload',
                    credentials: credentials
                })
            });

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                showStatus('uploadStatus', 'Erro ao processar resposta do servidor', 'error');
                console.error('Erro ao fazer parse da resposta:', jsonError);
                return;
            }

            if (response.ok && data.success) {
                await loadDataFromAPI();
                showStatus('uploadStatus', `${data.added} credenciais adicionadas com sucesso!`, 'success');
                fileInput.value = '';
            } else {
                const errorMsg = data.message || data.error || 'Erro ao fazer upload';
                showStatus('uploadStatus', errorMsg, 'error');
                console.error('Erro no upload:', data);
            }
        } catch (error) {
            showStatus('uploadStatus', 'Erro ao processar o arquivo: ' + error.message, 'error');
            console.error('Erro no upload:', error);
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
        const response = await fetch(`${API_BASE}/api/credentials`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'generate',
                userName: userName,
                branchNumber: branchNumber
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            await loadDataFromAPI();
            
            // Formatar timestamp para exibição
            const timestamp = new Date(data.usedCredential.timestamp).toLocaleString('pt-BR');
            
            // Mostrar credencial gerada no card
            showGeneratedCredential(data.credential, userName, branchNumber, timestamp);

            // Limpar formulário
            document.getElementById('generateForm').reset();
        } else {
            alert(data.message || 'Erro ao gerar credencial');
        }
    } catch (error) {
        alert('Erro ao gerar credencial: ' + error.message);
        console.error('Generate error:', error);
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
    // credential pode ser objeto {vpnUsername, vpnPassword} ou string (compatibilidade)
    const vpnUsername = typeof credential === 'object' && credential !== null 
        ? credential.vpnUsername || credential.username || credential 
        : credential;
    const vpnPassword = typeof credential === 'object' && credential !== null 
        ? credential.vpnPassword || credential.password || '' 
        : '';
    
    // Exibir usuário VPN e senha VPN separadamente
    document.getElementById('generatedCredential').textContent = vpnUsername;
    document.getElementById('generatedVpnPassword').textContent = vpnPassword || 'N/A';
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
        ['Usuário VPN', 'Senha VPN', 'Usuário do Sistema', 'Filial', 'Data/Hora de Uso']
    ];

    usedCredentials.forEach(item => {
        // Compatibilidade com formato antigo (string) e novo (objeto)
        const vpnUsername = item.vpnUsername || item.credential || '';
        const vpnPassword = item.vpnPassword || '';
        const systemUser = item.systemUser || item.userName || '';
        
        usedData.push([
            vpnUsername,
            vpnPassword,
            systemUser,
            item.branchNumber || '',
            item.timestamp || ''
        ]);
    });

    const wsUsed = XLSX.utils.aoa_to_sheet(usedData);
    XLSX.utils.book_append_sheet(wb, wsUsed, 'Credenciais Utilizadas');

    // Aba 2: Credenciais Não Utilizadas
    const unusedData = [
        ['Usuário VPN', 'Senha VPN']
    ];

    availableCredentials.forEach(credential => {
        // Compatibilidade com formato antigo (string) e novo (objeto)
        if (typeof credential === 'object' && credential !== null) {
            unusedData.push([
                credential.vpnUsername || credential.username || '',
                credential.vpnPassword || credential.password || ''
            ]);
        } else {
            unusedData.push([String(credential), '']);
        }
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
    saveLocalData();
}

function updateThemeIcon() {
    const icon = document.querySelector('.theme-icon');
    icon.textContent = isDarkMode ? '☀️' : '🌙';
}

// Carregar dados da API
async function loadDataFromAPI() {
    try {
        const response = await fetch(`${API_BASE}/api/credentials`);
        const data = await response.json();

        if (response.ok) {
            availableCredentials = data.available || [];
            usedCredentials = data.used || [];
            updateUI();
        } else {
            console.error('Erro ao carregar dados:', data.message);
        }
    } catch (error) {
        console.error('Erro ao carregar dados da API:', error);
    }
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
