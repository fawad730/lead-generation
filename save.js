const fs = require('fs');

function saveToJson(data, filename) {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Saved JSON data to ${filename}`);
}

function saveToCsv(data, filename) {
    if (data.length === 0) {
        console.log(`No data to save for ${filename}`);
        return;
    }

    // Define CSV headers
    const headers = ['name', 'city', 'phone', 'website', 'mapUrl', 'rating', 'reviews', 'priority', 'notes'];
    
    // Create CSV content
    const csvRows = [];
    csvRows.push(headers.join(',')); // Header row

    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header] === null || row[header] === undefined ? '' : row[header];
            // Escape quotes and wrap in quotes if there's a comma or newline
            const stringVal = String(val);
            if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
                return `"${stringVal.replace(/"/g, '""')}"`;
            }
            return stringVal;
        });
        csvRows.push(values.join(','));
    }

    fs.writeFileSync(filename, csvRows.join('\n'), 'utf-8');
    console.log(`Saved CSV data to ${filename}`);
}

module.exports = { saveToJson, saveToCsv };
