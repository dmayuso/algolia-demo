const searchBox = document.getElementById('searchbox');
const hitsContainer = document.getElementById('hits');
const paginationContainer = document.getElementById('pagination');

let currentPage = 0;

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

async function performSearch(query, page) {
  const res = await fetch(`http://localhost:3001/search?query=${encodeURIComponent(query)}&page=${page}`);
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
    <button class="btn btn-sm btn-${i===currentPage?'primary':'outline-primary'} mx-1" data-page="${i}">
      ${i+1}
    </button>
  `).join('');
}