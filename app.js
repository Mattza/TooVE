'use strict';
function insertAt(src, index, str) {
  return src.substr(0, index) + str + src.substr(index);
}

var options = {
  host: "proxyw.ppm.nu",
  port: 8080,
  path: 'http://xmltv.xmltv.se/svt1.svt.se_2017-01-30.xml',
  headers: {
    host: "xmltv.xmltv.se"
  }
};

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
require('http').get(options, res => {
  res.setEncoding('utf8');
  let rawData = '';
  res.on('data', (chunk) => rawData += chunk);
  res.on('end', () => {
    try {
      require('xml2js').parseString(rawData, (err, res) => {
        res.tv.programme.filter((program) => {
          program.$.stopDate = getDate(program.$.stop);
          program.$.startDate = getDate(program.$.start);
          return program.$.stopDate > new Date();
        }).map(item => {
          console.log(`${item.$.startDate}\t${item.title[0]._}`)
        })
      });

    } catch (e) {
      console.log(e.message);
    }
  });
})
