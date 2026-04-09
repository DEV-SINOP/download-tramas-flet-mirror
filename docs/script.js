// Configuração básica
const updateJsonPath = 'update.json';
const GITHUB_REPO = 'DEV-SINOP/download-tramas-flet-mirror';

// 🌓 Lógica de Tema (Dark/Light Mode)
const themeBtn = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');
const body = document.body;

function setTheme(theme) {
  if (theme === 'dark') {
    body.setAttribute('data-theme', 'dark');
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  } else {
    body.setAttribute('data-theme', 'light');
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  }
  localStorage.setItem('theme', theme);
  // Recarrega Utterances com o tema correto
  loadUtterances(theme === 'dark' ? 'github-dark' : 'github-light');
}

themeBtn.addEventListener('click', () => {
  const currentTheme = body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  
  // Atualizar gráfico se existir
  if (usageChart) {
    usageChart.updateOptions({
      theme: { mode: newTheme }
    });
  }
});

// Inicializar tema com base no localStorage ou preferência do sistema
const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
setTheme(savedTheme);

// Global Chart Instance
let usageChart = null;

// 💬 Utterances (Comentários via GitHub)
function loadUtterances(theme = 'github-light') {
  const container = document.getElementById('utterances-container');
  if (!container) return;

  const script = document.createElement('script');
  script.src = 'https://utteranc.es/client.js';
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.setAttribute('repo', GITHUB_REPO);
  script.setAttribute('issue-term', 'pathname');
  script.setAttribute('label', 'feedback');
  script.setAttribute('theme', theme);

  container.innerHTML = '';
  container.appendChild(script);
}

// 📦 Informações de Atualização (Download e Versões)
async function loadUpdateInfo() {
  try {
    const response = await fetch(updateJsonPath);
    if (!response.ok) throw new Error(`Erro: ${response.status}`);
    const updateData = await response.json();

    document.getElementById('current-version').textContent = updateData.version || 'Indisponível';
    
    // Formatar data de atualização
    const rawDate = updateData.updated_at || updateData.lastUpdate;
    let updateText = 'Indisponível';
    if (rawDate) {
      const parsed = new Date(rawDate);
      updateText = !isNaN(parsed) ? parsed.toLocaleDateString('pt-BR') : rawDate;
    }
    document.getElementById('last-update').textContent = updateText;
    document.getElementById('recommended-compiler').textContent = updateData.compiler || '64 bits';

    updateBtn(document.getElementById('pyinstaller-link'), updateData.pyinstaller_download_url || updateData.pyinstallerDownloadUrl);
    updateBtn(document.getElementById('nuitka-link'), updateData.nuitka_download_url || updateData.nuitkaDownloadUrl);

  } catch (error) {
    console.error('Erro ao carregar dados de atualização:', error);
  }
}

function updateBtn(btn, url) {
  if (!url || url === '#') {
    btn.textContent = 'Indisponível';
    btn.style.opacity = '0.5';
    btn.style.pointerEvents = 'none';
  } else {
    btn.href = url;
  }
}

