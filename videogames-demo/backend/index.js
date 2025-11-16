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

const indexByRating = client.initIndex(baseIndexName);
const indexByPrice = client.initIndex(`${baseIndexName}_price_asc`);

app.get('/search', async (req, res) => {
  const { query, page = 0, filters = '', sort = 'rating' } = req.query;

  const activeIndex = sort === 'price' ? indexByPrice : indexByRating;

  try {
    const { hits, nbPages, queryID } = await activeIndex.search(query || '', {
      page: Number(page),
      hitsPerPage: 10,
      filters: filters || undefined,
      clickAnalytics: true, 
    });

    res.json({ hits, nbPages, queryID });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

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

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Backend API listening on http://localhost:${port}`);
});
