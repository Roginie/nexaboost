/* ============================================================
   NexaBoost — Otimização de PC para jogos
   Reconhecimento de padrões de hardware (GPU/CPU) + base de
   recomendações, filtrada e priorizada por regras condicionais.
   HTML + CSS + JS puro · roda direto no navegador, sem servidor.
   ============================================================ */

// ── RECONHECIMENTO DE GPU (texto livre → tier 0-4) ────────────
const GPU_TIERS = [
  { tier: 4, re: /rtx\s?50(80|90)|rtx\s?40(80|90)|rtx\s?a?6000|titan|rx\s?79(00|50)|rx\s?9070\s?xt|radeon\s?vii/i },
  { tier: 3, re: /rtx\s?50(60|70)|rtx\s?40(60|70)|rtx\s?30(70|80|90)|rx\s?77(00)|rx\s?68(00)|rx\s?90(60|70)|arc\s?b580/i },
  { tier: 2, re: /rtx\s?50(50)|rtx\s?40(50)|rtx\s?30(50|60)|rtx\s?20(60|70|80)|gtx\s?16(60)|rx\s?66(00|50)|rx\s?76(00)|rx\s?58(0)?0|rx\s?57(0)?0|arc\s?a7\d\d/i },
  { tier: 1, re: /gtx\s?10(50|60)|gtx\s?16(30|50)|rx\s?55(0)?0|rx\s?64(00|500)|mx\s?(150|250|350|450|550)|arc\s?a3\d\d/i },
  { tier: 0, re: /uhd|iris|vega\s?\d\s?integrada|radeon\s?graphics|placa\s?integrada|sem\s?placa|nenhuma/i },
];

function tierPorTexto(texto, tiers) {
  const t = (texto || '').toLowerCase();
  for (const item of tiers) if (item.re.test(t)) return item.tier;
  return null;
}

function tierGPU(texto) {
  const direto = tierPorTexto(texto, GPU_TIERS);
  if (direto !== null) return direto;
  const t = (texto || '').toLowerCase();
  if (!t.trim()) return null;
  if (t.includes('rtx')) return 2;
  if (t.includes('gtx')) return 1;
  if (t.includes('radeon') || t.includes('rx')) return 2;
  if (t.includes('intel')) return 0;
  return null; // não reconhecido
}

// ── RECONHECIMENTO DE CPU (texto livre → tier 0-4) ────────────
const CPU_TIERS = [
  { tier: 4, re: /i9|ryzen\s?9|threadripper|xeon\s?w/i },
  { tier: 3, re: /i7|ryzen\s?7/i },
  { tier: 2, re: /i5|ryzen\s?5/i },
  { tier: 1, re: /i3|ryzen\s?3|celeron|pentium|athlon/i },
];

function tierCPU(texto, nucleos) {
  const direto = tierPorTexto(texto, CPU_TIERS);
  if (direto !== null) return direto;
  if (nucleos) {
    if (nucleos <= 4) return 1;
    if (nucleos <= 6) return 2;
    if (nucleos <= 8) return 3;
    return 4;
  }
  return 2; // desconhecido → assume médio, neutro
}

const RAM_TIER = { '4': 0, '8': 1, '16': 2, '32': 3, '64': 4 };

// ── DETECÇÃO DO TIPO DE JOGO (texto livre) ────────────────────
const JOGOS_ONLINE = ['valorant', 'counter-strike', 'counter strike', 'cs2', 'csgo', 'cs:go',
  'league of legends', ' lol', 'fortnite', 'apex', 'free fire', 'freefire', 'call of duty',
  'warzone', 'overwatch', 'rainbow six', ' r6', 'rocket league', 'dota'];
const JOGOS_GRAFICOS = ['cyberpunk', 'gta', 'grand theft auto', 'red dead', 'rdr2', 'elden ring',
  'hogwarts', 'alan wake', 'horizon', 'god of war', 'far cry', "assassin's creed", 'assassins creed',
  'witcher', 'starfield', 'black myth'];

function tipoDeJogo(texto) {
  if (!texto || !texto.trim()) return null;
  const t = ' ' + texto.toLowerCase() + ' ';
  if (JOGOS_ONLINE.some(k => t.includes(k))) return 'online';
  if (JOGOS_GRAFICOS.some(k => t.includes(k))) return 'grafico';
  return 'generico';
}

