const axios = require('axios');
const cheerio = require('cheerio');

async function analyzeWebsite(url) {
    if (!url) {
        return { hasWebsite: false };
    }

    // Ensure URL has protocol
    let targetUrl = url;
    if (!targetUrl.startsWith('http')) {
        targetUrl = 'http://' + targetUrl;
    }

    try {
        // Quick timeout so we don't hang on bad sites or slow servers
        const response = await axios.get(targetUrl, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // Check for basic structure and viewport meta tag
        const hasViewport = $('meta[name="viewport"]').length > 0;

        // Determine if request is https by looking at response URL or config
        const isHttps = response.request?.res?.client?._httpMessage?.agent?.protocol === 'https:' || targetUrl.startsWith('https');

        return {
            hasWebsite: true,
            isHttps: isHttps,
            hasViewport: hasViewport,
            status: response.status
        };

    } catch (error) {
        // If website is unreachable, times out, or has SSL errors
        return {
            hasWebsite: true,
            isHttps: false,
            hasViewport: false,
            error: error.message
        };
    }
}

function determinePriority(lead, siteAnalysis) {
    // HIGH PRIORITY: No website or website missing/empty/unreachable
    if (!lead.website || !siteAnalysis.hasWebsite || siteAnalysis.error) {
        return {
            priority: 'HIGH',
            notes: 'No website or website is unreachable.'
        };
    }

    // MEDIUM PRIORITY: Website exists BUT rating < 4.2, reviews < 50, OR website looks outdated
    const isOutdated = !siteAnalysis.isHttps || !siteAnalysis.hasViewport;
    const lowRating = lead.rating < 4.2;
    const fewReviews = lead.reviews < 50;

    if (lowRating || fewReviews || isOutdated) {
        let reasons = [];
        if (lowRating) reasons.push('Low rating (< 4.2)');
        if (fewReviews) reasons.push('Few reviews (< 50)');
        if (isOutdated) reasons.push('Outdated website (No HTTPS or missing viewport)');

        return {
            priority: 'MEDIUM',
            notes: `Needs improvement: ${reasons.join(', ')}`
        };
    }

    // LOW PRIORITY: Strong presence
    return {
        priority: 'LOW',
        notes: 'Strong presence (Good website, high rating, many reviews).'
    };
}

module.exports = { analyzeWebsite, determinePriority };
