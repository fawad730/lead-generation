const { ApifyClient } = require('apify-client');
require('dotenv').config();

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

/**
 * Check if a URL is a real business website (not just a social media page).
 * Social media pages (Facebook, Instagram, etc.) don't count as a proper website.
 */
function isRealWebsite(url) {
    if (!url) return false;
    const socialPatterns = [
        'facebook.com', 'fb.com',
        'instagram.com',
        'twitter.com', 'x.com',
        'youtube.com', 'youtu.be',
        'tiktok.com',
        'linkedin.com',
        'wa.me', 'whatsapp.com',
    ];
    const lowerUrl = url.toLowerCase();
    return !socialPatterns.some(pattern => lowerUrl.includes(pattern));
}

async function fetchGoogleMapsLeads(queries) {
    let allLeads = [];

    for (const query of queries) {
        console.log(`\nStarting Apify actor for query: "${query}"...`);
        try {
            // Extract city from query for locationQuery
            const city = query.split(" in ")[1] || "";

            // Prepare Actor input with proper geolocation for Pakistan
            const input = {
                searchStringsArray: [query],
                maxCrawledPlacesPerSearch: 100,
                language: "en",
                countryCode: "pk",
            };

            // Run the Google Maps Scraper Actor
            const run = await client.actor("compass/crawler-google-places").call(input);
            console.log(`Actor run completed for "${query}". Fetching results...`);

            // Fetch results from the run's dataset
            const { items } = await client.dataset(run.defaultDatasetId).listItems();
            console.log(`Fetched ${items.length} results for "${query}".`);

            // Process items
            items.forEach(item => {
                const rawWebsite = item.website || "";
                allLeads.push({
                    name: item.title || "",
                    city: city || "Pakistan",
                    phone: item.phone || item.phoneUnformatted || "",
                    website: isRealWebsite(rawWebsite) ? rawWebsite : "",  // Treat social media as no website
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
