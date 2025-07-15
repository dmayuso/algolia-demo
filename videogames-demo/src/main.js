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
          <div>
            <img src="${hit.cover_image_url}" alt="${hit.title}" width="100"/>
            <h4>${hit.title}</h4>
            <p>Plataformas: ${hit.platform.join(', ')}</p>
            <p>Precio: ${hit.price_eur} €</p>
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
