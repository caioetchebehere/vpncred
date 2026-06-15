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
    'Wagner': '9020',
    'Talita': '9021',
    'Fabiana': '9022',
    'Janaina': '9023',
    'Prisicila': '9024'
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
    'Wagner': '9020',
    'Talita': '9021',
    'Fabiana': '9022',
    'Janaina': '9023',
    'Prisicila': '9024'
};

// Estado da aplicação
let isAdmin = false;
let availableCredentials = [];
let usedCredentials = [];
let isDarkMode = false;
let currentUser = null;
/** Quando há credenciais já usadas na filial, guarda o pedido até o usuário confirmar no modal */
let pendingGenerateContext = null;

// Chart instances
let availabilityChartInstance = null;
let userUsageChartInstance = null;
let timelineChartInstance = null;

// API Base URL
const API_BASE = window.location.origin;

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    loadLocalData();
    initCharts();
    await loadDataFromAPI();
    setupEventListeners();
    updateUI();
});

// Event Listeners
function setupEventListeners() {
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('adminAuthForm').addEventListener('submit', handleAdminAuth);
    document.getElementById('logoutAdminBtn').addEventListener('click', handleLogoutAdmin);
    document.getElementById('uploadBtn').addEventListener('click', handleUpload);
    document.getElementById('clearAvailableBtn').addEventListener('click', handleClearAvailable);
    document.getElementById('generateForm').addEventListener('submit', handleGenerateCredential);
    document.getElementById('exportBtn').addEventListener('click', handleExportClick);

    document.addEventListener('click', function(e) {
        if (e.target && (e.target.id === 'copyUserBtn' || e.target.closest('#copyUserBtn'))) {
            handleCopyCredentials();
        }
    });

    const branchModal = document.getElementById('branchHistoryModal');
    document.getElementById('branchHistoryCancel').addEventListener('click', closeBranchHistoryModal);
    document.getElementById('branchHistoryConfirm').addEventListener('click', handleBranchHistoryConfirm);
    branchModal.addEventListener('click', function(e) {
        if (e.target === branchModal) closeBranchHistoryModal();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && pendingGenerateContext && !branchModal.classList.contains('hidden')) {
            closeBranchHistoryModal();
        }
    });
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, type: 'admin' })
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

