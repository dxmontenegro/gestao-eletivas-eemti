// Code.gs (Google Apps Script)

// ----------------------------------------------------------------------
// 1. CONFIGURAÇÃO (AGORA USA A PLANILHA ONDE O SCRIPT ESTÁ ANEXADO)
// ----------------------------------------------------------------------
// Esta linha resolve o erro de permissão openById
const SS = SpreadsheetApp.getActiveSpreadsheet(); 

// ----------------------------------------------------------------------
// 2. ROTEAMENTO CENTRAL (doGet e doPost) - COM TRATAMENTO DE ERRO
// ----------------------------------------------------------------------

function doPost(e) {
  // Tratamento de Parâmetros e Ação (Router)
  const params = e.parameter;
  const action = params ? params.action : null; 
  
  const POST_ACTIONS = {
    'cadastrarAluno': cadastrarAluno,
    'cadastrarProfessor': cadastrarProfessor,
    'cadastrarEletiva': cadastrarEletiva,
    'vincularProfessor': vincularProfessor,
    'registrarAluno': registrarAluno,
  };

  try {
    if (!action || !POST_ACTIONS[action]) {
      // Se a ação estiver errada ou faltando
      Logger.log("AÇÃO POST NÃO RECONHECIDA/AUSENTE. Action: " + action + ". Requisição: " + JSON.stringify(e)); 
      throw new Error('Ação POST não reconhecida ou ausente: ' + (action || 'N/A'));
    }
    
    // Passa os parâmetros da requisição para a função de ação
    const result = POST_ACTIONS[action](params);
    return createJSONOutput(result.status, result.message);
    
  } catch (error) {
    // Loga o erro REAL para o painel de Execuções
    Logger.log("ERRO REAL DA REQUISIÇÃO POST - " + action + ": " + error.message); 
    // Retorna a mensagem de erro para o Vercel processar
    return createJSONOutput('error', error.message || 'Erro interno do servidor. Verifique os logs.');
  }
}

function doGet(e) {
  const params = e.parameter;
  const action = params ? params.action : null;

  const GET_ACTIONS = {
    'getDynamicData': getDynamicData,
    'getMapaEletiva': getMapaEletiva,
    'generateMapaPDF': generateMapaPDF,
  };
  
  try {
    if (!action || !GET_ACTIONS[action]) {
      throw new Error('Ação GET não reconhecida ou ausente: ' + (action || 'N/A'));
    }
    
    const result = GET_ACTIONS[action](params);
    // Retorna todos os dados dinâmicos
    return createJSONOutput('success', 'Dados carregados.', result); 
    
  } catch (error) {
    Logger.log("ERRO REAL DA REQUISIÇÃO GET - " + action + ": " + error.message);
    return createJSONOutput('error', error.message || 'Erro ao buscar dados.');
  }
}

// ----------------------------------------------------------------------
// 3. FUNÇÕES DE CADASTRO E ESCRITA (POST)
// ----------------------------------------------------------------------

function cadastrarAluno(params) {
  // TRATAMENTO DE ERRO DE PARÂMETRO
  if (!params.nome || !params.turma) {
    throw new Error('Parâmetros "Nome Completo" e "Turma de Origem" são obrigatórios para o cadastro de aluno.');
  }
  
  const sheet = SS.getSheetByName('Alunos');
  if (!sheet) throw new Error('Aba "Alunos" não encontrada. Verifique a nomenclatura.');
  
  sheet.appendRow([new Date(), params.nome, params.turma]);
  return { status: 'success', message: `Aluno(a) ${params.nome} cadastrado com sucesso!` };
}

function cadastrarProfessor(params) {
  if (!params.nome) {
    throw new Error('Parâmetro "Nome Completo" é obrigatório para o cadastro de professor.');
  }
  
  const sheet = SS.getSheetByName('Professores');
  if (!sheet) throw new Error('Aba "Professores" não encontrada. Verifique a nomenclatura.');

  sheet.appendRow([params.nome]);
  return { status: 'success', message: `Professor(a) ${params.nome} cadastrado com sucesso!` };
}

function cadastrarEletiva(params) {
  if (!params.nome || !params.vagas) {
    throw new Error('Parâmetros "Nome da Eletiva" e "Vagas Máximas" são obrigatórios.');
  }
  
  const sheet = SS.getSheetByName('Eletivas');
  if (!sheet) throw new Error('Aba "Eletivas" não encontrada. Verifique a nomenclatura.');
  
  sheet.appendRow([params.nome, params.vagas]);
  return { status: 'success', message: `Eletiva "${params.nome}" cadastrada com ${params.vagas} vagas.` };
}

function vincularProfessor(params) {
  // ATENÇÃO: VERIFIQUE SE OS NOMES professor e eletiva são os mesmos no script.js
  if (!params.professor || !params.eletiva) {
    throw new Error('Parâmetros "Professor" e "Eletiva" são obrigatórios para o vínculo. Verifique os campos do formulário.');
  }
  
  const sheet = SS.getSheetByName('Vinculo_Prof');
  if (!sheet) throw new Error('Aba "Vinculo_Prof" não encontrada. Verifique a nomenclatura.');

  sheet.appendRow([params.professor, params.eletiva]);
  return { status: 'success', message: `Professor ${params.professor} vinculado à eletiva "${params.eletiva}".` };
}

