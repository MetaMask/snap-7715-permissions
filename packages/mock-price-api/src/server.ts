import cors from 'cors';
import express from 'express';

const PORT = 8003;

// Mock exchange rates relative to USD
const EXCHANGE_RATES: Record<string, number> = {
  // Crypto currencies
  btc: 0.00002, // 1 USD = 0.00002 BTC (BTC at ~$50,000)
  eth: 0.0001, // 1 USD = 0.0001 ETH (ETH at ~$10,000)
  ltc: 0.01, // 1 USD = 0.01 LTC
  bch: 0.002, // 1 USD = 0.002 BCH
  bnb: 0.003, // 1 USD = 0.003 BNB
  eos: 1, // 1 USD = 1 EOS
  xrp: 2, // 1 USD = 2 XRP
  xlm: 3, // 1 USD = 3 XLM
  link: 0.1, // 1 USD = 0.1 LINK
  dot: 0.2, // 1 USD = 0.2 DOT
  yfi: 0.00003, // 1 USD = 0.00003 YFI
  // Fiat currencies
  usd: 1,
  aed: 3.67, // 1 USD = 3.67 AED
  ars: 350, // 1 USD = 350 ARS
  aud: 1.35, // 1 USD = 1.35 AUD
  bdt: 110, // 1 USD = 110 BDT
  bhd: 0.377, // 1 USD = 0.377 BHD
  bmd: 1, // 1 USD = 1 BMD
  brl: 5, // 1 USD = 5 BRL
  cad: 1.25, // 1 USD = 1.25 CAD
  chf: 0.92, // 1 USD = 0.92 CHF
  clp: 800, // 1 USD = 800 CLP
  cny: 6.45, // 1 USD = 6.45 CNY
  czk: 22, // 1 USD = 22 CZK
  dkk: 6.3, // 1 USD = 6.3 DKK
  eur: 0.85, // 1 USD = 0.85 EUR
  gbp: 0.73, // 1 USD = 0.73 GBP
  gel: 2.7, // 1 USD = 2.7 GEL
  hkd: 7.8, // 1 USD = 7.8 HKD
  huf: 360, // 1 USD = 360 HUF
  idr: 15000, // 1 USD = 15000 IDR
  ils: 3.2, // 1 USD = 3.2 ILS
  inr: 74.5, // 1 USD = 74.5 INR
  jpy: 110, // 1 USD = 110 JPY
  krw: 1180, // 1 USD = 1180 KRW
  kwd: 0.3, // 1 USD = 0.3 KWD
  lkr: 360, // 1 USD = 360 LKR
  mmk: 2100, // 1 USD = 2100 MMK
  mxn: 20, // 1 USD = 20 MXN
  myr: 4.2, // 1 USD = 4.2 MYR
  ngn: 420, // 1 USD = 420 NGN
  nok: 8.5, // 1 USD = 8.5 NOK
  nzd: 1.45, // 1 USD = 1.45 NZD
  php: 55, // 1 USD = 55 PHP
  pkr: 280, // 1 USD = 280 PKR
  pln: 4, // 1 USD = 4 PLN
  rub: 75, // 1 USD = 75 RUB
  sar: 3.75, // 1 USD = 3.75 SAR
  sek: 8.8, // 1 USD = 8.8 SEK
  sgd: 1.35, // 1 USD = 1.35 SGD
  thb: 33, // 1 USD = 33 THB
  try: 18, // 1 USD = 18 TRY
  twd: 28, // 1 USD = 28 TWD
  uah: 37, // 1 USD = 37 UAH
  vef: 4000000, // 1 USD = 4000000 VEF
  vnd: 23000, // 1 USD = 23000 VND
  zar: 15, // 1 USD = 15 ZAR
  xdr: 0.7, // 1 USD = 0.7 XDR
  xag: 0.04, // 1 USD = 0.04 XAG (Silver)
  xau: 0.0005, // 1 USD = 0.0005 XAU (Gold)
  bits: 1000000, // 1 USD = 1000000 bits (satoshis/100)
  sats: 100000000, // 1 USD = 100000000 sats
};

// Base prices in USD
const BASE_PRICES_USD: Record<string, number> = {
  'eip155:1/slip44:60': 10000.6, // ETH
  'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 1, // USDC
  'eip155:1/erc20:0xdac17f958d2ee523a2206206994597c13d831ec7': 1, // USDT
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

  const currency = (vsCurrency as string).toLowerCase();
  const assetId = assetIds as string;

  // Check if we support the requested currency
  if (!EXCHANGE_RATES[currency]) {
    return res.status(400).json({ error: `Unsupported currency: ${currency}` });
  }

  // Check if we have price data for the requested asset
  const basePriceUsd = BASE_PRICES_USD[assetId];
  if (basePriceUsd === undefined) {
    return res
      .status(404)
      .json({ error: `No price data for asset: ${assetId}` });
  }

  // Convert the price to the requested currency
  const priceInRequestedCurrency = basePriceUsd * EXCHANGE_RATES[currency];

  console.log(
    `Converting ${assetId} price: $${basePriceUsd} USD -> ${priceInRequestedCurrency} ${currency.toUpperCase()}`,
  );

  // Return the response in the expected format
  const response = {
    [assetId]: {
      [currency]: priceInRequestedCurrency,
    },
  };

  return res.json(response);
});

app.listen(PORT, () => {
  console.log(`Mock Price API is running on http://localhost:${PORT}`);
});
