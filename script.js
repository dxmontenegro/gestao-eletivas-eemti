// =======================================================
//  SISTEMA ESCOLAR — VERSÃO FIRESTORE (SEM APPS SCRIPT)
// =======================================================

// Firestore já foi inicializado no index.html
// Aqui usamos a referência global "db"

// =============================================
// 1. Controle de Abas
// =============================================
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
}

document.addEventListener('DOMContentLoaded', () => {
    showTab('aluno-tab');
    document.getElementById('username').value = 'monte';
    document.getElementById('password').value = '1234';
    loadDynamicData(); 
});

// =============================================
// 2. Login (simples)
// =============================================
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();

    if (
        document.getElementById('username').value === "monte" &&
        document.getElementById('password').value === "1234"
    ) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-system').style.display = 'block';
        loadDynamicData();
    } else {
        document.getElementById('login-message').textContent = "Usuário ou senha incorretos.";
    }
});

// =============================================
// 3. CADASTRAR ALUNO (Firestore)
// =============================================
document.getElementById('form-aluno').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('aluno-message');

    const nome = e.target.nome.value;
    const turma = e.target.turma.value;
    const matricula = Date.now().toString(); // ID único automático

    await db.collection('alunos').doc(matricula).set({
        nome,
        turma,
        data: new Date()
    });

    msg.textContent = "Aluno cadastrado!";
    msg.style.color = "green";
    e.target.reset();
});

// =============================================
// 4. CADASTRAR PROFESSOR
// =============================================
document.getElementById('form-professor').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('professor-message');

    const nome = e.target.nome.value;

    await db.collection('professores').doc(nome).set({
        nome,
        eletiva: null
    });

    msg.textContent = "Professor cadastrado!";
    msg.style.color = "green";
    e.target.reset();
    loadDynamicData();
});

// =============================================
// 5. CADASTRAR ELETIVA
// =============================================
document.getElementById('form-eletiva').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('eletiva-message');

    const nome = e.target.nome.value;
    const vagas = Number(e.target.vagas.value);

    await db.collection('eletivas').doc(nome).set({
        nome,
        vagas,
        professor: null
    });

    msg.textContent = "Eletiva cadastrada!";
    msg.style.color = "green";
    e.target.reset();
    loadDynamicData();
});

// =============================================
// 6. VINCULAR PROFESSOR → ELETIVA
// =============================================
document.getElementById('form-vincular-professor').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('vinculo-professor-message');

    const professor = e.target.professor.value;
    const eletiva = e.target.eletiva.value;

    // professor recebe essa eletiva
    await db.collection('professores').doc(professor).update({
        eletiva
    });

    // eletiva recebe esse professor
    await db.collection('eletivas').doc(eletiva).update({
        professor
    });

    msg.textContent = "Vínculo estabelecido!";
    msg.style.color = "green";
    loadDynamicData();
});

// =============================================
// 7. REGISTRAR ALUNO NA ELETIVA
// =============================================
document.getElementById('form-registrar-aluno').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('registro-aluno-message');

    const matricula = e.target.matricula.value;
    const eletiva = e.target.eletiva.value;

    await db.collection('registro').add({
        matricula,
        eletiva,
        data: new Date()
    });

    msg.textContent = "Aluno registrado!";
    msg.style.color = "green";
    e.target.reset();
});

// =============================================
// 8. CARREGAR LISTAS DINÂMICAS
// =============================================
async function loadDynamicData() {
    const profSnap = await db.collection('professores').get();
    const eletivaSnap = await db.collection('eletivas').get();

    // preencher selects
    fillSelect("vinculo-professor", profSnap.docs.map(d => d.data().nome));
    fillSelect("vinculo-eletiva", eletivaSnap.docs.map(d => d.data().nome));
    fillSelect("registro-eletiva", eletivaSnap.docs.map(d => d.data().nome));
    fillSelect("mapa-eletiva-select", eletivaSnap.docs.map(d => d.data().nome));
}

function fillSelect(selectId, array) {
    const s = document.getElementById(selectId);
    s.innerHTML = '<option disabled selected>Selecione...</option>';

    array.forEach(item => {
        const op = document.createElement("option");
        op.value = item;
        op.textContent = item;
        s.appendChild(op);
    });
}

// =============================================
// 9. VER MAPA DA ELETIVA
// =============================================
document.getElementById('btn-ver-mapa').addEventListener('click', async () => {
    const eletiva = document.getElementById("mapa-eletiva-select").value;
    const msg = document.getElementById("mapa-message");
    const tbody = document.querySelector("#mapa-alunos-table tbody");

    if (!eletiva) {
        msg.textContent = "Selecione uma eletiva.";
        msg.style.color = "red";
        return;
    }

    tbody.innerHTML = "<tr><td colspan='5'>Carregando...</td></tr>";

    // busca registros
    const registros = await db.collection("registro")
        .where("eletiva", "==", eletiva)
        .get();

    tbody.innerHTML = "";

    if (registros.empty) {
        msg.textContent = "Nenhum aluno registrado.";
        msg.style.color = "orange";
        return;
    }

    // busca professor
    const professorDoc = await db.collection("eletivas").doc(eletiva).get();
    const professor = professorDoc.data().professor || "Não vinculado";

    msg.textContent = "Mapa carregado!";
    msg.style.color = "green";

    for (let doc of registros.docs) {
        const r = doc.data();

        // pega aluno
        const alunoDoc = await db.collection("alunos").doc(r.matricula).get();
        if (!alunoDoc.exists) continue;
        const a = alunoDoc.data();

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${r.matricula}</td>
            <td>${a.nome}</td>
            <td>${a.turma}</td>
            <td>${professor}</td>
            <td></td>
        `;
        tbody.appendChild(tr);
    }
});

// =============================================
// 10. GERAR PDF (SEM APPS SCRIPT)
// =============================================
document.getElementById("btn-gerar-pdf").addEventListener("click", () => {
    window.print(); // usa o próprio navegador!
});




// ... (Restante das funções: btn-ver-mapa, btn-gerar-pdf) ...


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
















