import express from 'express';
import cors from 'cors';
import algoliasearch from 'algoliasearch';
import dotenv from 'dotenv';

dotenv.config();
const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_API_KEY);
const index = client.initIndex(process.env.ALGOLIA_INDEX);

const app = express();
app.use(cors(), express.json());

app.get('/search', async (req, res) => {
  const { query, page = 0 } = req.query;
  try {
    const { hits, nbPages } = await index.search(query || '', { page, hitsPerPage: 10 });
    res.json({ hits, nbPages });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.get('/facets', async (req, res) => {
  try {
    const response = await index.search('', {
      facets: ['genre', 'platform'],
      maxValuesPerFacet: 100,
    });
    res.json(response.facets);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Backend API listening on http://localhost:${process.env.PORT}`);
});