// ── NÍVEL DA MÁQUINA ──────────────────────────────────────────
function calcularNivel(gpuTier, cpuTier, ramTier) {
  const score = gpuTier * 0.45 + cpuTier * 0.30 + ramTier * 0.25;
  if (score < 1) return { nome: 'Entrada', score, desc: 'Sua máquina roda jogos, mas precisa de ajustes finos pra ficar fluida. O plano abaixo prioriza o que traz mais FPS de graça.' };
  if (score < 2) return { nome: 'Intermediário', score, desc: 'PC equilibrado — dá pra jogar bem a maioria dos títulos com alguns ajustes de configuração.' };
  if (score < 3) return { nome: 'Alto desempenho', score, desc: 'Máquina forte. O foco aqui é eliminar gargalos escondidos e liberar todo o potencial que ela já tem.' };
  return { nome: 'Enthusiast', score, desc: 'PC de ponta. As dicas abaixo são mais sobre refinamento (latência, qualidade visual) do que sobre ganhar FPS.' };
}

// ── BASE DE CONHECIMENTO (regras de recomendação) ─────────────
// condicao(s) recebe o objeto de specs processado e devolve true/false.
const BASE_CONHECIMENTO = [
  // Windows & energia
  { categoria: 'Windows & energia', dificuldade: 'fácil', impacto: 'alto',
    titulo: 'Ativar o plano de energia "Alto desempenho"',
    desc: 'Em Configurações > Sistema > Energia, troque o plano de energia para "Alto desempenho" ou "Melhor desempenho". Em notebooks, mantenha na tomada ao jogar.',
    condicao: () => true },
  { categoria: 'Windows & energia', dificuldade: 'fácil', impacto: 'médio',
    titulo: 'Ativar o Modo de Jogo do Windows',
    desc: 'Em Configurações > Jogos > Modo de Jogo, ative a opção. Isso evita que o Windows Update e notificações atrapalhem o desempenho durante a partida.',
    condicao: () => true },
  { categoria: 'Windows & energia', dificuldade: 'fácil', impacto: 'médio',
    titulo: 'Reduzir efeitos visuais do Windows',
    desc: 'Em "Ajustar a aparência e o desempenho do Windows" (pesquise no menu Iniciar), marque "Ajustar para obter um melhor desempenho". Libera RAM e processamento de vídeo.',
    condicao: s => s.gpuTier <= 1 || s.ramTier <= 1 },
  { categoria: 'Windows & energia', dificuldade: 'médio', impacto: 'médio',
    titulo: 'Ativar "GPU agendada por hardware"',
    desc: 'Em Configurações > Sistema > Tela > Gráficos, ative essa opção. Reduz a latência entre CPU e GPU em placas mais recentes.',
    condicao: s => s.gpuTier >= 1 },
  { categoria: 'Windows & energia', dificuldade: 'fácil', impacto: 'baixo',
    titulo: 'Manter o Windows e o BIOS/chipset atualizados',
    desc: 'Atualizações do sistema costumam trazer correções de desempenho e compatibilidade que passam despercebidas.',
    condicao: () => true },

  // Drivers e software
  { categoria: 'Drivers e software', dificuldade: 'fácil', impacto: 'alto',
    titulo: 'Atualizar o driver da placa de vídeo',
    desc: 'Baixe direto do site do fabricante (NVIDIA, AMD ou Intel) — não confie só no Windows Update. Drivers novos costumam trazer ganhos de FPS específicos por jogo.',
    condicao: () => true },
  { categoria: 'Drivers e software', dificuldade: 'médio', impacto: 'médio',
    titulo: 'Instalar DirectX e Visual C++ Redistributables atualizados',
    desc: 'Muitos travamentos e erros de inicialização em jogos vêm de bibliotecas desatualizadas. O "DirectX End-User Runtime" resolve boa parte deles.',
    condicao: () => true },
  { categoria: 'Drivers e software', dificuldade: 'fácil', impacto: 'médio',
    titulo: 'Fechar overlays desnecessários durante o jogo',
    desc: 'Discord, GeForce Experience, Xbox Game Bar e afins consomem GPU/CPU em segundo plano só para desenhar o overlay. Desative os que você não usa.',
    condicao: () => true },
  { categoria: 'Drivers e software', dificuldade: 'médio', impacto: 'baixo',
    titulo: 'Configurar exceção do antivírus para a pasta do jogo',
    desc: 'Antivírus de terceiros que escaneiam arquivos em tempo real podem causar engasgos ao carregar texturas. Adicione a pasta do jogo como exceção (mantenha a proteção geral ativa).',
    condicao: s => s.cpuTier <= 1 },

  // Processos em segundo plano
  { categoria: 'Processos em segundo plano', dificuldade: 'fácil', impacto: 'alto',
    titulo: 'Desativar programas de inicialização desnecessários',
    desc: 'Abra o Gerenciador de Tarefas (Ctrl+Shift+Esc) > aba Inicialização, e desative tudo que não precisa abrir junto com o Windows. Menos processos disputando RAM e CPU.',
    condicao: s => s.ramTier <= 1 || s.cpuTier <= 1 },
  { categoria: 'Processos em segundo plano', dificuldade: 'fácil', impacto: 'médio',
    titulo: 'Fechar navegador e outros apps pesados antes de jogar',
    desc: 'Um navegador com muitas abas abertas pode consumir vários GB de RAM sozinho — isso rouba memória que o jogo poderia usar.',
    condicao: s => s.ramTier <= 2 },
  { categoria: 'Processos em segundo plano', dificuldade: 'fácil', impacto: 'alto',
    titulo: 'Pausar downloads e atualizações em segundo plano',
    desc: 'Steam, Windows Update, OneDrive e afins competindo por disco e rede causam engasgos (stutter) mesmo em PCs fortes. Pause tudo antes de jogar.',
    condicao: () => true },
  { categoria: 'Processos em segundo plano', dificuldade: 'fácil', impacto: 'médio',
    titulo: 'Desativar apps de gravação/streaming quando não estiver usando',
    desc: 'OBS, ShadowPlay e overlays de gravação ficam consumindo GPU mesmo parados, se abertos em segundo plano.',
    condicao: () => true },

  // Armazenamento
  { categoria: 'Armazenamento', dificuldade: 'avançado', impacto: 'alto',
    titulo: 'Mover o jogo para um SSD',
    desc: 'Jogos em HD tradicional (HDD) sofrem com carregamentos longos e engasgos ao carregar novas áreas do mapa. Se puder, mova (ou reinstale) o jogo num SSD — a diferença é enorme.',
    condicao: s => s.storage === 'hdd' },
  { categoria: 'Armazenamento', dificuldade: 'fácil', impacto: 'médio',
    titulo: 'Manter pelo menos 15-20% de espaço livre em disco',
    desc: 'Discos quase cheios (especialmente SSDs) ficam mais lentos para gravar arquivos temporários e podem causar engasgos.',
    condicao: () => true },
  { categoria: 'Armazenamento', dificuldade: 'avançado', impacto: 'baixo',
    titulo: 'Confirmar que o TRIM está ativo no SSD',
    desc: 'Abra o Prompt de Comando como administrador e rode: fsutil behavior query DisableDeleteNotify — se o resultado for 0, o TRIM já está ativo (bom sinal).',
    condicao: s => s.storage === 'ssd' || s.storage === 'nvme' },
  { categoria: 'Armazenamento', dificuldade: 'médio', impacto: 'médio',
    titulo: 'Desfragmentar o HD tradicional periodicamente',
    desc: 'Se o jogo está no HDD, desfragmentar de vez em quando ajuda a reduzir os tempos de carregamento. Atenção: nunca desfragmente um SSD/NVMe, isso só desgasta ele à toa.',
    condicao: s => s.storage === 'hdd' },

  // Configurações gráficas do jogo
  { categoria: 'Configurações gráficas do jogo', dificuldade: 'fácil', impacto: 'alto',
    titulo: 'Baixar texturas, sombras e reflexos para Baixo/Médio',
    desc: 'Nessas configurações, sombras dinâmicas e reflexos em tempo real custam muito FPS pra pouco ganho visual perceptível durante o jogo.',
    condicao: s => s.gpuTier <= 1 },
  { categoria: 'Configurações gráficas do jogo', dificuldade: 'fácil', impacto: 'alto',
    titulo: 'Desligar Ray Tracing',
    desc: 'Ray Tracing custa muito desempenho para a sua GPU atual. Deixe desligado a menos que o objetivo seja só apreciar os gráficos parado.',
    condicao: s => s.gpuTier <= 2 && s.objetivo !== 'grafico' },
  { categoria: 'Configurações gráficas do jogo', dificuldade: 'fácil', impacto: 'alto',
    titulo: 'Ativar upscaling (DLSS, FSR ou XeSS) no modo Desempenho',
    desc: 'Se o jogo suportar, o upscaling gera a imagem numa resolução menor e usa IA para reconstruir os detalhes — ganho grande de FPS com perda visual pequena.',
    condicao: s => s.gpuTier <= 2 },
  { categoria: 'Configurações gráficas do jogo', dificuldade: 'fácil', impacto: 'médio',
    titulo: 'Texturas em Alto, o resto em Médio',
    desc: 'Texturas consomem principalmente memória de vídeo (VRAM), não poder de processamento — geralmente dá pra deixar em Alto sem perder muito FPS, mesmo numa GPU intermediária.',
    condicao: s => s.gpuTier === 2 || s.gpuTier === 3 },
  { categoria: 'Configurações gráficas do jogo', dificuldade: 'fácil', impacto: 'baixo',
    titulo: 'Pode ativar Ray Tracing e Ultra em quase tudo',
    desc: 'Sua GPU aguenta os efeitos mais pesados. Se o objetivo é FPS máximo em competitivo, ainda vale considerar baixar sombras — o resto pode ficar no talo.',
    condicao: s => s.gpuTier >= 3 },
  { categoria: 'Configurações gráficas do jogo', dificuldade: 'fácil', impacto: 'médio',
    titulo: 'Desligar V-Sync e usar um limitador de FPS',
    desc: 'V-Sync tradicional adiciona latência (input lag). Prefira limitar o FPS um pouco abaixo da taxa de atualização do monitor (nas configurações do jogo ou no painel da GPU).',
    condicao: s => s.objetivo === 'fps' },
  { categoria: 'Configurações gráficas do jogo', dificuldade: 'fácil', impacto: 'baixo',
    titulo: 'Desligar motion blur, depth of field e film grain',
    desc: 'Esses efeitos consomem desempenho e, para quem busca reação rápida, atrapalham mais do que ajudam.',
    condicao: s => s.objetivo === 'fps' },
  { categoria: 'Configurações gráficas do jogo', dificuldade: 'médio', impacto: 'alto',
    titulo: 'Priorize Iluminação e Texturas sobre Sombra e Densidade de multidão/vegetação',
    desc: 'Em jogos mundo-aberto pesados, sombra e densidade de população/vegetação costumam custar muito FPS para um ganho visual pequeno comparado à iluminação e às texturas.',
    condicao: s => s.jogoTipo === 'grafico' },

  // Rede
  { categoria: 'Rede', dificuldade: 'fácil', impacto: 'alto',
    titulo: 'Preferir cabo de rede (Ethernet) em vez de Wi-Fi',
    desc: 'Cabo de rede reduz latência e variações de ping (jitter), que em jogos competitivos importam mais do que a velocidade da internet em si.',
    condicao: s => s.jogoTipo === 'online' },
  { categoria: 'Rede', dificuldade: 'fácil', impacto: 'médio',
    titulo: 'Pausar downloads em outros dispositivos da rede durante as partidas',
    desc: 'Um celular ou outro PC baixando algo pesado na mesma rede pode causar picos de ping mesmo com boa internet.',
    condicao: s => s.jogoTipo === 'online' },
  { categoria: 'Rede', dificuldade: 'médio', impacto: 'médio',
    titulo: 'Adicionar o jogo como exceção no firewall/antivírus',
    desc: 'Isso evita que o software de segurança inspecione cada pacote de rede do jogo, o que pode causar picos de ping (spikes).',
    condicao: s => s.jogoTipo === 'online' },
  { categoria: 'Rede', dificuldade: 'fácil', impacto: 'baixo',
    titulo: 'Reiniciar o roteador antes de sessões longas',
    desc: 'Roteadores acumulam instabilidade com o tempo ligado. Um reinício simples resolve boa parte dos picos de ping esporádicos.',
    condicao: s => s.jogoTipo === 'online' },
];

