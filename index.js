// server.js
import express from 'express';
import { Sequelize, Op } from 'sequelize';
import axios from 'axios';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import initModels from './models/country.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;

const sequelize = new Sequelize(process.env.DATABASE_URL);
const { Country, Metadata } = initModels(sequelize);

const generateSummaryImage = async (countries, timestamp) => {
  const width = 800;
  const height = 600;
  const image = sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  });

  const svg = `
    <svg width="${width}" height="${height}">
      <style>text { font-family: Arial; fill: #000; }</style>
      <text x="20" y="50" font-size="24">Country Data Summary</text>
      <text x="20" y="100" font-size="18">Total Countries: ${countries.length}</text>
      <text x="20" y="140" font-size="18">Last Refreshed: ${timestamp.toISOString()}</text>
      <text x="20" y="180" font-size="20">Top 5 Countries by GDP:</text>
      ${countries
        .sort((a, b) => (b.estimated_gdp || 0) - (a.estimated_gdp || 0))
        .slice(0, 5)
        .map((c, i) => `
          <text x="20" y="${220 + i * 30}" font-size="16">
            ${c.name}: $${(c.estimated_gdp || 0).toFixed(2)}
          </text>
        `).join('')}
    </svg>
  `;

  await image
    .composite([{ input: Buffer.from(svg), blend: 'over' }])
    .png()
    .toFile(path.join(__dirname, 'cache/summary.png'));
};

app.post('/countries/refresh', async (_, res) => {
  try {
    const countriesResp = await axios.get('https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies');
    const exchangeResp = await axios.get('https://open.er-api.com/v6/latest/USD');
    const rates = exchangeResp.data.rates;
    const now = new Date();

    const countries = countriesResp.data;
    const validCountries = [];

    for (const country of countries) {
      if (!country.name || !country.population) {
        continue;
      }

      let currency_code = null;
      let exchange_rate = null;
      let estimated_gdp = null;

      if (country.currencies && country.currencies.length > 0) {
        currency_code = country.currencies[0].code;
        exchange_rate = rates[currency_code] || null;
        if (exchange_rate) {
          const randomMultiplier = Math.random() * (2000 - 1000) + 1000;
          estimated_gdp = (country.population * randomMultiplier) / exchange_rate;
        }
      }

      // Use LOWER() for case-insensitive matching in MySQL
      const [record, created] = await Country.findOrCreate({
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('name')),
          country.name.toLowerCase()
        ),
        defaults: {
          name: country.name,
          capital: country.capital,
          region: country.region,
          population: country.population,
          currency_code,
          exchange_rate,
          estimated_gdp,
          flag_url: country.flag,
          last_refreshed_at: now
        }
      });

      if (!created) {
        await record.update({
          capital: country.capital,
          region: country.region,
          population: country.population,
          currency_code,
          exchange_rate,
          estimated_gdp,
          flag_url: country.flag,
          last_refreshed_at: now
        });
      }

      validCountries.push(record);
    }

    await Metadata.upsert({
      key: 'last_refreshed_at',
      value: now.toISOString()
    });

    await fs.mkdir(path.join(__dirname, 'cache'), { recursive: true });
    await generateSummaryImage(validCountries, now);

    return res.json({ message: 'Data refreshed successfully' });
  } catch (error) {
    console.error(error);
    return res.status(503).json({
      error: 'External data source unavailable',
      details: `Could not fetch data from ${error.response?.config?.url || 'API'}`
    });
  }
});

app.get('/countries', async (req, res) => {
  try {
    const { region, currency, sort } = req.query;
    const where = {};
    if (region) where.region = region;
    if (currency) where.currency_code = currency;

    const order = sort === 'gdp_desc' ? [['estimated_gdp', 'DESC']] : [];

    const countries = await Country.findAll({ where, order });
    return res.json(countries);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/countries/:name', async (req, res) => {
  try {
    const country = await Country.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('name')),
        req.params.name.toLowerCase()
      )
    });
    if (!country) {
      return res.status(404).json({ error: 'Country not found' });
    }
    return res.json(country);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/countries/:name', async (req, res) => {
  try {
    const country = await Country.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('name')),
        req.params.name.toLowerCase()
      )
    });
    if (!country) {
      return res.status(404).json({ error: 'Country not found' });
    }
    await country.destroy();
    return res.json({ message: 'Country deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/status', async (_, res) => {
  try {
    const count = await Country.count();
    const metadata = await Metadata.findOne({ where: { key: 'last_refreshed_at' } });
    return res.json({
      total_countries: count,
      last_refreshed_at: metadata?.value || null
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/countries/image', async (_, res) => {
  try {
    const imagePath = path.join(__dirname, 'cache/summary.png');
    await fs.access(imagePath);
    return res.sendFile(imagePath);
  } catch (error) {
    return res.status(404).json({ error: 'Summary image not found' });
  }
});


app.listen(PORT, async () => {
  await sequelize.sync();
  console.log(`Server running on port ${PORT}`);
});