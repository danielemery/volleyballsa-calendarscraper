const ical = require('ical');
const scraper = require('./scraper');

const calendarUri = 'http://www.volleyballsa.com.au/stateleague/fixtures';

scraper(calendarUri, function(calendarData){
    console.log(JSON.stringify(calendarData));
});