// Zerar credenciais disponíveis (apenas admin)
async function handleClearAvailable() {
    if (!isAdmin) {
        showStatus('uploadStatus', 'Acesso negado. Faça a autenticação de administrador primeiro.', 'error');
        return;
    }

    const confirmed = confirm(
        `⚠️ ATENÇÃO: Esta ação irá remover TODAS as ${availableCredentials.length} credenciais disponíveis (não utilizadas).\n\nAs credenciais já utilizadas NÃO serão afetadas.\n\nDeseja continuar?`
    );
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE}/api/credentials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'clear-available' })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            await loadDataFromAPI();
            showStatus('uploadStatus', 'Todas as credenciais disponíveis foram removidas com sucesso!', 'success');
        } else {
            showStatus('uploadStatus', data.message || 'Erro ao zerar credenciais', 'error');
        }
    } catch (error) {
        showStatus('uploadStatus', 'Erro ao zerar credenciais: ' + error.message, 'error');
    }
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
            const rawLines = content.split('\n');

            const parseErrors = [];
            const credentials = [];

            rawLines.forEach((line, index) => {
                const trimmed = line.trim();
                if (!trimmed) return; // linhas vazias são ignoradas silenciosamente

                const parts = trimmed.split(/\s+/).filter(p => p);
                if (parts.length >= 1 && parts[0]) {
                    credentials.push(
                        parts.length >= 2
                            ? { vpnUsername: parts[0], vpnPassword: parts[1] }
                            : { vpnUsername: parts[0], vpnPassword: '' }
                    );
                } else {
                    parseErrors.push(index + 1);
                }
            });

            if (credentials.length === 0) {
                const detail = parseErrors.length > 0
                    ? ` ${parseErrors.length} linha(s) com formato inválido (linhas: ${parseErrors.slice(0, 5).join(', ')}${parseErrors.length > 5 ? '...' : ''}).`
                    : '';
                showStatus('uploadStatus', `O arquivo não contém credenciais válidas.${detail}`, 'error');
                return;
            }

            const response = await fetch(`${API_BASE}/api/credentials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'upload', credentials })
            });

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                showStatus('uploadStatus', 'Erro ao processar resposta do servidor.', 'error');
                return;
            }

            if (response.ok && data.success) {
                await loadDataFromAPI();

                const parts = [];
                if (data.added > 0) parts.push(`${data.added} adicionada(s)`);
                if (data.skippedAlreadyAvailable > 0) parts.push(`${data.skippedAlreadyAvailable} já disponível(is)`);
                if (data.skippedAlreadyUsed > 0) parts.push(`${data.skippedAlreadyUsed} já utilizada(s)`);
                if (data.skippedDuplicateInFile > 0) parts.push(`${data.skippedDuplicateInFile} duplicada(s) no arquivo`);
                if (parseErrors.length > 0) {
                    const nums = parseErrors.slice(0, 5).join(', ') + (parseErrors.length > 5 ? '...' : '');
                    parts.push(`${parseErrors.length} linha(s) inválida(s) [linha ${nums}]`);
                }

                const summary = parts.join(' | ');
                const type = data.added > 0 ? 'success' : 'error';
                showStatus('uploadStatus', summary, type, 8000);
                if (data.added > 0) fileInput.value = '';
            } else {
                let errorMsg = data.message || data.error || 'Erro ao fazer upload';
                if (data.error && data.error.includes('BLOB_READ_WRITE_TOKEN')) {
                    errorMsg = '⚠️ BLOB_READ_WRITE_TOKEN não configurado. Configure no Vercel Dashboard → Settings → Environment Variables.';
                }
                showStatus('uploadStatus', errorMsg, 'error');
            }
        } catch (error) {
            showStatus('uploadStatus', 'Erro ao processar o arquivo: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

function normalizeBranch(value) {
    return String(value == null ? '' : value).trim();
}

function getUsedCredentialsForBranch(branchNorm) {
    return usedCredentials.filter(
        u => normalizeBranch(u.branchNumber) === branchNorm
    );
}

function fillBranchHistoryTable(rows) {
    const tbody = document.getElementById('branchHistoryTableBody');
    tbody.replaceChildren();
    rows.forEach(item => {
        const tr = document.createElement('tr');
        const vpnUser = item.vpnUsername || item.credential || '';
        const vpnPass = item.vpnPassword != null ? String(item.vpnPassword) : '';
        const sysUser = item.systemUser || item.userName || '';
        const ts = item.timestamp
            ? new Date(item.timestamp).toLocaleString('pt-BR')
            : '—';
        [vpnUser, vpnPass || '—', sysUser, ts].forEach(text => {
            const td = document.createElement('td');
            td.textContent = text;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

function hideBranchHistoryModalUI() {
    const modal = document.getElementById('branchHistoryModal');
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
}

function closeBranchHistoryModal() {
    pendingGenerateContext = null;
    hideBranchHistoryModalUI();
}

async function handleBranchHistoryConfirm() {
    const ctx = pendingGenerateContext;
    if (!ctx) return;
    const { userName, branchNumber } = ctx;
    pendingGenerateContext = null;
    hideBranchHistoryModalUI();
    await executeGenerateCredential(userName, branchNumber);
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

    const correctPassword = USER_PASSWORDS[userName];
    if (!correctPassword || userPassword !== correctPassword) {
        alert('Senha incorreta para este usuário. Verifique a senha e tente novamente.');
        return;
    }

    await loadDataFromAPI();

    const branchNorm = normalizeBranch(branchNumber);
    const existingForBranch = getUsedCredentialsForBranch(branchNorm);

    if (existingForBranch.length > 0) {
        existingForBranch.sort((a, b) => {
            const ta = new Date(a.timestamp || 0).getTime();
            const tb = new Date(b.timestamp || 0).getTime();
            return tb - ta;
        });
        pendingGenerateContext = { userName, branchNumber };
        document.getElementById('branchHistoryFilial').textContent = branchNorm;
        fillBranchHistoryTable(existingForBranch);
        const modal = document.getElementById('branchHistoryModal');
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        return;
    }

    await executeGenerateCredential(userName, branchNumber);
}

async function executeGenerateCredential(userName, branchNumber) {
    try {
        const response = await fetch(`${API_BASE}/api/credentials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'generate', userName, branchNumber })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            await loadDataFromAPI();
            const timestamp = new Date(data.usedCredential.timestamp).toLocaleString('pt-BR');
            showGeneratedCredential(data.credential, userName, branchNumber, timestamp);
            document.getElementById('generateForm').reset();
        } else {
            alert(data.message || 'Erro ao gerar credencial');
        }
    } catch (error) {
        alert('Erro ao gerar credencial: ' + error.message);
    }
}

