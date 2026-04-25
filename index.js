const { fetchGoogleMapsLeads } = require('./apifyService');
const { analyzeWebsite, determinePriority } = require('./analyzer');
const { saveToJson, saveToCsv } = require('./save');

async function main() {
    console.log("=== Dental Clinic Lead Scraper ===");
    
    const queries = [
        "dental clinic in Islamabad",
        "dental clinic in Lahore"
    ];

    // 1. Fetch Data
    console.log("\n--- Step 1: Fetching Leads from Apify ---");
    let rawLeads = await fetchGoogleMapsLeads(queries);
    console.log(`\nTotal raw leads fetched: ${rawLeads.length}`);

    // BONUS: Remove duplicates
    // Using phone as unique identifier, fallback to name
    const uniqueLeadsMap = new Map();
    rawLeads.forEach(lead => {
        const key = lead.phone || lead.name;
        if (!uniqueLeadsMap.has(key)) {
            uniqueLeadsMap.set(key, lead);
        }
    });
    
    let leads = Array.from(uniqueLeadsMap.values());
    console.log(`Total unique leads after removing duplicates: ${leads.length}`);

    // Filter to keep ONLY leads without a website
    leads = leads.filter(lead => !lead.website);
    console.log(`Total leads after keeping ONLY those WITHOUT a website: ${leads.length}`);

    // 2. Analyze Websites and Determine Priority
    console.log("\n--- Step 2: Analyzing Websites & Filtering ---");
    for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        console.log(`Analyzing [${i+1}/${leads.length}]: ${lead.name}`);
        
        let siteAnalysis = { hasWebsite: false };
        if (lead.website) {
            siteAnalysis = await analyzeWebsite(lead.website);
        }

        const priorityData = determinePriority(lead, siteAnalysis);
        lead.priority = priorityData.priority;
        lead.notes = priorityData.notes;
    }

    // BONUS: Sort by priority (HIGH -> MEDIUM -> LOW)
    const priorityOrder = { 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    leads.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // 3. Save Output
    console.log("\n--- Step 3: Saving Data ---");
    saveToJson(leads, 'leads.json');
    saveToCsv(leads, 'leads.csv');

    console.log("\n=== Process Completed Successfully! ===");
}

main().catch(err => {
    console.error("An error occurred in main process:", err);
});
