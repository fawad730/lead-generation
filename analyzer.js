/**
 * Priority scoring for leads WITHOUT a website.
 * Since all leads have no website, we differentiate by rating & reviews
 * to help identify the best prospects to approach first.
 *
 * HIGH   = Low rating + few reviews  → Easiest sell (struggling business, needs help)
 * MEDIUM = Decent rating OR reviews  → Good prospect (growing but no web presence)
 * LOW    = High rating + many reviews → Harder sell (doing well without a website)
 */

function determinePriority(lead) {
    const rating = lead.rating || 0;
    const reviews = lead.reviews || 0;

    // HIGH PRIORITY: No/low rating AND few reviews — struggling business, easiest sell
    if (rating < 3.5 || reviews < 10) {
        let reasons = ['No website'];
        if (rating === 0) reasons.push('No rating on Google');
        else if (rating < 3.5) reasons.push(`Low rating (${rating})`);
        if (reviews < 10) reasons.push(`Very few reviews (${reviews})`);
        
        return {
            priority: 'HIGH',
            notes: reasons.join(' · ')
        };
    }

    // MEDIUM PRIORITY: Decent rating but moderate reviews — growing business
    if (rating < 4.2 || reviews < 50) {
        let reasons = ['No website'];
        if (rating < 4.2) reasons.push(`Rating could improve (${rating})`);
        if (reviews < 50) reasons.push(`Moderate reviews (${reviews})`);
        
        return {
            priority: 'MEDIUM',
            notes: reasons.join(' · ')
        };
    }

    // LOW PRIORITY: High rating + many reviews — doing well without website
    return {
        priority: 'LOW',
        notes: `No website · Strong offline presence (${rating}★, ${reviews} reviews)`
    };
}

module.exports = { determinePriority };