const ORDEM_CATEGORIAS = ['Windows & energia', 'Drivers e software', 'Processos em segundo plano',
  'Armazenamento', 'Configurações gráficas do jogo', 'Rede'];

function gerarPlano(specs) {
  const itens = BASE_CONHECIMENTO.filter(item => item.condicao(specs));
  const categorias = ORDEM_CATEGORIAS
    .map(nome => ({ nome, itens: itens.filter(i => i.categoria === nome) }))
    .filter(cat => cat.itens.length > 0);
  return { nivel: calcularNivel(specs.gpuTier, specs.cpuTier, specs.ramTier), categorias };
}

// ── DETECÇÃO AUTOMÁTICA (aproximada, via APIs do navegador) ──
function detectarGPU() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return null;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return null;
    return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || null;
  } catch { return null; }
}

function detectarSpecs() {
  const nucleos = navigator.hardwareConcurrency || null;
  const ramAprox = navigator.deviceMemory || null; // GB, limitado/aproximado pelo navegador
  const gpuBruta = detectarGPU();

  const notas = [];

  if (gpuBruta) {
    document.getElementById('gpu').value = gpuBruta;
    notas.push(`GPU detectada: "${gpuBruta}"`);
  } else {
    notas.push('Não foi possível detectar a GPU automaticamente — informe manualmente.');
  }

  if (nucleos) {
    const cpuAtual = document.getElementById('cpu').value;
    if (!cpuAtual) document.getElementById('cpu').value = `(${nucleos} núcleos lógicos detectados — digite o modelo se souber)`;
    notas.push(`${nucleos} núcleos lógicos de CPU detectados.`);
  }

  if (ramAprox) {
    const ramSelect = document.getElementById('ram');
    const opcoes = Object.keys(RAM_TIER).map(Number).sort((a, b) => a - b);
    const aproxEscolhido = opcoes.find(o => o >= ramAprox) || opcoes[opcoes.length - 1];
    ramSelect.value = String(aproxEscolhido);
    notas.push(`RAM aproximada: ${ramAprox} GB (navegadores limitam essa informação por privacidade — confira e corrija se souber o valor real).`);
  } else {
    notas.push('Não foi possível detectar a RAM automaticamente — selecione manualmente.');
  }

  document.getElementById('sistema').value = 'win11';
  notas.push('Sistema operacional: assumimos Windows 11 — ajuste se for diferente.');

  document.getElementById('deteccao-nota').textContent = notas.join(' ');
}

