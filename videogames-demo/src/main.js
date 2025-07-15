import algoliasearch from 'algoliasearch/lite';
import instantsearch from 'instantsearch.js';
import { searchBox, hits, refinementList, pagination } from 'instantsearch.js/es/widgets';

const searchClient = algoliasearch('<---->', '<---->');

const search = instantsearch({
  indexName: 'catalogo_videojuegos_demo',
  searchClient,
});

search.addWidgets([
  searchBox({
    container: '#searchbox',
    placeholder: 'Busca tu juego favorito...',
  }),
  refinementList({
    container: '#genres',
    attribute: 'genre',
  }),
  refinementList({
    container: '#platforms',
    attribute: 'platform',
  }),
  hits({
  container: '#hits',
  templates: {
    item(hit) {
      return `
        <div class="card mb-3" style="max-width: 540px;">
          <div class="row g-0">
            <div class="col-md-4">
              <img src="${hit.cover_image_url}" class="img-fluid rounded-start" alt="${hit.title}">
            </div>
            <div class="col-md-8">
              <div class="card-body">
                <h5 class="card-title">${hit.title}</h5>
                <p class="card-text">Plataformas: ${hit.platform.join(', ')}</p>
                <p class="card-text"><small class="text-muted">Precio: ${hit.price_eur} €</small></p>
              </div>
            </div>
          </div>
        </div>
      `;
    },
  },
}),
  pagination({
    container: '#pagination',
  }),
]);

search.start();
