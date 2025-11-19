const searchBox = document.getElementById('searchbox');
const hitsContainer = document.getElementById('hits');
const paginationContainer = document.getElementById('pagination');
const genreFilters = document.getElementById('genre-filters');
const platformFilters = document.getElementById('platform-filters');
const sortSelect = document.getElementById('sort-by');

const HITS_PER_PAGE = 10;

let currentPage = 0;
let activeFilters = { genre: [], platform: [] };
let currentSort = 'rating'; // 'rating' o 'price'
let lastQueryID = null;

// --- Listeners ---

searchBox.addEventListener('input', () => {
  currentPage = 0;
  performSearch(searchBox.value, currentPage);
});

sortSelect.addEventListener('change', () => {
  currentSort = sortSelect.value;
  currentPage = 0;
  performSearch(searchBox.value, currentPage);
});

paginationContainer.addEventListener('click', (e) => {
  if (e.target.dataset.page) {
    currentPage = Number(e.target.dataset.page);
    performSearch(searchBox.value, currentPage);
  }
});

// Facetas de género
genreFilters.addEventListener('change', (e) => {
  if (e.target && e.target.type === 'checkbox') {
    setFilter('genre', e.target.value, e.target.checked);
    performSearch(searchBox.value, 0);
  }
});

// Facetas de plataforma
platformFilters.addEventListener('change', (e) => {
  if (e.target && e.target.type === 'checkbox') {
    setFilter('platform', e.target.value, e.target.checked);
    performSearch(searchBox.value, 0);
  }
});

// Click en botón de carrito -> llama al backend (/click)
hitsContainer.addEventListener('click', async (e) => {
  const btn = e.target.closest('.add-to-cart-btn');
  if (!btn) return;

  const objectID = btn.dataset.objectId;
  const position = Number(btn.dataset.position);
  const queryID = btn.dataset.queryId || lastQueryID;

  console.log('DEBUG Add to cart click (frontend):', {
    objectID,
    position,
    queryID,
    currentSort,
  });

  if (!objectID || !queryID) {
    console.warn('Falta objectID o queryID, no se llama al endpoint /click');
    return;
  }

  try {
    await fetch('http://localhost:3001/click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        objectID,
        position,
        queryID,
        sort: currentSort,
      }),
    });
  } catch (err) {
    console.error('Error llamando a /click:', err);
  }
});

// --- Helpers ---

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
    parts.push(activeFilters.genre.map((g) => `genre:"${g}"`).join(' OR '));
  }
  if (activeFilters.platform.length > 0) {
    parts.push(
      activeFilters.platform.map((p) => `platform:"${p}"`).join(' OR ')
    );
  }
  return parts.join(' AND ');
}

// --- Core ---

async function performSearch(query, page) {
  const filters = buildAlgoliaFiltersString();

  const res = await fetch(
    `http://localhost:3001/search?query=${encodeURIComponent(
      query
    )}&page=${page}&filters=${encodeURIComponent(
      filters
    )}&sort=${encodeURIComponent(currentSort)}`
  );

  const { hits, nbPages, queryID } = await res.json();
  lastQueryID = queryID || null;

  renderHits(hits, queryID);
  renderPagination(nbPages);

  await loadFacets(query, filters);
}

function renderHits(hits, queryID) {
  const pageOffset = currentPage * HITS_PER_PAGE;

  hitsContainer.innerHTML = hits
    .map((hit, idx) => {
      const position = pageOffset + idx + 1;

      return `
        <div class="col-sm-6 col-md-4 col-lg-3 mb-3">
          <div class="card h-100 product-card">
            <img src="${hit.cover_image_url}" class="card-img-top p-3" alt="${
        hit.title
      }" style="object-fit: contain; height: 200px;">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${hit.title}</h5>
              <p class="card-text">Publicador: ${hit.publisher || ''}</p>
              <p class="card-text">
                Plataformas: ${
                  Array.isArray(hit.platform)
                    ? hit.platform.join(', ')
                    : hit.platform || ''
                }
              </p>
              <p class="card-text mb-3">
                <small>Precio: ${hit.price_eur} €</small>
              </p>
              <div class="mt-auto d-flex justify-content-end">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-primary add-to-cart-btn"
                  data-object-id="${hit.objectID}"
                  data-position="${position}"
                  data-query-id="${queryID || ''}"
                  title="Añadir al carrito"
                >
                  🛒
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderPagination(nbPages) {
  paginationContainer.innerHTML = Array.from(
    { length: nbPages },
    (_, i) => `
      <button
        class="btn btn-sm btn-${i === currentPage ? 'primary' : 'outline-primary'} mx-1"
        data-page="${i}"
      >
        ${i + 1}
      </button>
    `
  ).join('');
}

function renderFacetGroup(container, title, items, type) {
  container.innerHTML = `
    <div class="vstack gap-1">
      ${Object.keys(items)
        .sort()
        .map((value) => {
          const id = `${type}-${value}`.replace(/\s+/g, '-').toLowerCase();
          const checked = activeFilters[type].includes(value) ? 'checked' : '';
          return `
            <div class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                id="${id}"
                value="${value}"
                ${checked}
              >
              <label class="form-check-label" for="${id}">
                ${value} (${items[value]})
              </label>
            </div>
          `;
        })
        .join('')}
    </div>
  `;
}

async function loadFacets(query = '', filters = '') {
  const res = await fetch(
    `http://localhost:3001/facets?query=${encodeURIComponent(
      query
    )}&filters=${encodeURIComponent(
      filters
    )}&sort=${encodeURIComponent(currentSort)}`
  );
  const facets = await res.json();

  renderFacetGroup(genreFilters, 'Géneros', facets.genre || {}, 'genre');
  renderFacetGroup(
    platformFilters,
    'Plataformas',
    facets.platform || {},
    'platform'
  );
}

// --- Inicial ---

(async () => {
  await loadFacets('', '');
  await performSearch('', 0);
})();
