// App JS vanilla para buscar temperatura via Open-Meteo
// Fluxo:
// 1) Usuário informa o nome da cidade
// 2) Geocoding (Open-Meteo) para obter latitude/longitude
// 3) Consulta clima atual (current_weather) para a coordenada
// 4) Exibe temperatura em °C

const $form = document.getElementById('form-busca');
const $input = document.getElementById('cidade');
const $resultado = document.getElementById('resultado');

$form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const cidade = ($input.value || '').trim();
  if (!cidade) {
    renderErro('Informe o nome de uma cidade.');
    return;
  }
  renderLoading();
  try {
    const loc = await geocodeCidade(cidade);
    if (!loc) {
      renderErro('Cidade não encontrada. Tente outro nome.');
      return;
    }
    const clima = await buscarClimaAtual(loc.latitude, loc.longitude);
    renderResultado({ cidade: `${loc.name}${loc.admin1 ? ', ' + loc.admin1 : ''}${loc.country ? ' - ' + loc.country : ''}`, temp: clima?.temperature, wind: clima?.windspeed, code: clima?.weathercode });
  } catch (err) {
    console.error(err);
    renderErro('Não foi possível obter a temperatura no momento.');
  }
});

async function geocodeCidade(nome) {
  // API de geocoding do Open-Meteo (gratuita, sem chave)
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', nome);
  url.searchParams.set('count', '1');
  url.searchParams.set('language', 'pt');
  url.searchParams.set('format', 'json');

  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Falha no geocoding');
  const data = await resp.json();
  const loc = data?.results?.[0];
  if (!loc) return null;
  return loc; // { name, latitude, longitude, country, admin1 }
}

async function buscarClimaAtual(lat, lon) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('current_weather', 'true');
  url.searchParams.set('timezone', 'auto');

  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Falha ao buscar clima');
  const data = await resp.json();
  return data?.current_weather;
}

function renderLoading() {
  $resultado.innerHTML = '<div class="skeleton"></div>';
}

function renderErro(msg) {
  $resultado.innerHTML = `<p class="msg-erro">${escapeHtml(msg)}</p>`;
}

function renderResultado({ cidade, temp, wind, code }) {
  if (typeof temp !== 'number') {
    renderErro('Temperatura indisponível.');
    return;
  }
  const detalhes = [
    `<div class="cidade">${escapeHtml(cidade)}</div>`,
    `<div class="temp">${temp.toFixed(1)}°C</div>`,
    wind ? `<div>Vento: ${Number(wind).toFixed(0)} km/h</div>` : '',
    typeof code === 'number' ? `<div>Código clima: ${code}</div>` : '',
  ].filter(Boolean).join('');

  $resultado.innerHTML = `<div class="card">${detalhes}</div>`;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