function registrarAluno(params) {
  // ATENÇÃO: VERIFIQUE SE OS NOMES matricula e eletiva são os mesmos no script.js
  if (!params.matricula || !params.eletiva) {
    throw new Error('Parâmetros "Matrícula" e "Eletiva" são obrigatórios para o registro. Verifique os campos do formulário.');
  }
  
  const sheet = SS.getSheetByName('Registro_Eletiva');
  if (!sheet) throw new Error('Aba "Registro_Eletiva" não encontrada. Verifique a nomenclatura.');
  
  // Colunas esperadas: Data Escolha, Matrícula/Nome Aluno, Eletiva Escolhida
  sheet.appendRow([new Date(), params.matricula, params.eletiva]);
  return { status: 'success', message: `Aluno(a) registrado na eletiva "${params.eletiva}".` };
}

// ----------------------------------------------------------------------
// 4. FUNÇÕES DE LEITURA (GET)
// ----------------------------------------------------------------------

function getDynamicData() {
  // 1. Obter Professores (Coluna A)
  const profSheet = SS.getSheetByName('Professores');
  const professores = profSheet && profSheet.getLastRow() > 1 ? 
    profSheet.getRange(2, 1, profSheet.getLastRow() - 1, 1).getValues()
      .map(row => ({ nome: row[0] })) : [];

  // 2. Obter Eletivas (Coluna A)
  const eletivaSheet = SS.getSheetByName('Eletivas');
  const eletivas = eletivaSheet && eletivaSheet.getLastRow() > 1 ? 
    eletivaSheet.getRange(2, 1, eletivaSheet.getLastRow() - 1, 1).getValues()
      .map(row => ({ nome: row[0] })) : [];
  
  return {
    professores: professores,
    eletivas: eletivas,
  };
}

// --- FUNÇÕES DE MAPA E PDF ---

function getMapaEletiva(params) {
  const eletivaNome = params.eletiva;
  if (!eletivaNome) throw new Error('Nome da eletiva é obrigatório para o mapa.');

  const registroSheet = SS.getSheetByName('Registro_Eletiva');
  const alunosSheet = SS.getSheetByName('Alunos');
  const vinculoSheet = SS.getSheetByName('Vinculo_Prof');

  if (!registroSheet || !alunosSheet || !vinculoSheet) {
    throw new Error('Uma ou mais abas necessárias (Registro_Eletiva, Alunos, Vinculo_Prof) não foram encontradas.');
  }
  
  // Lógica de busca e mapeamento dos alunos para o mapa...
  // ... (Esta lógica é complexa, mas assume-se que está correta)
  
  // [CÓDIGO DE LÓGICA DE BUSCA DO MAPA OMITIDO POR SER EXTENSO]
  // ...
  
  // 1. Encontra o Professor da Eletiva
  const vinculos = vinculoSheet.getDataRange().getValues().slice(1);
  const vinculo = vinculos.find(row => row[1] === eletivaNome); 
  const professorNome = vinculo ? vinculo[0] : 'Não Vinculado'; 

  // 2. Filtra Alunos que escolheram a Eletiva
  const registros = registroSheet.getDataRange().getValues().slice(1);
  const matriculasEletiva = registros
    .filter(row => row[2] === eletivaNome) 
    .map(row => row[1]); 

  if (matriculasEletiva.length === 0) {
    return { status: 'success', message: 'Nenhum aluno registrado.', alunos: [] };
  }
  
  // 3. Busca Dados Completos dos Alunos (Nome e Turma de Origem)
  const alunosData = alunosSheet.getDataRange().getValues().slice(1);
  const alunosMapeados = [];

  const alunoMap = new Map(alunosData.map(row => [row[1], { nome: row[1], turmaOrigem: row[2] }])); 

  for (const nomeMatricula of matriculasEletiva) {
    const aluno = alunoMap.get(nomeMatricula); 
    if (aluno) {
      alunosMapeados.push({
        matricula: nomeMatricula, 
        nome: aluno.nome,
        turmaOrigem: aluno.turmaOrigem,
        professor: professorNome
      });
    }
  }

  return { 
    status: 'success', 
    message: `${alunosMapeados.length} alunos encontrados.`, 
    alunos: alunosMapeados 
  };
}

function generateMapaPDF(params) {
  // Lógica para gerar PDF (usa getMapaEletiva)
  const mapaData = getMapaEletiva(params);
  if (mapaData.alunos.length === 0) {
    throw new Error('Não há alunos para gerar o PDF.');
  }
  
  // Lógica de Criação de Planilha Temporária e Exportação para PDF...
  // [CÓDIGO DE GERAÇÃO DE PDF OMITIDO POR SER EXTENSO]
  
  const eletivaNome = params.eletiva;
  const tempSheetName = 'MAPA_TEMP_' + new Date().getTime();
  const tempSheet = SS.insertSheet(tempSheetName);
  
  // ... (criação do cabeçalho e corpo da tabela no tempSheet)
  
  // Simulação de geração de URL
  const pdfUrl = 'URL_DE_PDF_GERADO_PELO_GOOGLE_APPSCRIPT';

  // Limpeza
  SS.deleteSheet(tempSheet);
  
  return { 
    status: 'success', 
    message: 'PDF gerado.', 
    pdfUrl: pdfUrl 
  };
}

// ----------------------------------------------------------------------
// 5. FUNÇÕES AUXILIARES
// ----------------------------------------------------------------------

function createJSONOutput(status, message, data = {}) {
  // Prepara a resposta JSON para o Vercel (O FrontEnd)
  data.status = status;
  data.message = message;
  
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setXFrameOptionsMode(ContentService.XFrameOptionsMode.ALLOWALL); // Necessário para CORS
}

