console.log('hello world');


const orchestrateResp = data => {
  createHTML(data);
};

const createHTML = datas => {
  document.querySelector('.wrapper')
      .insertAdjacentHTML('beforeend',channelTemplate(datas));
};
let taco = document.getElementById("channel-template");
console.log('taco',taco);

let channelTemplate = Handlebars.compile(taco.innerHTML);

fetch('/api').then(resp => resp.json()).then(data => orchestrateResp(data));