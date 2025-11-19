import express from 'express';
import cors from 'cors';
import algoliasearch from 'algoliasearch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors(), express.json());

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_ADMIN_API_KEY
);

const baseIndexName = process.env.ALGOLIA_INDEX;

// Índice principal: orden por rating (el que tengas configurado)
const indexByRating = client.initIndex(baseIndexName);

// Índice réplica: mismo índice pero con customRanking por precio ascendente
const indexByPrice = client.initIndex(`${baseIndexName}_price_asc`);

// --- SEARCH ---

app.get('/search', async (req, res) => {
  const { query, page = 0, filters = '', sort = 'rating' } = req.query;

  const activeIndex = sort === 'price' ? indexByPrice : indexByRating;

  try {
    const { hits, nbPages, queryID } = await activeIndex.search(query || '', {
      page: Number(page),
      hitsPerPage: 10,
      filters: filters || undefined,
      clickAnalytics: true, // necesario para tener queryID en los hits
    });

    res.json({ hits, nbPages, queryID });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

// --- FACETS ---

app.get('/facets', async (req, res) => {
  const { query = '', filters = '', sort = 'rating' } = req.query;

  const activeIndex = sort === 'price' ? indexByPrice : indexByRating;

  try {
    const response = await activeIndex.search(query, {
      facets: ['genre', 'platform'],
      maxValuesPerFacet: 100,
      filters: filters || undefined,
    });

    res.json(response.facets);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

// --- CLICK EVENT (Insights vía backend) ---

const INSIGHTS_URL = 'https://insights.algolia.io/1/events';

app.post('/click', async (req, res) => {
  const { objectID, position, queryID, sort } = req.body || {};

  if (!objectID || !queryID) {
    return res.status(400).json({ message: 'objectID y queryID son obligatorios' });
  }

  const indexName =
    sort === 'price' ? `${baseIndexName}_price_asc` : baseIndexName;

  const userToken = 'demo-user-token'; // en una app real vendría del usuario autenticado

  const body = {
    events: [
      {
        eventType: 'click',
        eventName: 'Add to cart',
        index: indexName,
        userToken,
        objectIDs: [objectID],
        positions: [Number(position) || 1],
        queryID,
      },
    ],
  };

  try {
    const response = await fetch(INSIGHTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Algolia-Application-Id': process.env.ALGOLIA_APP_ID,
        'X-Algolia-API-Key': process.env.ALGOLIA_ADMIN_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Error al enviar evento a Insights:', response.status, text);
      return res
        .status(500)
        .json({ message: 'Error al enviar evento a Insights', status: response.status });
    }

    // No necesitamos devolver nada al front
    return res.status(204).end();
  } catch (e) {
    console.error('Error de red al llamar a Insights:', e);
    return res.status(500).json({ message: e.message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Backend API listening on http://localhost:${port}`);
});
