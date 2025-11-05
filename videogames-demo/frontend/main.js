const searchBox = document.getElementById('searchbox');
const hitsContainer = document.getElementById('hits');
const paginationContainer = document.getElementById('pagination');
const genreFilters = document.getElementById('genre-filters');
const platformFilters = document.getElementById('platform-filters');

let currentPage = 0;
let activeFilters = { genre: [], platform: [] };

searchBox.addEventListener('input', () => {
  currentPage = 0;
  performSearch(searchBox.value, currentPage);
});

// paginación
paginationContainer.addEventListener('click', e => {
  if (e.target.dataset.page) {
    currentPage = +e.target.dataset.page;
    performSearch(searchBox.value, currentPage);
  }
});

// cambio de género (checkboxes)
genreFilters.addEventListener('change', e => {
  if (e.target && e.target.type === 'checkbox') {
    setFilter('genre', e.target.value, e.target.checked);
    performSearch(searchBox.value, 0);
  }
});

// cambio de plataforma (checkboxes)
platformFilters.addEventListener('change', e => {
  if (e.target && e.target.type === 'checkbox') {
    setFilter('platform', e.target.value, e.target.checked);
    performSearch(searchBox.value, 0);
  }
});

function setFilter(type, value, checked) {
  const set = new Set(activeFilters[type]);
  if (checked) set.add(value);
  else set.delete(value);
  activeFilters[type] = Array.from(set);
  currentPage = 0;
}

function buildAlgoliaFiltersString() {
  const parts = [];
  if (activeFilters.genre.length > 0) {
    parts.push(activeFilters.genre.map(g => `genre:"${g}"`).join(' OR '));
  }
  if (activeFilters.platform.length > 0) {
    parts.push(activeFilters.platform.map(p => `platform:"${p}"`).join(' OR '));
  }
  return parts.join(' AND ');
}

async function performSearch(query, page) {
  const filters = buildAlgoliaFiltersString();
  const res = await fetch(
    `http://localhost:3001/search?query=${encodeURIComponent(query)}&page=${page}&filters=${encodeURIComponent(filters)}`
  );
  const { hits, nbPages } = await res.json();
  renderHits(hits);
  renderPagination(nbPages);

  // actualiza facetas con el mismo contexto (query + filters)
  await loadFacets(query, filters);
}

function renderHits(hits) {
  hitsContainer.innerHTML = hits
    .map(hit => `
      <div class="col-sm-6 col-md-4 col-lg-3 mb-3">
        <div class="card h-100">
          <img src="${hit.cover_image_url}" class="card-img-top p-3" alt="${hit.title}" style="object-fit: contain; height: 200px;">
          <div class="card-body">
            <h5 class="card-title">${hit.title}</h5>
            <p class="card-text">Plataformas: ${Array.isArray(hit.platform) ? hit.platform.join(', ') : hit.platform}</p>
            <p class="card-text"><small>Precio: ${hit.price_eur} €</small></p>
          </div>
        </div>
      </div>
    `).join('');
}

function renderPagination(nbPages) {
  paginationContainer.innerHTML = Array.from({ length: nbPages }, (_, i) => `
    <button class="btn btn-sm btn-${i === currentPage ? 'primary' : 'outline-primary'} mx-1" data-page="${i}">
      ${i + 1}
    </button>
  `).join('');
}

function renderFacetGroup(container, title, items, type) {
  container.innerHTML = `
    <div class="vstack gap-1">
      ${Object.keys(items).sort().map(value => {
        const id = `${type}-${value}`.replace(/\s+/g, '-').toLowerCase();
        const checked = activeFilters[type].includes(value) ? 'checked' : '';
        return `
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="${id}" value="${value}" ${checked}>
            <label class="form-check-label" for="${id}">
              ${value} (${items[value]})
            </label>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

async function loadFacets(query = '', filters = '') {
  const res = await fetch(
    `http://localhost:3001/facets?query=${encodeURIComponent(query)}&filters=${encodeURIComponent(filters)}`
  );
  const facets = await res.json();

  // genera checkboxes de Género y Plataforma manteniendo "checked" según activeFilters
  renderFacetGroup(genreFilters, 'Géneros', facets.genre || {}, 'genre');
  renderFacetGroup(platformFilters, 'Plataformas', facets.platform || {}, 'platform');
}

// inicial
(async () => {
  await loadFacets('', '');
  await performSearch('', 0);
})();
