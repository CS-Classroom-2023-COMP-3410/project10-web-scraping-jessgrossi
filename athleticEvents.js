const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const url = 'https://denverpioneers.com/index.aspx';

axios.get(url)
    .then(response => {
        const $ = cheerio.load(response.data);
        let scriptContent = '';

        // Search for the script that contains "type":"events"
        $('script').each((i, element) => {
            const scriptText = $(element).html();
            if (scriptText.includes('"type":"events"')) {  // Target only event data
                scriptContent = scriptText;
            }
        });

        if (!scriptContent) {
            console.error('Could not find the event data script.');
            return;
        }

        // Extract JSON object
        const jsonMatch = scriptContent.match(/var obj = (\{.*?\});/s);
        if (!jsonMatch) {
            console.error('Could not extract JSON data.');
            return;
        }

        let eventData;
        try {
            eventData = JSON.parse(jsonMatch[1]);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return;
        }

        if (!eventData.data || !Array.isArray(eventData.data)) {
            console.error('No event data found.');
            return;
        }

        // Extract relevant details
        const events = eventData.data.map(event => ({
            duTeam: event.sport ? event.sport.title : 'Unknown',
            opponent: event.opponent ? event.opponent.name : 'Unknown',
            date: event.date ? event.date : 'Unknown'
        }));

        // Save the results as JSON
        const data = { events };

        fs.writeFileSync('results/athletic_events.json', JSON.stringify(data, null, 4));
        console.log('Data successfully saved to results/athletic_events.json');
    })
    .catch(error => {
        console.error('Error fetching the URL:', error);
    });
