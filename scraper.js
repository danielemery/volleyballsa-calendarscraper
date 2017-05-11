const cheerio = require('cheerio'),
    request = require('request-promise');

var getGrades = (calendarUri) => {
    // Load main calendar page.
    return request({
        method: 'GET',
        uri: calendarUri,
        gzip: true
    }).then((html) => {
        // Scrape grade options from dropdown
        var $ = cheerio.load(html);
        var grades = [];
        var r = $('#fixtures-grade').children().each(function() {
            grades.push({
                name: $(this).text(),
                id: $(this).attr("value")
            });
        });
        return grades;
    });
}

var scrapeGrade = (name, calendarUri, gradeID) => {
    var uri = calendarUri + "?grade=" + gradeID;
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

module.exports = {
    getGrades: getGrades,
    scrapeGrade: scrapeGrade
}