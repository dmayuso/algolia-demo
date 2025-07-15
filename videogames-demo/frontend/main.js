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

paginationContainer.addEventListener('click', e => {
  if (e.target.dataset.page) {
    currentPage = +e.target.dataset.page;
    performSearch(searchBox.value, currentPage);
  }
});

genreFilters.addEventListener('click', e => {
  if (e.target.dataset.value) {
    toggleFilter('genre', e.target.dataset.value);
    performSearch(searchBox.value, 0);
  }
});

platformFilters.addEventListener('click', e => {
  if (e.target.dataset.value) {
    toggleFilter('platform', e.target.dataset.value);
    performSearch(searchBox.value, 0);
  }
});

function toggleFilter(type, value) {
  if (activeFilters[type].includes(value)) {
    activeFilters[type] = activeFilters[type].filter(v => v !== value);
  } else {
    activeFilters[type].push(value);
  }
  currentPage = 0;
}

async function performSearch(query, page) {
  let filters = [];
  if (activeFilters.genre.length > 0) {
    filters.push(activeFilters.genre.map(g => `genre:"${g}"`).join(' OR '));
  }
  if (activeFilters.platform.length > 0) {
    filters.push(activeFilters.platform.map(p => `platform:"${p}"`).join(' OR '));
  }

  const res = await fetch(`http://localhost:3001/search?query=${encodeURIComponent(query)}&page=${page}&filters=${encodeURIComponent(filters.join(' AND '))}`);
  const { hits, nbPages } = await res.json();
  renderHits(hits);
  renderPagination(nbPages);
}

function renderHits(hits) {
  hitsContainer.innerHTML = hits
    .map(hit => `
      <div class="card mb-3" style="max-width: 300px;">
        <img src="${hit.cover_image_url}" class="card-img-top p-3" alt="${hit.title}" style="object-fit: contain; height: 200px;">
        <div class="card-body">
          <h5 class="card-title">${hit.title}</h5>
          <p class="card-text">Plataformas: ${hit.platform.join(', ')}</p>
          <p class="card-text"><small>Precio: ${hit.price_eur} €</small></p>
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

async function loadFacets() {
  const res = await fetch('http://localhost:3001/facets');
  const facets = await res.json();

  genreFilters.innerHTML = Object.keys(facets.genre)
    .map(genre => `<button class="btn btn-sm btn-outline-secondary m-1" data-value="${genre}">${genre} (${facets.genre[genre]})</button>`)
    .join('');

  platformFilters.innerHTML = Object.keys(facets.platform)
    .map(platform => `<button class="btn btn-sm btn-outline-secondary m-1" data-value="${platform}">${platform} (${facets.platform[platform]})</button>`)
    .join('');
}

loadFacets();
performSearch('', 0);
