const cheerio = require('cheerio'),
    request = require('request');

module.exports = function(calendarUri, callback) {
    // Load main calendar page.
    request({
        method: 'GET',
        uri: calendarUri,
        gzip: true
    }, function(err, response, html) {
        if(err) {
            console.log(err);
            return;
        }
        // Scrape grade options from dropdown
        var promises = [];
        var $ = cheerio.load(html);
        var r = $('#fixtures-select').children().each(function(){
            var gradeName = $(this).text();
            var gradeID = $(this).attr("value");
            // For each grade start a scrape task
            promises.push(new Promise((resolve, reject) => {
                scrapeGrade(gradeName, calendarUri + "?grade=" + gradeID, function(err, scrapedGrade){
                    resolve(scrapedGrade);
                });
            }));
        });

        Promise.all(promises).then(callback);
    });
}

function scrapeGrade(name, uri, callback) {
    request({
        method: 'GET',
        uri: uri,
        gzip: true
    }, function(err, response, html){
        if(err) {
            callback(err);
            return;
        } else {
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
            callback(null, {
                name: name,
                rounds: rounds
            });
        }
    });
}