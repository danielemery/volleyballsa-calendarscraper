const ical = require('ical-generator'),
    moment = require('moment-timezone'),
    fs = require("fs"),
    scraper = require('./scraper');

const DATE_FORMAT = 'dddd Do MMMM YYYY HH:mma';
const TIME_ZONE = "Australia/Adelaide";

const CALENDAR_URI = 'http://www.volleyballsa.com.au/stateleague/fixtures';
const MATCH_DURATION = 1000 * 60 * 90; //90 Minutes

const CALENDAR_DIRECTORY = './calendars';

scraper(CALENDAR_URI).then((calendarData) => {
    sortIntoTeams(calendarData, (teamData) => {
        if (!fs.existsSync(CALENDAR_DIRECTORY)){
            fs.mkdirSync(CALENDAR_DIRECTORY);
        }
        Object.keys(teamData).forEach((v) => {
            let cal = ical({
                domain: 'auvc.com.au',
                name: v + " 2017 State League",
                timezone: TIME_ZONE
            });
            let data = teamData[v];
            data.games.forEach((g) => {
                cal.createEvent({
                    summary: g.name,
                    location: g.location,
                    start: g.datetime,
                    end: new Date(g.datetime.getTime() + MATCH_DURATION)
                });
            });
            data.duties.forEach((d) => {
                cal.createEvent({
                    summary: d.name,
                    location: d.location,
                    start: d.datetime,
                    end: new Date(d.datetime.getTime() + MATCH_DURATION)
                });
            });
            fs.writeFileSync(CALENDAR_DIRECTORY + "/" + v + ".ics", cal.toString());
        });
    })
});

var sortIntoTeams = (roundData, callback) => {
    let result = {};
    roundData.forEach((league) => {
        league.rounds.forEach((round) => {
            round.dates.forEach((date) => {
                date.games.forEach((game) => {
                    let dateTime = moment.tz(date.date + " " + game.time, DATE_FORMAT, TIME_ZONE).tz("UTC").toDate();
                    game.teams.forEach((team) => {
                        team = ensureInitialised(result, team);
                        team.games.push({
                            name: round.name + ": " + game.teams[0] + " vs " + game.teams[1],
                            datetime: dateTime,
                            location: game.location
                        });
                    });
                    let dutyTeam = ensureInitialised(result, game.duty);
                    dutyTeam.duties.push({
                        name: "DUTY: " + game.teams[0] + " vs " + game.teams[1],
                        datetime: dateTime,
                        location: game.location
                    });
                });
            });
        });
    });
    callback(result);
}

var ensureInitialised = (map, teamName) => {
    if(!map[teamName]) {
        map[teamName] = {
            games: [],
            duties: []
        }
    }
    return map[teamName];
}