// Atualizar UI
function updateUI() {
    const adminSection = document.getElementById('adminSection');
    adminSection.classList.remove('hidden');

    if (isAdmin) {
        document.getElementById('adminAuthSection').classList.add('hidden');
        document.getElementById('uploadSection').classList.remove('hidden');
    } else {
        document.getElementById('adminAuthSection').classList.remove('hidden');
        document.getElementById('uploadSection').classList.add('hidden');
    }

    const availableCount = availableCredentials.length;
    const usedCount = usedCredentials.length;
    const totalCount = availableCount + usedCount;

    document.getElementById('availableCount').textContent = availableCount;
    document.getElementById('usedCount').textContent = usedCount;
    document.getElementById('totalCount').textContent = totalCount;

    const warningDiv = document.getElementById('lowStockWarning');
    if (availableCount < LOW_STOCK_THRESHOLD) {
        warningDiv.classList.remove('hidden');
    } else {
        warningDiv.classList.add('hidden');
    }

    // Update status indicator
    const indicator = document.getElementById('statusIndicator');
    const label = document.getElementById('statusLabel');
    if (indicator && label) {
        indicator.classList.add('online');
        label.textContent = 'Online';
    }

    updateCharts();
}

// Mostrar credencial gerada
function showGeneratedCredential(credential, userName, branchNumber, timestamp) {
    const vpnUsername = typeof credential === 'object' && credential !== null
        ? credential.vpnUsername || credential.username || credential
        : credential;
    const vpnPassword = typeof credential === 'object' && credential !== null
        ? credential.vpnPassword || credential.password || ''
        : '';

    document.getElementById('generatedCredential').textContent = vpnUsername;
    document.getElementById('generatedVpnPassword').textContent = vpnPassword || 'N/A';
    document.getElementById('generatedUser').textContent = userName;
    document.getElementById('generatedBranch').textContent = branchNumber;
    document.getElementById('generatedTimestamp').textContent = timestamp;

    const card = document.getElementById('generatedCredentialCard');
    card.classList.remove('hidden');
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Copiar credenciais
function handleCopyCredentials() {
    const username = document.getElementById('generatedCredential').textContent;
    const password = document.getElementById('generatedVpnPassword').textContent;

    if (!username || username === 'N/A') {
        alert('Não há credenciais para copiar.');
        return;
    }

    const textToCopy = `Usuário VPN: ${username}\nSenha VPN: ${password}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
        const btn = document.getElementById('copyUserBtn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"></path></svg> Copiado!';
        btn.classList.add('copied');

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.classList.remove('copied');
        }, 2000);
    }).catch(() => {
        alert('Erro ao copiar. Tente novamente.');
    });
}

// Handle export click
function handleExportClick() {
    const adminPassword = prompt('Para gerar o relatório Excel, digite a senha de administrador:');
    if (adminPassword === null) return;
    if (adminPassword !== ADMIN_PASSWORD) {
        alert('Senha de administrador incorreta. Acesso negado.');
        return;
    }
    exportToExcel();
}

// Exportar para Excel
function exportToExcel() {
    const wb = XLSX.utils.book_new();

    const usedData = [['Usuário VPN', 'Senha VPN', 'Usuário do Sistema', 'Filial', 'Data/Hora de Uso']];
    usedCredentials.forEach(item => {
        usedData.push([
            item.vpnUsername || item.credential || '',
            item.vpnPassword || '',
            item.systemUser || item.userName || '',
            item.branchNumber || '',
            item.timestamp || ''
        ]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(usedData), 'Credenciais Utilizadas');

    const unusedData = [['Usuário VPN', 'Senha VPN']];
    availableCredentials.forEach(credential => {
        if (typeof credential === 'object' && credential !== null) {
            unusedData.push([credential.vpnUsername || '', credential.vpnPassword || '']);
        } else {
            unusedData.push([String(credential), '']);
        }
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(unusedData), 'Credenciais Não Utilizadas');

    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `relatorio_credenciais_vpn_${date}.xlsx`);
}

// Funções auxiliares
function showStatus(elementId, message, type, duration = 5000) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `status-message ${type}`;
    setTimeout(() => {
        element.textContent = '';
        element.className = 'status-message';
    }, duration);
}

// Toggle de tema
function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    updateThemeIcon();
    updateChartTheme();
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
        const indicator = document.getElementById('statusIndicator');
        const label = document.getElementById('statusLabel');
        if (indicator && label) {
            indicator.classList.remove('online');
            indicator.classList.add('offline');
            label.textContent = 'Offline';
        }
    }
}

// Persistência de dados locais
function saveLocalData() {
    localStorage.setItem('vpn_isAdmin', JSON.stringify(isAdmin));
    localStorage.setItem('vpn_isDarkMode', JSON.stringify(isDarkMode));
}

function loadLocalData() {
    const savedIsAdmin = localStorage.getItem('vpn_isAdmin');
    const savedDarkMode = localStorage.getItem('vpn_isDarkMode');

    if (savedIsAdmin) isAdmin = JSON.parse(savedIsAdmin);

    if (savedDarkMode) {
        isDarkMode = JSON.parse(savedDarkMode);
        document.body.classList.toggle('dark-mode', isDarkMode);
        updateThemeIcon();
    }
}

// ============================================================
//  CHART MANAGEMENT
// ============================================================

const CHART_COLORS_LIGHT = {
    available: '#667eea',
    used: '#764ba2',
    line: '#667eea',
    lineFill: 'rgba(102, 126, 234, 0.12)',
    pointBorder: '#fff',
    bars: [
        'rgba(102,126,234,0.85)', 'rgba(118,75,162,0.85)', 'rgba(240,147,251,0.85)',
        'rgba(79,172,254,0.85)', 'rgba(0,200,200,0.85)', 'rgba(67,200,123,0.85)',
        'rgba(250,112,154,0.85)', 'rgba(255,190,84,0.85)', 'rgba(150,200,120,0.85)',
        'rgba(130,130,255,0.85)'
    ]
};

const CHART_COLORS_DARK = {
    available: '#00ffff',
    used: '#8a2be2',
    line: '#00ffff',
    lineFill: 'rgba(0,255,255,0.08)',
    pointBorder: '#1a1a1a',
    bars: [
        'rgba(0,255,255,0.75)', 'rgba(138,43,226,0.75)', 'rgba(0,255,127,0.75)',
        'rgba(255,0,102,0.75)', 'rgba(255,190,84,0.75)', 'rgba(102,166,255,0.75)',
        'rgba(240,147,251,0.75)', 'rgba(79,172,254,0.75)', 'rgba(67,233,123,0.75)',
        'rgba(250,112,154,0.75)'
    ]
};

function getColors() {
    return isDarkMode ? CHART_COLORS_DARK : CHART_COLORS_LIGHT;
}

function getTextColor() {
    return isDarkMode ? '#8899aa' : '#6b7280';
}

function getGridColor() {
    return isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
}

function initCharts() {
    if (typeof Chart === 'undefined') return;

    const c = getColors();
    const textColor = getTextColor();
    const gridColor = getGridColor();

    Chart.defaults.color = textColor;
    Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    Chart.defaults.font.size = 12;

    // --- Donut Chart: Availability ---
    const ctx1 = document.getElementById('availabilityChart');
    if (ctx1) {
        availabilityChartInstance = new Chart(ctx1.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Disponíveis', 'Utilizadas'],
                datasets: [{
                    data: [1, 0],
                    backgroundColor: [c.available, c.used],
                    borderWidth: 4,
                    borderColor: isDarkMode ? '#1a1a1a' : '#fff',
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                animation: { animateRotate: true, duration: 800 },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label(ctx) {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
                                return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // --- Bar Chart: Usage per user ---
    const ctx2 = document.getElementById('userUsageChart');
    if (ctx2) {
        userUsageChartInstance = new Chart(ctx2.getContext('2d'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Credenciais',
                    data: [],
                    backgroundColor: c.bars,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 600 },
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, color: textColor },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: textColor },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // --- Line Chart: 30-day timeline ---
    const ctx3 = document.getElementById('timelineChart');
    if (ctx3) {
        timelineChartInstance = new Chart(ctx3.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Credenciais Usadas',
                    data: [],
                    borderColor: c.line,
                    backgroundColor: c.lineFill,
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: c.line,
                    pointBorderColor: c.pointBorder,
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 600 },
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, color: textColor },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { maxRotation: 45, maxTicksLimit: 10, color: textColor },
                        grid: { display: false }
                    }
                }
            }
        });
    }
}

function updateCharts() {
    if (typeof Chart === 'undefined') return;

    const availableCount = availableCredentials.length;
    const usedCount = usedCredentials.length;
    const total = availableCount + usedCount;
    const usageRate = total > 0 ? Math.round((usedCount / total) * 100) : 0;
    const availPct = total > 0 ? Math.round((availableCount / total) * 100) : 0;

    // KPI extras
    const usageRateEl = document.getElementById('usageRate');
    if (usageRateEl) usageRateEl.textContent = `${usageRate}%`;
    const usageBarEl = document.getElementById('usageBar');
    if (usageBarEl) usageBarEl.style.width = `${usageRate}%`;
    const donutPctEl = document.getElementById('donutPct');
    if (donutPctEl) donutPctEl.textContent = `${availPct}%`;

    // --- Donut update ---
    if (availabilityChartInstance) {
        availabilityChartInstance.data.datasets[0].data = total > 0
            ? [availableCount, usedCount]
            : [1, 0];
        availabilityChartInstance.update('active');
    }

    // --- Bar chart update ---
    const userCounts = {};
    usedCredentials.forEach(item => {
        const user = item.systemUser || item.userName || 'Desconhecido';
        userCounts[user] = (userCounts[user] || 0) + 1;
    });
    const sortedUsers = Object.entries(userCounts).sort((a, b) => b[1] - a[1]);

    if (userUsageChartInstance) {
        userUsageChartInstance.data.labels = sortedUsers.map(([u]) => u);
        userUsageChartInstance.data.datasets[0].data = sortedUsers.map(([, c]) => c);
        userUsageChartInstance.update('active');
    }

    const userCanvas = document.getElementById('userUsageChart');
    const userEmpty = document.getElementById('userChartEmpty');
    if (userCanvas && userEmpty) {
        if (sortedUsers.length === 0) {
            userCanvas.style.display = 'none';
            userEmpty.style.display = 'flex';
        } else {
            userCanvas.style.display = 'block';
            userEmpty.style.display = 'none';
        }
    }

    // --- Line chart: last 30 days ---
    const today = new Date();
    const dateSeries = [];
    const dateCounts = {};
    for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        dateSeries.push({ key, label });
        dateCounts[key] = 0;
    }
    usedCredentials.forEach(item => {
        if (item.timestamp) {
            const key = new Date(item.timestamp).toISOString().split('T')[0];
            if (Object.prototype.hasOwnProperty.call(dateCounts, key)) {
                dateCounts[key]++;
            }
        }
    });

    if (timelineChartInstance) {
        timelineChartInstance.data.labels = dateSeries.map(d => d.label);
        timelineChartInstance.data.datasets[0].data = dateSeries.map(d => dateCounts[d.key]);
        timelineChartInstance.update('active');
    }

    const timelineCanvas = document.getElementById('timelineChart');
    const timelineEmpty = document.getElementById('timelineChartEmpty');
    if (timelineCanvas && timelineEmpty) {
        const hasData = dateSeries.some(d => dateCounts[d.key] > 0);
        if (!hasData) {
            timelineCanvas.style.display = 'none';
            timelineEmpty.style.display = 'flex';
        } else {
            timelineCanvas.style.display = 'block';
            timelineEmpty.style.display = 'none';
        }
    }
}

function updateChartTheme() {
    if (typeof Chart === 'undefined') return;

    const c = getColors();
    const textColor = getTextColor();
    const gridColor = getGridColor();
    const borderColor = isDarkMode ? '#1a1a1a' : '#fff';

    Chart.defaults.color = textColor;

    if (availabilityChartInstance) {
        availabilityChartInstance.data.datasets[0].backgroundColor = [c.available, c.used];
        availabilityChartInstance.data.datasets[0].borderColor = borderColor;
        availabilityChartInstance.update();
    }

    if (userUsageChartInstance) {
        userUsageChartInstance.data.datasets[0].backgroundColor = c.bars;
        userUsageChartInstance.options.scales.x.ticks.color = textColor;
        userUsageChartInstance.options.scales.y.ticks.color = textColor;
        userUsageChartInstance.options.scales.y.grid.color = gridColor;
        userUsageChartInstance.update();
    }

    if (timelineChartInstance) {
        timelineChartInstance.data.datasets[0].borderColor = c.line;
        timelineChartInstance.data.datasets[0].backgroundColor = c.lineFill;
        timelineChartInstance.data.datasets[0].pointBackgroundColor = c.line;
        timelineChartInstance.data.datasets[0].pointBorderColor = c.pointBorder;
        timelineChartInstance.options.scales.x.ticks.color = textColor;
        timelineChartInstance.options.scales.y.ticks.color = textColor;
        timelineChartInstance.options.scales.y.grid.color = gridColor;
        timelineChartInstance.update();
    }
}
