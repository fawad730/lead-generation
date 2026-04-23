const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { fetchGoogleMapsLeads } = require('./apifyService');
const { analyzeWebsite, determinePriority } = require('./analyzer');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, 'public')));

// ── API Route ─────────────────────────────────────────────
app.get('/api/leads', async (req, res) => {
    const city = req.query.city;

    if (!city) {
        return res.status(400).json({ error: 'Missing "city" query parameter.' });
    }

    const normalizedCity = city.trim();
    const validCities = ['islamabad', 'lahore'];

    if (!validCities.includes(normalizedCity.toLowerCase())) {
        return res.status(400).json({ error: `Invalid city. Supported: ${validCities.join(', ')}` });
    }

    console.log(`\n[API] Received request for city: ${normalizedCity}`);

    try {
        // 1. Fetch raw leads from Apify
        const query = `dental clinic in ${normalizedCity}`;
        let rawLeads = await fetchGoogleMapsLeads([query]);
        console.log(`[API] Fetched ${rawLeads.length} raw leads.`);

        // 2. Remove duplicates (by phone, fallback to name)
        const uniqueMap = new Map();
        rawLeads.forEach(lead => {
            const key = lead.phone || lead.name;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, lead);
            }
        });
        let leads = Array.from(uniqueMap.values());
        console.log(`[API] ${leads.length} unique leads after dedup.`);

        // 3. Analyze websites & assign priority
        for (let i = 0; i < leads.length; i++) {
            const lead = leads[i];
            console.log(`[API] Analyzing [${i + 1}/${leads.length}]: ${lead.name}`);

            let siteAnalysis = { hasWebsite: false };
            if (lead.website) {
                siteAnalysis = await analyzeWebsite(lead.website);
            }

            const { priority, notes } = determinePriority(lead, siteAnalysis);
            lead.priority = priority;
            lead.notes = notes;
        }

        // 4. Sort by priority (HIGH → MEDIUM → LOW)
        const order = { HIGH: 1, MEDIUM: 2, LOW: 3 };
        leads.sort((a, b) => order[a.priority] - order[b.priority]);

        console.log(`[API] Returning ${leads.length} analyzed leads.`);
        return res.json({ leads, total: leads.length });

    } catch (err) {
        console.error('[API] Error:', err.message);
        return res.status(500).json({ error: 'Failed to fetch leads. ' + err.message });
    }
});

// ── Fallback: serve index.html for any non-API route ──────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start Server ──────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🦷 Dental Lead Finder API running at http://localhost:${PORT}`);
    console.log(`   Dashboard → http://localhost:${PORT}`);
    console.log(`   API       → http://localhost:${PORT}/api/leads?city=Islamabad\n`);
});
