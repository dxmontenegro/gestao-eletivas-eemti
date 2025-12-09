// script.js (Frontend Logic) - Atualizado

// ----------------------------------------------------------------------
// URL FINAL E CORRETA (CONFIRME que é seu deploy atual)
// ----------------------------------------------------------------------
const GAS_ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbwBIai5AvIrteYrmPlfD_EpTTJi00TWRR8pzzPch-J-45UePzKqIFXESUtZxH4EYncH/exec';

// --- 1. Controle de Abas e Visibilidade ---
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });
    const activeTab = document.getElementById(tabId);
    if (activeTab) {
        activeTab.style.display = 'block';
        activeTab.classList.add('active');
    }

    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    const btn = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
    if (btn) btn.classList.add('active');
    
    if (tabId === 'mapa-eletiva-tab') {
        loadDynamicDataForMap();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    showTab('aluno-tab');
    document.getElementById('username').value = 'monte';
    document.getElementById('password').value = '1234';
    loadDynamicData();
});

// --- 2. Login Simples ---
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const user = document.getElementById('username').value.trim(); 
    const pass = document.getElementById('password').value.trim(); 
    const message = document.getElementById('login-message');
    
    if (user.toLowerCase() === 'monte' && pass === '1234') {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-system').style.display = 'block';
        message.textContent = '';
        loadDynamicData();
        loadDynamicDataForMap();
    } else {
        message.style.color = 'red';
        message.textContent = '❌ Usuário ou senha inválidos.';
    }
});

// --- 3. Comunicação Centralizada com o GAS ---
function showLoading(messageElement, action = 'Enviando') {
    if (!messageElement) return;
    messageElement.textContent = `⏳ ${action} dados...`;
    messageElement.style.color = 'blue';
}

