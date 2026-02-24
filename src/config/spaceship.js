const axios = require('axios');

const API_KEY = process.env.SPACESHIP_API_KEY;
const API_SECRET = process.env.SPACESHIP_API_SECRET;
const BASE_URL = process.env.SPACESHIP_API_BASE_URL || 'https://spaceship.dev/api/v1';

const spaceship = (API_KEY && API_SECRET)
  ? axios.create({
      baseURL: BASE_URL,
      timeout: 15000,
      headers: {
        'X-Api-Key': API_KEY,
        'X-Api-Secret': API_SECRET,
        'Content-Type': 'application/json',
      },
    })
  : null;

if (!spaceship) {
  console.warn('Spaceship API not configured — domain features disabled');
}

module.exports = { spaceship, BASE_URL };
