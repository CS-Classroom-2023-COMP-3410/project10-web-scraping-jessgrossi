const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Generate date ranges for each month in 2025
const months = [
    { start: "2025-01-01", end: "2025-02-01" },
    { start: "2025-02-01", end: "2025-03-01" },
    { start: "2025-03-01", end: "2025-04-01" },
    { start: "2025-04-01", end: "2025-05-01" },
    { start: "2025-05-01", end: "2025-06-01" },
    { start: "2025-06-01", end: "2025-07-01" },
    { start: "2025-07-01", end: "2025-08-01" },
    { start: "2025-08-01", end: "2025-09-01" },
    { start: "2025-09-01", end: "2025-10-01" },
    { start: "2025-10-01", end: "2025-11-01" },
    { start: "2025-11-01", end: "2025-12-01" },
    { start: "2025-12-01", end: "2026-01-01" } // End date is next year's first day
];

let events = [];

const fetchEventsForMonth = async (start_date, end_date) => {
    try {
        // Construct URL for the current month
        const url = `https://www.du.edu/calendar?search=&start_date=${start_date}&end_date=${end_date}#events-listing-date-filter-anchor`;

        console.log(`Fetching events from ${start_date} to ${end_date}...`);

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);

        $('[class*="events-listing__item"]').each((_, element) => {
            const title = $(element).find('h3').text().trim();
            let rawDate = $(element).find('p').text().trim();

            let eventDate = "N/A";
            let eventTime = "N/A";
            let extraInfo = "";

            // Extract date (Month Day format)
            const dateMatch = rawDate.match(/(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}/);
            if (dateMatch) {
                eventDate = `${dateMatch[0]}, 2025`; // Ensure full date
            }

            // Extract time if present
            const timeMatch = rawDate.match(/\d{1,2}:\d{2}\s?(AM|PM)?\s?-\s?\d{1,2}:\d{2}\s?(AM|PM)?/i);
            if (timeMatch) {
                eventTime = timeMatch[0]; // Extract time
            }

            // Extract extra location/venue text
            extraInfo = rawDate.replace(dateMatch ? dateMatch[0] : "", "").replace(timeMatch ? timeMatch[0] : "", "").trim();
            if (extraInfo.toLowerCase().includes("view details")) {
                extraInfo = extraInfo.replace(/view details/i, "").trim();
            }

            // Extract additional description if available
            let description = $(element)
                .find('.event-description, .description, .summary, .event-summary, p')
                .not($(element).find('p').first()) // Exclude the first paragraph (since it contains date info)
                .first()
                .text()
                .trim();

            // Append extra info to the description if it exists
            if (extraInfo) {
                description = description ? `${description} | ${extraInfo}` : extraInfo;
            }

            // Ensure only events in 2025 are included
            if (eventDate.includes("2025")) {
                events.push({ title, date: eventDate, time: eventTime, description: description || "N/A" });
            }
        });

        console.log(`Finished scraping events from ${start_date} to ${end_date}`);

    } catch (error) {
        console.error(`Error fetching events for ${start_date} - ${end_date}:`, error);
    }
};

// Fetch events for all months sequentially
const fetchAllMonths = async () => {
    for (let month of months) {
        await fetchEventsForMonth(month.start, month.end);
    }

    // Save events to JSON
    fs.writeFileSync('results/calendar_events.json', JSON.stringify({ events }, null, 2));
    console.log('Scraped events saved to results/calendar_events.json');
};

fetchAllMonths();
