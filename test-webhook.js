const axios = require('axios');

async function testSheet() {
    const url = "https://script.google.com/macros/s/AKfycbwD-N5RdP2n4MhdUvgwQwLLn_H6kcI_60HFTBLQQvDycTTuxXaiBLyewvFbunjIzQ3_pg/exec";
    
    try {
        const res = await axios.post(url, {
            name: "Test Dental Clinic",
            city: "Islamabad",
            phone: "1234567890",
            website: "https://example.com",
            mapUrl: "https://maps.google.com",
            rating: 4.5,
            reviews: 100,
            priority: "LOW",
            notes: "Test note"
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('Status:', res.status);
        console.log('Data:', res.data);
    } catch (err) {
        console.log('Error:', err.response ? err.response.data : err.message);
    }
}

testSheet();
