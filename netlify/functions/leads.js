const { fetchGoogleMapsLeads } = require('../../apifyService');
const { determinePriority } = require('../../analyzer');

exports.handler = async (event, context) => {
    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const city = event.queryStringParameters.city;

    if (!city) {
        return { 
            statusCode: 400, 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Missing "city" query parameter.' }) 
        };
    }

    const normalizedCity = city.trim();

    try {
        console.log(`[Netlify Function] Received request for city: ${normalizedCity}`);
        
        // 1. Fetch raw leads from Apify
        const query = `dental clinic in ${normalizedCity}`;
        let rawLeads = await fetchGoogleMapsLeads([query]);

        // 2. Remove duplicates
        const uniqueMap = new Map();
        rawLeads.forEach(lead => {
            const key = lead.phone || lead.name;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, lead);
            }
        });
        let leads = Array.from(uniqueMap.values());

        // 3. Keep ONLY leads WITHOUT a website
        leads = leads.filter(lead => !lead.website);

        // 4. Assign priority based on rating/reviews
        for (let i = 0; i < leads.length; i++) {
            const lead = leads[i];

            const { priority, notes } = determinePriority(lead);
            lead.priority = priority;
            lead.notes = notes;
        }

        // 5. Sort by priority
        const order = { HIGH: 1, MEDIUM: 2, LOW: 3 };
        leads.sort((a, b) => order[a.priority] - order[b.priority]);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ leads, total: leads.length })
        };

    } catch (err) {
        console.error('[Netlify Function] Error:', err.message);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Failed to fetch leads. ' + err.message })
        };
    }
};
