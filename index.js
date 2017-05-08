const cheerio = require('cheerio'),
    request = require('request'),
    ical = require('ical');

const calendarUri = 'http://www.volleyballsa.com.au/stateleague/fixtures';

request({
    method: 'GET',
    uri: calendarUri,
    gzip: true
}, function(err, response, html) {
    if(err) {
        console.log(err);
        return;
    }
    var $ = cheerio.load(html);
    var r = $('#fixtures-select').children().each(function(){
        var gradeName = $(this).text();
        var gradeID = $(this).attr("value");
        createCalendar(gradeName, calendarUri + "?grade=" + gradeID);
        return false; // TODO Remove
    });
});

function createCalendar(name, uri) {
    request({
        method: 'GET',
        uri: uri,
        gzip: true
    }, function(err, response, html){
        if(err) {
            console.log(err);
            return;
        }
        var $ = cheerio.load(html);
        var rounds = [];
        var round;
        var date;
        $('tr').each(function(){
            var tr = $(this);
            var c = tr.attr('class');
            switch(c) {
                case "round":
                    round = { 
                        name: tr.find("th").text(),
                        dates: []
                    }
                    rounds.push(round);
                    break;
                case "date":
                    date = {
                        date: tr.find("th").text(),
                        games : []
                    };
                    round.dates.push(date);
                    break;
                case "result":
                case "result last":
                    var match = tr.children().first();

                    var duty = match.find(".note").text();
                    var teams = match.text().replace(duty, "");

                    var location = match.next().next();
                    var time = location.next();

                    date.games.push({
                        teams: teams,
                        duty: duty,
                        time: time.text(),
                        location: location.text()
                    });
                    break;
            }
        });

        console.log(JSON.stringify({
            name: name,
            rounds: rounds
        }));
    });
}