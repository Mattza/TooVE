'use strict';
const express = require('express');
const http = require('http');
const exphbs = require('express-handlebars');
const parseXmlStr = require('xml2js').parseString

const getDate = (time, addHour) => new Date(Date.UTC(
  time.substr(0, 4), time.substr(4, 2) - 1, time.substr(6, 2), time.substr(8, 2) + (addHour ? 1 : 0), time.substr(10, 2)));
const getUrl = (channel, date) => `http://xmltv.xmltv.se/${channel}_${date}.xml`;
const programMapper = program => ({
  start: program.$.startDate.toTimeString().substr(0, 5),
  end: program.$.stopDate.toTimeString().substr(0, 5),
  title: program.title[0]._,
  desc: program.desc && program.desc[0]._,
  category: program.category && program.category.map(item => item._)
})

let hbs = exphbs.create({
  defaultLayout: 'main',
  helpers: {
    if_not_top3: (index, opts) => index > 2 ? opts.fn() : ''
  }
});

function fetchData(option) {
  return new Promise((resolve, reject) => {
    http.get(option.url, res => {
      let rawData = '';
      res.on('data', (chunk) => rawData += chunk);
      res.on('error', reject)
      res.on('end', () => {
        parseXmlStr(rawData, (err, res) => {
          var data = res.tv.programme.filter((program) => {
            program.$.stopDate = getDate(program.$.stop, true);
            program.$.startDate = getDate(program.$.start, false);
            return program.$.stopDate > new Date();
          })
          resolve({ channel: option.display, program: data.map(programMapper) });
        })
      });
    })
  })
}


express()
  .engine('handlebars', hbs.engine)
  .set('view engine', 'handlebars')
  .use(require('compression')({ level: 9 }))
  .use('/static', express.static('static'))
  .get('/', (req, res) => {

    let date = new Date();
    let thisDay = '';
    if (req.query.date && req.query.date !== date.toISOString().split('T')[0]) {
      console.log(req.query.date);
      date = new Date(req.query.date);
      thisDay = date.getDate() + ' / ' + (date.getMonth() + 1);
    }
    let dateStr = date.toISOString().split('T')[0];
    let channels = [
      { display: 'SVT1', code: 'svt1.svt.se' },
      { display: 'SVT2', code: 'svt2.svt.se' },
      { display: 'TV4', code: 'tv4.se' }
    ];
    date.setDate(date.getDate() - 1)
    let prevDay = date.toISOString().split('T')[0];
    date.setDate(date.getDate() + 2)
    let nextDay = date.toISOString().split('T')[0];
    channels.forEach(channel => channel.url = getUrl(channel.code, dateStr));
    Promise.all(channels.map(fetchData))
      .then(data => res.render('home', { data, prevDay, nextDay, thisDay }))
  })
  .listen(process.env.PORT || 8081);
console.log('port 8081');
