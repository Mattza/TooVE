'use strict';
const express = require('express');
const http = require('http');
const parseXmlStr = require('xml2js').parseString;
const getDate = time => new Date(Date.UTC(time.substr(0, 4), time.substr(4, 2) - 1, time.substr(6, 2), time.substr(8, 2) - 1, time.substr(10, 2)));
const getProxyOption = (option, proxyUrl) => ({host: proxyUrl.substr(7, 13), port: 8080, path: option, headers: {host: 'xmltv.xmltv.se'}});

let cache = {};

const fetchData = (cacheKey, res, resolve, reject) => {
  let rawData = '';
  res.on('data', chunk => rawData += chunk);
  res.on('error', reject);
  res.on('end', () => {
    try {
      parseXmlStr(rawData, (err, res) => {
        if (!(res && res.tv.programme)) {
          resolve({channel: option.path.split('/')[3].split('_')[0], program: []})
          return;
        }
        let channel = res.tv.programme[0].$.channel;
        let program = res.tv.programme
            .filter((program) => {
              program.$.stopDate = getDate(program.$.stop);
              program.$.startDate = getDate(program.$.start);
              return program.$.stopDate > new Date();
            })
            .map(program => ({
              start: program.$.startDate.toTimeString().substr(0, 5),
              end: program.$.stopDate.toTimeString().substr(0, 5),
              title: program.title[0]._,
              desc: program.desc && program.desc[0]._,
              category: program.category && program.category.map(item => item._)
            }));
        cache[cacheKey] = {channel, program}
        resolve({channel, program});
      })
    } catch (e) {
      reject(e.message);
    }
  });
};

// let http = option =>
const getOption = (channel, date) => {
  let url = `http://xmltv.xmltv.se/${channel}_${date}.xml`;
  return process.env.HTTP_PROXY ? getProxyOption(url, process.env.HTTP_PROXY) : url;
};

const get = (req, res) => {
  let date = (req.params.day ? new Date(req.params.day) : new Date()).toISOString().split('T')[0];
  let channels = ['svt1.svt.se', 'svt2.svt.se', 'tv4.se'];

  let promises = channels.map(channel => new Promise((resolve, reject) => {
    let cacheKey = channel + date;
    if (cache[cacheKey]) {
      resolve(cache[cacheKey]);
    } else {
      http.get(getOption(channel, date), res => fetchData(cacheKey, res, resolve, reject))
    }
  }));
  Promise.all(promises).then(data => {
    res.render('home', {data});
  }).catch(e => {
    res.status(500);
    res.send(e);
  })
};
express()
    .engine('handlebars', require('express-handlebars')({defaultLayout: 'main'}))
    .set('view engine', 'handlebars')
    .use('/static', express.static('static'))
    .get('/:day?', get)
    .listen(process.env.PORT || 8082);


// http.get(getOption('tv4.se', new Date().toISOString().split('T')[0]))
//     .on('response', function (incomingMessage) {
//       var buffer = ''
//       incomingMessage.on('readable', function () {
//         buffer += incomingMessage.read();
//       })
//       incomingMessage.on('end', () => {
//         parseXmlStr(buffer, (err, res) => {
//           console.log(res);
//         })
//       })
//     })