async function sendDataToGAS(action, formId, messageId) {
    const form = document.getElementById(formId);
    const messageElement = document.getElementById(messageId);
    if (!messageElement) return;
    showLoading(messageElement);

    const formData = new FormData(form);
    const params = new URLSearchParams();
    params.append('action', action);
    for (const [key, value] of formData.entries()) {
        params.append(key, value);
    }

    try {
        const response = await fetch(GAS_ENDPOINT_URL, {
            method: 'POST',
            body: params,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        // Tenta parsear JSON — se retornar HTML ou falhar, cuidamos disso
        let result = null;
        try {
            result = await response.json();
        } catch (jsonErr) {
            // Se o servidor respondeu com 200 mas não JSON, mostramos aviso
            if (response.ok) {
                messageElement.style.color = 'orange';
                messageElement.textContent = `⚠️ Sucesso na Planilha, mas resposta do servidor não é JSON legível.`;
                if (form) form.reset();
                await loadDynamicData();
                await loadDynamicDataForMap();
                return;
            } else {
                throw new Error(`Resposta inválida do servidor. Status HTTP: ${response.status}`);
            }
        }

        if (result && result.status === 'success') {
            messageElement.style.color = 'green';
            messageElement.textContent = `✅ ${result.message || 'Operação realizada com sucesso.'}`;
            if (form) form.reset();
            await loadDynamicData();
            await loadDynamicDataForMap();
        } else {
            messageElement.style.color = 'red';
            const msg = (result && result.message) ? result.message : 'Erro desconhecido do servidor.';
            messageElement.textContent = `❌ Erro do Servidor: ${msg}`;
        }

    } catch (error) {
        console.error('Erro de Processamento/Conexão:', error);
        messageElement.style.color = 'red';
        messageElement.textContent = `❌ Erro de conexão com o servidor. Detalhe: ${error.message || error}`;
    }
}

// Vinculação de Formulários
document.getElementById('form-aluno').addEventListener('submit', (e) => {
    e.preventDefault();
    sendDataToGAS('cadastrarAluno', 'form-aluno', 'aluno-message');
});

document.getElementById('form-professor').addEventListener('submit', (e) => {
    e.preventDefault();
    sendDataToGAS('cadastrarProfessor', 'form-professor', 'professor-message');
});

document.getElementById('form-eletiva').addEventListener('submit', (e) => {
    e.preventDefault();
    sendDataToGAS('cadastrarEletiva', 'form-eletiva', 'eletiva-message');
});

document.getElementById('form-vincular-professor').addEventListener('submit', (e) => {
    e.preventDefault();
    sendDataToGAS('vincularProfessor', 'form-vincular-professor', 'vinculo-professor-message');
});

document.getElementById('form-registrar-aluno').addEventListener('submit', (e) => {
    e.preventDefault();
    sendDataToGAS('registrarAluno', 'form-registrar-aluno', 'registro-aluno-message');
});

// --- 4. Carregamento de Dados Dinâmicos (GET) ---
function fillSelect(selectId, optionsArray, placeholderText = 'Selecione...') {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = `<option value="" disabled selected>${placeholderText}</option>`;
    if (!optionsArray || !Array.isArray(optionsArray) || optionsArray.length === 0) {
        // mostra opção informativa
        const opt = document.createElement('option');
        opt.value = '';
        opt.disabled = true;
        opt.selected = true;
        opt.textContent = '— Nenhum registro —';
        select.appendChild(opt);
        return;
    }
    optionsArray.forEach(item => {
        const option = document.createElement('option');
        option.value = item.nome;
        option.textContent = item.nome;
        select.appendChild(option);
    });
}

async function loadDynamicData() {
    const urlBusca = `${GAS_ENDPOINT_URL}?action=getDynamicData`;
    const selectsToUpdate = ['vinculo-professor', 'vinculo-eletiva', 'registro-eletiva', 'mapa-eletiva-select'];

    selectsToUpdate.forEach(id => {
        const select = document.getElementById(id);
        if (select) select.innerHTML = '<option value="" disabled selected>⏳ Carregando dados...</option>';
    });

    try {
        const response = await fetch(urlBusca);
        const result = await response.json();

        if (result.status === 'success') {
            fillSelect('vinculo-professor', result.professores, 'Selecione o Professor');
            fillSelect('vinculo-eletiva', result.eletivas, 'Selecione a Eletiva');
            fillSelect('registro-eletiva', result.eletivas, 'Selecione a Eletiva');
            fillSelect('mapa-eletiva-select', result.eletivas, 'Selecione a Eletiva');
        } else {
            console.error('Erro ao buscar dados dinâmicos:', result.message);
            selectsToUpdate.forEach(id => {
                const select = document.getElementById(id);
                if (select) select.innerHTML = '<option value="" disabled selected>❌ Falha ao carregar</option>';
            });
        }
    } catch (error) {
        console.error('Falha na comunicação com o GAS (GET):', error);
        selectsToUpdate.forEach(id => {
            const select = document.getElementById(id);
            if (select) select.innerHTML = '<option value="" disabled selected>❌ Erro de rede</option>';
        });
    }
}

async function loadDynamicDataForMap() {
    await loadDynamicData();
}

// --- 5. Lógica da Aba "Mapa de Eletivas" ---
document.getElementById('btn-ver-mapa').addEventListener('click', async function() {
    const select = document.getElementById('mapa-eletiva-select');
    const eletiva = select ? select.value : '';
    const corpoTabela = document.querySelector('#mapa-alunos-table tbody');
    const messageElement = document.getElementById('mapa-message');

    if (!eletiva) {
        messageElement.style.color = 'red';
        messageElement.textContent = '❌ Por favor, selecione uma eletiva.';
        return;
    }

    showLoading(messageElement, `Buscando alunos para "${eletiva}"...`);
    corpoTabela.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';

    const urlBusca = `${GAS_ENDPOINT_URL}?action=getMapaEletiva&eletiva=${encodeURIComponent(eletiva)}`;

    try {
        const resposta = await fetch(urlBusca);
        const resultado = await resposta.json();

        corpoTabela.innerHTML = '';
        messageElement.textContent = '';

        if (resultado.status === 'success' && resultado.alunos && resultado.alunos.length > 0) {
            resultado.alunos.forEach(aluno => {
                const row = corpoTabela.insertRow();
                row.insertCell(0).textContent = aluno.matricula || 'N/A';
                row.insertCell(1).textContent = aluno.nome || 'N/A';
                row.insertCell(2).textContent = aluno.turmaOrigem || 'N/A';
                row.insertCell(3).textContent = aluno.professor || 'N/A';
                row.insertCell(4).textContent = ''; // nota
            });
            messageElement.style.color = 'green';
            messageElement.textContent = `✅ ${resultado.alunos.length} alunos encontrados na eletiva "${eletiva}".`;
        } else {
            corpoTabela.innerHTML = '<tr><td colspan="5">Nenhum aluno registrado ou dados incompletos.</td></tr>';
            messageElement.style.color = 'orange';
            messageElement.textContent = `⚠️ ${resultado.message || 'Nenhum aluno encontrado para a eletiva selecionada.'}`;
        }
    } catch (error) {
        messageElement.style.color = 'red';
        messageElement.textContent = '❌ Erro ao carregar o mapa. Verifique a conexão com o GAS.';
        corpoTabela.innerHTML = '<tr><td colspan="5">Erro de rede.</td></tr>';
    }
});

// Botão GERAR PDF PARA NOTAS
document.getElementById('btn-gerar-pdf').addEventListener('click', async function() {
    const select = document.getElementById('mapa-eletiva-select');
    const eletiva = select ? select.value : '';
    const messageElement = document.getElementById('mapa-message');

    if (!eletiva) {
        messageElement.style.color = 'red';
        messageElement.textContent = '❌ Selecione uma eletiva antes de gerar o PDF.';
        return;
    }

    showLoading(messageElement, 'Solicitando geração do PDF...');

    const urlPDF = `${GAS_ENDPOINT_URL}?action=generateMapaPDF&eletiva=${encodeURIComponent(eletiva)}`;

    try {
        const resposta = await fetch(urlPDF);
        const resultado = await resposta.json();

        if (resultado.status === 'success' && resultado.pdfUrl) {
            messageElement.style.color = 'green';
            messageElement.textContent = '✅ PDF gerado com sucesso! Abrindo em nova aba...';
            window.open(resultado.pdfUrl, '_blank');
        } else {
            messageElement.style.color = 'red';
            messageElement.textContent = `❌ Erro ao gerar PDF: ${resultado.message}`;
        }
    } catch (error) {
        messageElement.style.color = 'red';
        messageElement.textContent = '❌ Erro de comunicação ao gerar o PDF. Verifique o GAS.';
    }
});

/*


// script.js (Frontend Logic)

// ----------------------------------------------------------------------
// URL FINAL E CORRETA (Confirmada pela Implantação)
// ----------------------------------------------------------------------
const GAS_ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbwBIai5AvIrteYrmPlfD_EpTTJi00TWRR8pzzPch-J-45UePzKqIFXESUtZxH4EYncH/exec';

// --- 1. Controle de Abas e Visibilidade ---
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });
    const activeTab = document.getElementById(tabId);
    activeTab.style.display = 'block';
    activeTab.classList.add('active');

    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
    
    if (tabId === 'mapa-eletiva-tab') {
        loadDynamicDataForMap();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    showTab('aluno-tab'); 
    document.getElementById('username').value = 'monte';
    document.getElementById('password').value = '1234';
});


// --- 2. Login Simples (CORRIGIDO com .trim() e .toLowerCase()) ---
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const user = document.getElementById('username').value.trim(); 
    const pass = document.getElementById('password').value.trim(); 
    const message = document.getElementById('login-message');
    
    if (user.toLowerCase() === 'monte' && pass === '1234') {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-system').style.display = 'block';
        message.textContent = '';
        loadDynamicData(); 
        loadDynamicDataForMap(); 
    } else {
        message.style.color = 'red';
        message.textContent = '❌ Usuário ou senha inválidos.';
    }
});


// --- 3. Comunicação Centralizada com o GAS (CORREÇÃO DE FORMATO APLICADA) ---

function showLoading(messageElement) {
    messageElement.textContent = '⏳ Enviando dados...';
    messageElement.style.color = 'blue';
}

async function sendDataToGAS(action, formId, messageId) {
    const form = document.getElementById(formId);
    const messageElement = document.getElementById(messageId);
    
    showLoading(messageElement);

    const formData = new FormData(form);
    const params = new URLSearchParams(); 
    
    // Configura os parâmetros no formato esperado pelo Apps Script
    params.append('action', action);
    for (const [key, value] of formData.entries()) {
        params.append(key, value);
    }
    
    try {
        const response = await fetch(GAS_ENDPOINT_URL, {
            method: 'POST',
            body: params,
            headers: {
                // ESSENCIAL para que o Apps Script consiga ler o e.parameter
                'Content-Type': 'application/x-www-form-urlencoded' 
            }
        });

        // Tenta parsear o JSON para verificar a resposta do GAS
        let result;
        try {
            result = await response.json();
        } catch (jsonError) {
            if (response.ok) {
                // Sucesso na Planilha (HTTP 200), mas falha ao ler a resposta
                alert(`✅ Sucesso! Os dados foram salvos na Planilha, mas houve uma falha ao processar a resposta. (Favor verificar a Planilha)`);
                form.reset(); 
                loadDynamicData(); 
                loadDynamicDataForMap(); 
                return;
            } else {
                // Falha HTTP real
                throw new Error(`Resposta inválida do servidor. Status HTTP: ${response.status}`);
            }
        }
        
        // Verifica o status interno do Apps Script
        if (result.status === 'success') {
            messageElement.style.color = 'green';
            messageElement.textContent = `✅ ${result.message}`;
            form.reset(); 
            loadDynamicData(); 
            loadDynamicDataForMap();
        } else {
            messageElement.style.color = 'red';
            messageElement.textContent = `❌ Erro do Servidor: ${result.message}`;
        }
    } catch (error) {
        console.error('Erro de Processamento/Conexão:', error);
        messageElement.style.color = 'red';
        messageElement.textContent = `❌ Erro de conexão com o servidor. Detalhe: ${error.message}.`;
    }
}

// Vinculação de Formulários (event listeners)
document.getElementById('form-aluno').addEventListener('submit', (e) => {
    e.preventDefault();
    sendDataToGAS('cadastrarAluno', 'form-aluno', 'aluno-message');
});

document.getElementById('form-professor').addEventListener('submit', (e) => {
    e.preventDefault();
    sendDataToGAS('cadastrarProfessor', 'form-professor', 'professor-message');
});

document.getElementById('form-eletiva').addEventListener('submit', (e) => {
    e.preventDefault();
    sendDataToGAS('cadastrarEletiva', 'form-eletiva', 'eletiva-message');
});

document.getElementById('form-vincular-professor').addEventListener('submit', (e) => {
    e.preventDefault();
    sendDataToGAS('vincularProfessor', 'form-vincular-professor', 'vinculo-professor-message');
});

document.getElementById('form-registrar-aluno').addEventListener('submit', (e) => {
    e.preventDefault();
    sendDataToGAS('registrarAluno', 'form-registrar-aluno', 'registro-aluno-message');
});


// --- 4. Carregamento de Dados Dinâmicos ---
function fillSelect(selectId, optionsArray) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="" disabled selected>Selecione...</option>'; 
    optionsArray.forEach(item => {
        const option = document.createElement('option');
        option.value = item.nome; 
        option.textContent = item.nome;
        select.appendChild(option);
    });
}

async function loadDynamicData() {
    const urlBusca = `${GAS_ENDPOINT_URL}?action=getDynamicData`;
    try {
        const response = await fetch(urlBusca);
        const result = await response.json();
        if (result.status === 'success') {
            fillSelect('vinculo-professor', result.professores); 
            fillSelect('vinculo-eletiva', result.eletivas); 
            fillSelect('registro-eletiva', result.eletivas);
        }
    } catch (error) {
        console.error('Falha ao carregar dados dinâmicos:', error);
    }
}

async function loadDynamicDataForMap() {
    const urlBusca = `${GAS_ENDPOINT_URL}?action=getDynamicData`;
    try {
        const response = await fetch(urlBusca);
        const result = await response.json();
        if (result.status === 'success') {
            fillSelect('mapa-eletiva-select', result.eletivas); 
        }
    } catch (error) {
        console.error('Falha ao carregar eletivas para o mapa:', error);
    }
}

// --- 5. Lógica da Aba "Mapa de Eletivas" ---
document.getElementById('btn-ver-mapa').addEventListener('click', async function() {
    const eletiva = document.getElementById('mapa-eletiva-select').value;
    const corpoTabela = document.querySelector('#mapa-alunos-table tbody');
    const messageElement = document.getElementById('mapa-message');

    if (!eletiva) {
        messageElement.style.color = 'red';
        messageElement.textContent = '❌ Por favor, selecione uma eletiva.';
        return;
    }

    messageElement.textContent = `⏳ Buscando alunos para "${eletiva}"...`;
    corpoTabela.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';

    const urlBusca = `${GAS_ENDPOINT_URL}?action=getMapaEletiva&eletiva=${encodeURIComponent(eletiva)}`;

    try {
        const resposta = await fetch(urlBusca);
        const resultado = await resposta.json();

        corpoTabela.innerHTML = ''; 
        messageElement.textContent = '';
        
        if (resultado.status === 'success' && resultado.alunos && resultado.alunos.length > 0) {
            resultado.alunos.forEach(aluno => {
                const row = corpoTabela.insertRow();
                row.insertCell(0).textContent = aluno.matricula || 'N/A';
                row.insertCell(1).textContent = aluno.nome || 'N/A';
                row.insertCell(2).textContent = aluno.turmaOrigem || 'N/A';
                row.insertCell(3).textContent = aluno.professor || 'N/A';
                row.insertCell(4).textContent = ''; 
            });
            messageElement.style.color = 'green';
            messageElement.textContent = `✅ ${resultado.alunos.length} alunos encontrados na eletiva "${eletiva}".`;

        } else {
            corpoTabela.innerHTML = '<tr><td colspan="5">Nenhum aluno registrado ou dados incompletos.</td></tr>';
            messageElement.style.color = 'orange';
            messageElement.textContent = `⚠️ ${resultado.message || 'Nenhum aluno encontrado para a eletiva selecionada.'}`;
        }

    } catch (error) {
        messageElement.style.color = 'red';
        messageElement.textContent = '❌ Erro ao carregar o mapa. Verifique a conexão com o GAS.';
        corpoTabela.innerHTML = '<tr><td colspan="5">Erro de rede.</td></tr>';
    }
});

// Botão GERAR PDF PARA NOTAS
document.getElementById('btn-gerar-pdf').addEventListener('click', async function() {
    const eletiva = document.getElementById('mapa-eletiva-select').value;
    const messageElement = document.getElementById('mapa-message');

    if (!eletiva) {
        messageElement.style.color = 'red';
        messageElement.textContent = '❌ Selecione uma eletiva antes de gerar o PDF.';
        return;
    }

    messageElement.textContent = '⏳ Solicitando geração do PDF... Aguarde.';
    
    const urlPDF = `${GAS_ENDPOINT_URL}?action=generateMapaPDF&eletiva=${encodeURIComponent(eletiva)}`;

    try {
        const resposta = await fetch(urlPDF);
        const resultado = await resposta.json();

        if (resultado.status === 'success' && resultado.pdfUrl) {
            messageElement.style.color = 'green';
            messageElement.textContent = '✅ PDF gerado com sucesso! Abrindo em nova aba...';
            window.open(resultado.pdfUrl, '_blank');
        } else {
            messageElement.style.color = 'red';
            messageElement.textContent = `❌ Erro ao gerar PDF: ${resultado.message}`;
        }
    } catch (error) {
        messageElement.style.color = 'red';
        messageElement.textContent = '❌ Erro de comunicação ao gerar o PDF. Verifique o GAS.';
    }
});

*/

