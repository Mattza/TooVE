'use strict';
const express = require('express');
const http = require('http');
const exphbs = require('express-handlebars');
const parseXmlStr = require('xml2js').parseString;

const getDate = (time, addHour) => new Date(Date.UTC(
    time.substr(0, 4), time.substr(4, 2) - 1, time.substr(6, 2), parseInt(time.substr(8, 2)) + addHour, time.substr(10, 2)));
const getUrl = (channel, date) => `http://xmltv.xmltv.se/${channel}_${date}.xml`;
const programMapper = program => ({
  start: program.$.startDate.toTimeString().substr(0, 5),
  end: program.$.stopDate.toTimeString().substr(0, 5),
  title: program.title[0]._,
  desc: program.desc && program.desc[0]._,
  category: program.category && program.category.map(item => item._)
});

let hbs = exphbs.create({
  defaultLayout: 'main',
  helpers: {
    if_not_top3: (index, opts) => index > 2 ? opts.fn() : ''
  }
});

function fetchData(optionU, filter) {
  return new Promise((resolve, reject) => {
    let option = process.argv.some((arg) => arg === '--dev') ? {
          host: "proxyw.ppm.nu",
          port: 8080,
          path: optionU.url,
          headers: {
            host: "xmltv.xmltv.se"
          }
        } : optionU.url;
    http.get(option, res => {
      let rawData = '';
      res.on('data', (chunk) => rawData += chunk);
      res.on('error', reject);
      res.on('end', () => {
        parseXmlStr(rawData, (err, res) => {
          const data = res.tv.programme.filter(program => {
            program.$.stopDate = getDate(program.$.stop, -1);
            program.$.startDate = getDate(program.$.start, 0);
            return !filter || program.$.stopDate > new Date();
          });
          resolve({channel: option.display, program: data.map(programMapper)});
        });
      });
    })
  })
}

let getData = (date, filter) => {
  let dateStr = date.toISOString().split('T')[0];
  let channels = [
    {display: 'SVT1', code: 'svt1.svt.se'},
    {display: 'SVT2', code: 'svt2.svt.se'},
    {display: 'TV4', code: 'tv4.se'}
  ];
  channels.forEach(channel => channel.url = getUrl(channel.code, dateStr));
  return Promise.all(channels.map((option) => fetchData(option, filter)))
};

express()
    .engine('handlebars', hbs.engine)
    .set('view engine', 'handlebars')
    .use(require('compression')({level: 9}))
    .use('/static', express.static('static'))
    .get('/', (req, res) => {

      let date = new Date();
      let thisDay = '';
      if (req.query.date && req.query.date !== date.toISOString().split('T')[0]) {
        date = new Date(req.query.date);
        thisDay = date.getDate() + ' / ' + (date.getMonth() + 1);
      }
      date.setDate(date.getDate() - 1);
      let prevDay = date.toISOString().split('T')[0];
      date.setDate(date.getDate() + 2);
      let nextDay = date.toISOString().split('T')[0];
      date.setDate(date.getDate() - 1);
      getData(date, true).then(data => res.render('home', {data, prevDay, nextDay, thisDay}))
    })
    .use('/csr', express.static('static'))
    .get('/api', (req, res) => { //http://localhost:8082/api?date=2017-03-08
      let date = new Date();
      if (req.query.date && req.query.date !== date.toISOString().split('T')[0]) {
        date = new Date(req.query.date);
      }
      getData(date, false).then(data => res.send(data))
    })
    .listen(process.env.PORT || 8082);
console.log('port 8082');
