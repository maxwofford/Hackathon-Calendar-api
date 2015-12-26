'use strict';

import Koa from 'koa';
import 'babel-polyfill';
import Octokat from 'octokat';
import Router from 'koa-router';
import marked from 'marked';

const app = Koa();
const router = Router();
const octo = new Octokat();
const repo = octo.repos('japacible', 'Hackathon-Calendar');
const port = (process.env.PORT || 5000);

app
  .use(router.routes())
  .use(router.allowedMethods());

function formatDate(date) {
  return new Date(date).toISOString().substr(0, 10);
}

function getHackathonsFrom(markdown) {
  let tokens = marked.lexer(markdown);
  let hackathons = [];
  for (let key of Object.keys(tokens)) {
    if (tokens[key]['type'] === 'table') {
      let year = tokens[key]['header'][tokens[key]['header'].length - 1];
      hackathons.push.apply(hackathons, tokens[key]['cells']);
      for (let hackathon of hackathons) {
        hackathon.push(year);
      }
    }
  }
  return hackathons.map((hackathon) => {
    let name = hackathon[0].match(/\[([^\)]+)\]/i)[1];
    let url = hackathon[0].match(/\(([^\)]+)\)/i)[1];
    let location = hackathon[1];
    let date = hackathon[2];
    let year = hackathon[3].match(/\(([^\)]+)\)/i)[1];
    let dates = date.split('-');
    let startDate = formatDate(`${dates[0]} ${year}`);
    let endDate = formatDate(`${dates[dates.length - 1]} ${year}`);
    return {
      "name": name,
      "url": url,
      "location": location,
      "startDate": startDate,
      "endDate": endDate
    };
  });
}

router
  .get('/', function *(next) {
    let message = `An API list of hackathons from
    https://github.com/japacible/Hackathon-Calendar

Endpoints:

- [/upcoming](/upcoming) | get a list of upcoming hackathons

- [/past](/past) | get a list of past hackathons

- [/ping](/ping) | Pong`;
    this.body = marked(message);
  })
  .get('/ping', function *(next) {
    this.body = 'PONG';
  })
  .get('/upcoming', function *(next) {
    this.body = yield repo.contents('README.md').read()
      .then((contents) => {
        return getHackathonsFrom(contents);
      });
  })
  .get('/past', function *(next) {
    this.body = yield repo.contents('Past-Hackathons.md').read()
      .then((contents) => {
        return getHackathonsFrom(contents);
      });
  });

app.listen(port);