// ── RENDER DO RESULTADO ────────────────────────────────────────
function renderResultado(plano) {
  const { nivel, categorias } = plano;

  const nivelHtml = `
    <div class="nivel-card">
      <div class="nivel-badge">Nível da sua máquina</div>
      <div class="nivel-nome">${nivel.nome}</div>
      <p class="nivel-desc">${nivel.desc}</p>
    </div>`;

  const categoriasHtml = categorias.map(cat => `
    <div class="categoria-grupo">
      <div class="categoria-titulo">${cat.nome}</div>
      <div class="categoria-itens">
        ${cat.itens.map(item => `
          <div class="recomendacao-item">
            <div class="rec-topo">
              <span class="rec-titulo">${item.titulo}</span>
              <span class="rec-tags">
                <span class="rec-tag">impacto ${item.impacto}</span>
                <span class="rec-tag">${item.dificuldade}</span>
              </span>
            </div>
            <p class="rec-desc">${item.desc}</p>
          </div>`).join('')}
      </div>
    </div>`).join('');

  document.getElementById('resultado-conteudo').innerHTML = nivelHtml + categoriasHtml;
  document.getElementById('resultado-section').hidden = false;
  document.getElementById('resultado-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── FORMULÁRIO ─────────────────────────────────────────────────
function lerSpecsDoFormulario() {
  const gpuTexto = document.getElementById('gpu').value;
  const cpuTexto = document.getElementById('cpu').value;
  const ramValor = document.getElementById('ram').value;
  const storage = document.getElementById('storage').value || 'desconhecido';
  const sistema = document.getElementById('sistema').value || 'outro';
  const jogoTexto = document.getElementById('jogo').value;
  const objetivo = document.querySelector('input[name="objetivo"]:checked')?.value || 'equilibrado';

  const nucleosDetectados = navigator.hardwareConcurrency || null;

  return {
    gpuTier: tierGPU(gpuTexto) ?? 1,
    cpuTier: tierCPU(cpuTexto, nucleosDetectados),
    ramTier: RAM_TIER[ramValor] ?? 1,
    storage,
    sistema,
    objetivo,
    jogoTipo: tipoDeJogo(jogoTexto),
    jogoTexto,
  };
}

function init() {
  document.getElementById('btn-detectar').addEventListener('click', detectarSpecs);

  document.getElementById('specs-form').addEventListener('submit', e => {
    e.preventDefault();
    const specs = lerSpecsDoFormulario();
    const plano = gerarPlano(specs);
    renderResultado(plano);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
