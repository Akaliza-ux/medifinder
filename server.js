const express = require('express');
const axios = require('axios');
const path = require('path');
const haversine = require('haversine-distance'); // we will add fallback for distance below

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// --- API: find healthcare facilities using Overpass API (OpenStreetMap)
app.get('/api/places', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const q = req.query.q || 'clinic|hospital|doctors|healthcare';

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ error: 'lat and lon required' });
    }

    // Overpass QL: find amenity=hospital/clinic/doctor within 5000m
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node(around:5000,${lat},${lon})[amenity~"${q}"];
        way(around:5000,${lat},${lon})[amenity~"${q}"];
        relation(around:5000,${lat},${lon})[amenity~"${q}"];
      );
      out center 20;
    `;
    const url = 'https://overpass-api.de/api/interpreter';
    const resp = await axios.post(url, overpassQuery, {
      headers: { 'Content-Type': 'text/plain' },
    });
    const elements = resp.data.elements || [];
    // Map to simple format
    const places = elements.map(e => {
      const latE = e.lat || (e.center && e.center.lat);
      const lonE = e.lon || (e.center && e.center.lon);
      return {
        id: e.id,
        name: (e.tags && (e.tags.name || e.tags['official_name'])) || 'Unknown',
        type: e.tags && (e.tags.amenity || e.tags.shop || null),
        addr: e.tags && (e.tags['addr:full'] || e.tags['addr:street'] || null),
        lat: latE,
        lon: lonE
      };
    }).filter(p => p.lat && p.lon);

    // compute distance (meters)
    const origin = { lat, lon };
    const withDist = places.map(p => {
      // simple haversine:
      function toRad(v) { return v * Math.PI / 180; }
      const R = 6371000;
      const dLat = toRad(p.lat - origin.lat);
      const dLon = toRad(p.lon - origin.lon);
      const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(toRad(origin.lat))*Math.cos(toRad(p.lat))*Math.sin(dLon/2)*Math.sin(dLon/2);
      const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const dist = R * c;
      return {...p, distance_m: Math.round(dist)};
    });

    // sort by distance
    withDist.sort((a,b) => a.distance_m - b.distance_m);
    res.json({ count: withDist.length, places: withDist });
  } catch (err) {
    console.error(err.toString().slice(0,300));
    res.status(500).json({ error: 'failed to fetch places', detail: err.message });
  }
});

// --- API: drug info using RxNav
app.get('/api/drug/:name', async (req, res) => {
  try {
    const name = req.params.name;
    // 1) find RxCUI by approximate name
    const searchUrl = `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(name)}`;
    const searchResp = await axios.get(searchUrl);
    const candidates = searchResp.data.drugGroup && searchResp.data.drugGroup.conceptGroup || [];
    // find first candidate
    const rxcui = (candidates.flatMap(g => (g.conceptProperties || [])).map(p => p.rxcui)[0]) || null;
    if (!rxcui) {
      return res.json({ name, message: 'No drug found' });
    }

    // 2) get drug label / properties
    const propUrl = `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/properties.json`;
    const propResp = await axios.get(propUrl);

    // 3) get interactions (drug interactions)
    const interactionsUrl = `https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui=${rxcui}`;
    const interResp = await axios.get(interactionsUrl);

    res.json({
      name,
      rxcui,
      properties: propResp.data.properties || {},
      interactions: interResp.data.interactionTypeGroup || []
    });
  } catch (err) {
    console.error(err.toString().slice(0,300));
    res.status(500).json({ error: 'drug lookup failed', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`MediFinder running on port ${PORT}`);
});
