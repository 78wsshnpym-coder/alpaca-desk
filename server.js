const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const ALPACA_BASE = "https://paper-api.alpaca.markets";
const ALPACA_DATA = "https://data.alpaca.markets";

// Proxy voor trading API
app.all("/api/alpaca/*", async (req, res) => {
  const { key_id, secret_key } = req.headers;
  const endpoint = req.params[0];
  const url = `${ALPACA_BASE}/v2/${endpoint}${req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""}`;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        "APCA-API-KEY-ID": key_id,
        "APCA-API-SECRET-KEY": secret_key,
        "Content-Type": "application/json",
      },
      body: ["POST", "PUT", "PATCH"].includes(req.method)
        ? JSON.stringify(req.body)
        : undefined,
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Proxy voor data API (quotes)
app.all("/api/data/*", async (req, res) => {
  const { key_id, secret_key } = req.headers;
  const endpoint = req.params[0];
  const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const url = `${ALPACA_DATA}/v2/${endpoint}${qs}`;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        "APCA-API-KEY-ID": key_id,
        "APCA-API-SECRET-KEY": secret_key,
      },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Alpha Desk draait op poort ${PORT}`));
