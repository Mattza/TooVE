if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }).catch(function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}


let isToday = true;

const forEachProgram = (data, predicate) => {
  data.forEach(channel => channel.program.forEach(predicate));
};

const preHandle = data => {
  forEachProgram(data, program => {
    program.startTime = program.start.split('T')[1].substr(0, 5);
  })
};


const naiveFetchAhead = () => {
  let date = new Date();
  for (let i = 0; i < 5; i++) {
    date.setDate(date.getDate() + 1);
    fetch(`/api?date=${date.toJSON().split('T')[0]}`)
  }
};
const orchestrateResp = data => {
  naiveFetchAhead();
  preHandle(data);
  markElapsed(data);
  createHTML(data);

};

const createHTML = data => {
  document.querySelector('.wrapper')
      .insertAdjacentHTML('beforeend', channelTemplate(data));
};
const markElapsed = (data) => {
  if (isToday) {
    data.forEach(channel => {
      channel.program.forEach(program => {
        if (new Date(program.end) < new Date()) {
          program.elapsed = true;
        }
      })
    });
  }
};

let channelTemplate = Handlebars.compile(document.getElementById("channel-template").innerHTML);

fetch(`/api?date=${new Date().toJSON().split('T')[0]}`).then(resp => resp.json()).then(data => orchestrateResp(data));