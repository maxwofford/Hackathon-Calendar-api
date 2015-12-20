'use strict';

import Koa from 'koa';
import Router from 'koa-router';
import marked from 'marked';
import 'babel-polyfill';
import Octokat from 'octokat';

let app = Koa();
let router = Router();
let octo = new Octokat();
let repo = octo.repos('japacible', 'Hackathon-Calendar');

const port = (process.env.PORT || 5000);

app
  .use(router.routes())
  .use(router.allowedMethods());

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
  return hackathons;
}

router
  .get('/', function *(next) {
    let message = `Endpoints:

- [/upcoming](/upcoming) | get a list of upcoming hackathons

- [/past](/past) | get a list of past hackathons

- [/ping](/ping) | Pong`;
    this.body = marked(message);
  })
  .get('/ping', function *(next) {
    this.body = 'PONG';
  })
  .get('/upcoming',function *(next) {
    this.body = yield repo.contents('README.md').read()
      .then((contents) => {
        return getHackathonsFrom(contents);
      });
  })
  .get('/past',function *(next) {
    this.body = yield repo.contents('Past-Hackathons.md').read()
      .then((contents) => {
        return getHackathonsFrom(contents);
      });
  });

app.listen(port);
