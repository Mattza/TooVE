console.log('hello world');
let isToday = true;

const orchestrateResp = data => {
  createHTML(data);
  markProgram();
};

const createHTML = datas => {
  document.querySelector('.wrapper')
      .insertAdjacentHTML('beforeend', channelTemplate(datas));
};
const markProgram = () => {
  if (isToday) {
    document.querySelectorAll('.channel').forEach(channel => {
      let progs = 0;
      channel.querySelectorAll('.program').forEach(program => {
        let [hour,minute] = program.children[0].innerText.split(' ')[0].split(':');
        let now = new Date();
        now.setHours(hour);
        now.setMinutes(minute);
        if(now<new Date()){
          program.classList.add('elapsed')
        }
        // console.log(time, channel)
      })
    });
  }
};

let taco = document.getElementById("channel-template");
console.log('taco', taco);

let channelTemplate = Handlebars.compile(taco.innerHTML);

fetch('/api').then(resp => resp.json()).then(data => orchestrateResp(data));