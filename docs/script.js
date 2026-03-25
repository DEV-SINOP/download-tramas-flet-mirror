// Path do arquivo update.json
const updateJsonPath = 'update.json';

// Função para carregar dados sobre a atualização
async function loadUpdateInfo() {
  try {
    const response = await fetch(updateJsonPath);
    if (!response.ok) {
      throw new Error(`Erro ao carregar arquivo: ${response.status}`);
    }
    const updateData = await response.json();

    // Atualizar a página com informações do JSON
    document.getElementById('current-version').textContent = updateData.version || 'Informação não disponível';
    document.getElementById('last-update').textContent = updateData.lastUpdate || 'Informação não disponível';
    document.getElementById('download-link').href = updateData.downloadUrl || '#';
  } catch (error) {
    console.error('Erro ao carregar as informações da atualização:', error);
    document.getElementById('current-version').textContent = 'Erro ao carregar versão';
    document.getElementById('last-update').textContent = 'Erro ao carregar data';
  }
}

// Carregar dados assim que o JavaScript for executado
loadUpdateInfo();