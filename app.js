'use strict';
const express = require('express');
const http = require('http');
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

function formatDate(date) {
  let str = date.getHours();
  str += ':' + ('0' + date.getMinutes()).slice(-2);
  return str
}
function fetchData(option, resolve, reject) {
  http.get(option, res => {
    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => rawData += chunk);
    res.on('end', () => {
      try {
        parseXmlStr(rawData, (err, res) => {
          resolve(res.tv.programme.filter((program) => {
            program.$.stopDate = getDate(program.$.stop);
            program.$.startDate = getDate(program.$.start);
            return program.$.stopDate > new Date();
          }).map(item => {
            // resolve(item);
            // console.log(`${formatDate(item.$.startDate)}\t${item.title[0]._}`);
            return item;
          }));
        });

      } catch (e) {
        reject(e.message);
      }
    });
  })
}

const getOption = (channel, date) => `http://xmltv.xmltv.se/${channel}_${date}.xml`;

let options = [
  getOption('svt1.svt.se', new Date().toISOString().split('T')[0])
];

var promises = options.map(option => {
  return new Promise(function (resolve, reject) {
    fetchData(option, resolve, reject);
  })
});
Promise.all(promises).then(data => {
  console.log(data[0].length);
})
// promises[0].then(data => console.log('nja', data))
console.log('promises', promises);