// 🏆 Ranking Supabase
async function loadRankingSupabase() {
  const endpoint = 'https://dkuhjwwgsusqvgrdwmej.supabase.co/rest/v1/ranking?select=*';
  const key = 'sb_publishable_IbXpH_lmqpxYXUtoanDYjA_XUEE7Um9';
  const msg = document.getElementById('ranking-error');
  const tbody = document.querySelector('#ranking-table tbody');

  if (!msg || !tbody) return;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error(`Erro ${response.status}`);
    const data = await response.json();

    const top10 = data.slice().sort((a, b) => (b.total_mb || 0) - (a.total_mb || 0)).slice(0, 10);
    tbody.innerHTML = '';

    top10.forEach((item, index) => {
      const rank = index + 1;
      const user = item.usuario || item.user || item.nome || 'Desconhecido';
      const totalMb = Number(item.total_mb || 0);
      const volume = totalMb >= 1000 ? `${(totalMb / 1024).toFixed(1)} GB` : `${totalMb.toFixed(0)} MB`;
      
      // Nova coluna: Visto por último (last_seen)
      const lastSeenRaw = item.last_seen;
      let lastSeenText = 'Nunca';
      if (lastSeenRaw) {
        const d = new Date(lastSeenRaw);
        lastSeenText = !isNaN(d) ? d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : lastSeenRaw;
      }

      let badgeClass = '';
      if (rank === 1) badgeClass = 'rank-1';
      else if (rank === 2) badgeClass = 'rank-2';
      else if (rank === 3) badgeClass = 'rank-3';

      const tr = document.createElement('tr');
      tr.className = badgeClass;
      tr.innerHTML = `
        <td><span class="badge-rank">${rank}</span></td>
        <td style="font-weight: 500;">${user}</td>
        <td style="color: var(--accent-color); font-weight: 700;">${volume}</td>
        <td style="font-size: 0.9em; color: var(--text-muted);">${lastSeenText}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (error) {
    msg.style.display = 'block';
    msg.textContent = 'Indisponível no momento.';
    console.error(error);
  }
}

// 📢 Centro de Avisos
async function loadNotices() {
  const noticesPath = 'notices.json';
  try {
    const response = await fetch(noticesPath);
    if (!response.ok) return;
    const noticesData = await response.json();

    const activeNotices = noticesData.filter(n => n.active);
    const activeTextEl = document.getElementById('active-notice');
    const detailsEl = document.getElementById('notice-details');
    const historyEl = document.getElementById('notice-history');
    const controlsEl = document.getElementById('notice-controls');
    
    let currentIndex = 0;

    const render = (idx) => {
      if (!activeNotices.length) {
        activeTextEl.textContent = 'Sem avisos ativos';
        detailsEl.style.display = 'none';
        controlsEl.style.display = 'none';
        return;
      }
      const n = activeNotices[idx];
      activeTextEl.textContent = n.title;
      document.getElementById('notice-title').textContent = n.title;
      document.getElementById('notice-message').textContent = n.message;
      document.getElementById('notice-date').textContent = new Date(n.updated_at).toLocaleString('pt-BR');
      detailsEl.style.display = 'block';
      
      if (activeNotices.length > 1) {
        controlsEl.style.display = 'flex';
        document.getElementById('notice-counter').textContent = `${idx + 1} / ${activeNotices.length}`;
      }
    };

    document.getElementById('prev-notice').onclick = () => {
      currentIndex = (currentIndex - 1 + activeNotices.length) % activeNotices.length;
      render(currentIndex);
    };
    document.getElementById('next-notice').onclick = () => {
      currentIndex = (currentIndex + 1) % activeNotices.length;
      render(currentIndex);
    };

    render(currentIndex);

    // Histórico
    historyEl.innerHTML = '';
    noticesData.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).forEach(n => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${new Date(n.updated_at).toLocaleDateString()}</strong> · ${n.title}`;
      historyEl.appendChild(li);
    });

  } catch (e) {
    console.error(e);
  }
}

// 📊 Gráfico de Uso Supabase
async function loadUsageChart() {
  const endpoint = 'https://dkuhjwwgsusqvgrdwmej.supabase.co/rest/v1/usage_last_30_days?select=*';
  const key = 'sb_publishable_IbXpH_lmqpxYXUtoanDYjA_XUEE7Um9';
  const loader = document.getElementById('usage-chart-loader');
  const chartEl = document.getElementById('usage-chart');

  if (!chartEl) return;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error(`Erro ${response.status}`);
    let data = await response.json();

    // Se não houver dados, mostrar mensagem
    if (!data.length) {
      loader.innerHTML = '<span>Nenhum dado de uso nos últimos 30 dias.</span>';
      return;
    }

    // Preparar dados para o gráfico
    const categories = data.map(item => {
      // Divide a string "YYYY-MM-DD" e cria a data localmente para evitar o atraso de 1 dia (timezone UTC)
      const [year, month, day] = item.day.split('-');
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });
    const seriesData = data.map(item => Number(item.total_mb).toFixed(1));

    loader.style.display = 'none';

    const options = {
      series: [{
        name: 'Volume (MB)',
        data: seriesData
      }],
      chart: {
        type: 'area',
        height: 350,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'Inter, sans-serif',
        background: 'transparent'
      },
      colors: ['#3b82f6'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [50, 100, 100]
        }
      },
      dataLabels: { enabled: false },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      xaxis: {
        categories: categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: {
            colors: 'var(--text-muted)',
            fontSize: '12px'
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: 'var(--text-muted)',
            fontSize: '12px'
          },
          formatter: (val) => val >= 1024 ? (val / 1024).toFixed(1) + ' GB' : val.toFixed(0) + ' MB'
        }
      },
      grid: {
        borderColor: 'var(--card-border)',
        strokeDashArray: 4,
        padding: { left: 20, right: 20 }
      },
      theme: {
        mode: body.getAttribute('data-theme') || 'light'
      },
      tooltip: {
        x: { format: 'dd/MM' }
      }
    };

    usageChart = new ApexCharts(chartEl, options);
    usageChart.render();

  } catch (error) {
    loader.innerHTML = `<span style="color: var(--danger-color)">Indisponível no momento: ${error.message}</span>`;
    console.error('Erro ao carregar gráfico:', error);
  }
}

// Iniciar
loadUpdateInfo();
loadRankingSupabase();
loadUsageChart();
loadNotices();
loadUtterances(savedTheme === 'dark' ? 'github-dark' : 'github-light');