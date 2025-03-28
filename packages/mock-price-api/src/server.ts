import cors from 'cors';
import express from 'express';

const PORT = 8003;

const MOCK_PRICES = {
  'eip155:1/slip44:60': {
    usd: 10000.6,
  },
};

const app = express();

app.use(cors());
app.use(express.json());

app.get('/v3/spot-prices', (req, res) => {
  const { includeMarketData, vsCurrency, assetIds } = req.query;
  console.log('Incoming request for spot price:', req.query);

  // Validate the query parameters
  if (includeMarketData !== 'false') {
    return res.status(400).json({ error: 'includeMarketData must be false' });
  }

  if (!vsCurrency || !assetIds) {
    return res
      .status(400)
      .json({ error: 'vsCurrency and assetIds are required' });
  }

  return res.json(MOCK_PRICES);
});

app.listen(PORT, () => {
  console.log(`Mock Price API is running on http://localhost:${PORT}`);
});
