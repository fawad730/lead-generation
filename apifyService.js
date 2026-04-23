const { ApifyClient } = require('apify-client');
require('dotenv').config();

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

async function fetchGoogleMapsLeads(queries) {
    let allLeads = [];

    for (const query of queries) {
        console.log(`\nStarting Apify actor for query: "${query}"...`);
        try {
            // Prepare Actor input
            const input = {
                searchStringsArray: [query],
                maxCrawledPlacesPerSearch: 20, // Small limit for testing, can be adjusted
                language: "en",
                region: "PK"
            };

            // Run the Google Maps Scraper Actor (compass/crawler-google-places is standard for maps scraping)
            const run = await client.actor("compass/crawler-google-places").call(input);
            console.log(`Actor run completed for "${query}". Fetching results...`);

            // Fetch results from the run's dataset
            const { items } = await client.dataset(run.defaultDatasetId).listItems();
            console.log(`Fetched ${items.length} results for "${query}".`);

            // Process items
            items.forEach(item => {
                allLeads.push({
                    name: item.title || "",
                    city: query.includes("Islamabad") ? "Islamabad" : "Lahore", // Basic city detection from query
                    phone: item.phone || item.phoneUnformatted || "",
                    website: item.website || "",
                    mapUrl: item.url || "",
                    rating: item.totalScore || 0,
                    reviews: item.reviewsCount || 0
                });
            });
        } catch (error) {
            console.error(`Error fetching leads for "${query}":`, error.message);
        }
    }

    return allLeads;
}

module.exports = { fetchGoogleMapsLeads };
