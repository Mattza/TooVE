'use strict';
const express = require('express');
const parseXmlStr = require('xml2js').parseString
function getDate(time) {
  let timeObj = {
    year: time.substr(0, 4),
    month: time.substr(4, 2),
    day: time.substr(6, 2),
    hour: time.substr(8, 2),
    minute: time.substr(10, 2)
  };
  return new Date(Date.UTC(timeObj.year, timeObj.month - 1, timeObj.day, timeObj.hour - 1, timeObj.minute));
}

function fetchData(option, resolve, reject) {
  http.get(option, res => {
    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => rawData += chunk);
    res.on('error', reject)
    res.on('end', () => {
      try {
        parseXmlStr(rawData, (err, res) => {
          var data = res.tv.programme.filter((program) => {
            program.$.stopDate = getDate(program.$.stop);
            program.$.startDate = getDate(program.$.start);
            return program.$.stopDate > new Date();
          })
          resolve({ channel: data[0].$.channel, program: data.map(programMapper) });
        })
      } catch (e) {
        reject(e.message);
      }
    });
  })
}

function programMapper(program) {
  return {
    start: program.$.startDate.toTimeString().substr(0, 5),
    end: program.$.stopDate.toTimeString().substr(0, 5),
    title: program.title[0]._,
    desc: program.desc && program.desc[0]._,
    category: program.category.map(item => item._)
  }
}

const getOption = (channel, date) => `http://xmltv.xmltv.se/${channel}_${date}.xml`;

express()
  .engine('handlebars', exphbs({ defaultLayout: 'main' }))
  .set('view engine', 'handlebars')
  .use('/static', express.static('static'))
  .get('/', (req, res) => {
    let options = [
      getOption('svt1.svt.se', new Date().toISOString().split('T')[0]),
      getOption('svt2.svt.se', new Date().toISOString().split('T')[0]),
      getOption('tv4.se', new Date().toISOString().split('T')[0])
    ];
    var promises = options.map(option => {
      return new Promise(function (resolve, reject) {
        fetchData(option, resolve, reject);
      })
    });
    Promise.all(promises).then(data => {
      console.log(data)
      res.render('home', { data });
    })
  })
  .listen(8081);