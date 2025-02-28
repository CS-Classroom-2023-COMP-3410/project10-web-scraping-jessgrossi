const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

axios.get('https://bulletin.du.edu/undergraduate/majorsminorscoursedescriptions/traditionalbachelorsprogrammajorandminors/computerscience/#coursedescriptionstext')
    .then(response => {
        const $ = cheerio.load(response.data);
        const courses = [];

        // Loop through each course block
        $('.courseblock').each((index, element) => {
            // Extract the course code and title
            const courseTitleText = $(element).find('.courseblocktitle').text().replace(/\s+/g, ' ').trim();
            const courseCodeMatch = courseTitleText.match(/COMP\s*\d{4}/);
            const courseCode = courseCodeMatch ? courseCodeMatch[0] : '';
            const courseTitle = courseTitleText.replace(/COMP\s*\d{4}\s*/, '').split('(')[0].trim();

            // Extract the course description
            const courseDescription = $(element).find('.courseblockdesc').text().toLowerCase();

            // Check if it's an upper-division course with no prerequisites
            const isUpperDivision = /COMP\s*[34]\d{3}/.test(courseCode);
            const hasNoPrerequisites = !courseDescription.includes('prerequisite');

            // If it matches the criteria, save it
            if (isUpperDivision && hasNoPrerequisites) {
                courses.push({
                    course: courseCode,
                    title: courseTitle
                });
            }
        });

        // Save to JSON file
        if (!fs.existsSync('results')) {
            fs.mkdirSync('results');
        }
        fs.writeFileSync('results/bulletin.json', JSON.stringify({ courses }, null, 4));

        console.log('Scraping complete. Data saved to results/bulletin.json');
    })
    .catch(error => {
        console.error('Error fetching and parsing the page: ', error);
    });