function insertAt(src, index, str) {
  return src.substr(0, index) + str + src.substr(index);
}

require('http').get('http://xmltv.xmltv.se/svt1.svt.se_2017-01-29.xml', res => {
  res.setEncoding('utf8');
  let rawData = '';
  res.on('data', (chunk) => rawData += chunk);
  res.on('end', () => {
    try {

      require('xml2js').parseString(rawData, (err, res) => {
        console.log(res.tv.programme[0].$);
        res.tv.programme.filter((program) => {
          var time = program.$.stop;
          let timeObj = {
            year: time.substr(0, 4),
            month: time.substr(4, 2),
            day: time.substr(6, 2),
            hour: time(8, 2),
            minute: time(10, 2)
          }
          program.$.startDate = Date.UTC(timeObj.day, timeObj.month, timeObj.day, timeObj.hour, timeObj.minute)
          return program.$.startDate > new Date();
        }).map(item => {
          console.log(`${item.$.startDate}\t${item.title[0]._}`)
        })
      });

    } catch (e) {
      console.log(e.message);
    }
  });
})
