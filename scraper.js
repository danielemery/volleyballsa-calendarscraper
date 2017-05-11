const cheerio = require('cheerio'),
    request = require('request-promise');

module.exports = (calendarUri) => {
    // Load main calendar page.
    return request({
        method: 'GET',
        uri: calendarUri,
        gzip: true
    }).then((html) => {
        // Scrape grade options from dropdown
        var promises = [];
        var $ = cheerio.load(html);
        var r = $('#fixtures-grade').children().each(function() {
            var gradeName = $(this).text();
            var gradeID = $(this).attr("value");
            // For each grade start a scrape task
            promises.push(scrapeGrade(gradeName, calendarUri + "?grade=" + gradeID));
        });

        return Promise.all(promises);
    });
}

var scrapeGrade = (name, uri) => {
    return request({
        method: 'GET',
        uri: uri,
        gzip: true
    }).then((html) => {
        var $ = cheerio.load(html);
        var rounds = [];
        var round;
        var date;
        $('tr').each(function() {
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
                    teams = teams.split(" v ");

                    var location = match.next().next();
                    var time = location.next();

                    date.games.push({
                        teams: teams,
                        duty: duty.replace("Duty Team: ",""),
                        time: time.text(),
                        location: location.text()
                    });
                    break;
            }
        });
        return {
            name: name,
            rounds: rounds
        }
    });
}