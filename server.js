const http = require('http')
const WebSocket = require('ws')
const fs = require('fs')
const port = process.argv[2] || 80

const server = http.createServer(function(req, res) {
if(req.url == '/') req.url = '/index.html';
type = false;
if(req.url.split('.').pop() == 'svg') type = 'image/svg+xml';
else if(req.url.split('.').pop() == 'html') type = 'text/html';
else if(req.url.split('.').pop() == 'jpg') type = 'image/jpeg';
if(type) {
 fs.readFile('.'+req.url, function (err, data) {
   if(err){
    res.writeHead(404);
    res.end();
   }
   else {
    res.writeHead(200, {'Content-Type': type});
    res.write(data);
    res.end();
   }
 });
}
else {
 res.writeHead(404);
 res.end();
}
});
const wss = new WebSocket.Server({ server })
server.listen(port)

players = 0;
deck = ["10_of_clubs.svg","10_of_diamonds.svg","10_of_hearts.svg","10_of_spades.svg","2_of_clubs.svg","2_of_diamonds.svg","2_of_hearts.svg","2_of_spades.svg","3_of_clubs.svg","3_of_diamonds.svg","3_of_hearts.svg","3_of_spades.svg","4_of_clubs.svg","4_of_diamonds.svg","4_of_hearts.svg","4_of_spades.svg","5_of_clubs.svg","5_of_diamonds.svg","5_of_hearts.svg","5_of_spades.svg","6_of_clubs.svg","6_of_diamonds.svg","6_of_hearts.svg","6_of_spades.svg","7_of_clubs.svg","7_of_diamonds.svg","7_of_hearts.svg","7_of_spades.svg","8_of_clubs.svg","8_of_diamonds.svg","8_of_hearts.svg","8_of_spades.svg","9_of_clubs.svg","9_of_diamonds.svg","9_of_hearts.svg","9_of_spades.svg","ace_of_clubs.svg","ace_of_diamonds.svg","ace_of_hearts.svg","ace_of_spades2.svg","jack_of_clubs2.svg","jack_of_diamonds2.svg","jack_of_hearts2.svg","jack_of_spades2.svg","king_of_clubs2.svg","king_of_diamonds2.svg","king_of_hearts2.svg","king_of_spades2.svg","queen_of_clubs2.svg","queen_of_diamonds2.svg","queen_of_hearts2.svg","queen_of_spades2.svg"] 
players_list = {};
flop = 4;
players_pick = {};
auto_refresh = false;
score1 = 0;
score2 = 0;

wss.on('connection', ws => {

  ws.on('message', message => {
   if(message.split('|')[0] == 'ready' && players < 5){
    players++;
    players_list[players] = message.split('|')[1];
    info = {};
    info.player = players;
    info.players = players_list;
    ws.send(JSON.stringify(info));
    info = {};
    info.players = players_list;
    wss.broadcast(JSON.stringify(info));
    if(players == 4 && !auto_refresh){
     auto_refresh = true;
     deck = shuffle(deck);
     setTimeout(wss.refresh_flop, 10000);
     setInterval(wss.refresh_flop, 30000);
    }
   }
   else if(players == 4 && (message.split('|')[0] == 'kems' || message.split('|')[0] == 'ckems')){
    if(message.split('|')[1] == 'show'){
	if(message.split('|')[3].split(', ').filter(function(elem, pos) {
	 return message.split('|')[3].split(', ').indexOf(elem) == pos;
	}).length == 1){
	 if(message.split('|')[0] != 'ckems'){
	   if(message.split('|')[2] == 1 || message.split('|')[2] == 2) score1++;
           if(message.split('|')[2] == 3 || message.split('|')[2] == 4) score2++;
         }
	 else {
           if(message.split('|')[2] == 1 || message.split('|')[2] == 2) score2++;
           if(message.split('|')[2] == 3 || message.split('|')[2] == 4) score1++;
         }
	}
        else if(message.split('|')[0] == 'ckems'){
	 if(message.split('|')[2] == 1 || message.split('|')[2] == 2) score2--;
	 if(message.split('|')[2] == 3 || message.split('|')[2] == 4) score1--;
        }
    }
    wss.broadcast(message);
    info_score = {scores:[score1, score2]};
    wss.broadcast(JSON.stringify(info_score));
   }
   else if(players == 4 && message > 0 && message < 5){
     message = 4*(message-1);
     info.player_card = deck.slice(message, message+4);
     info.scores = [score1, score2];
     ws.send(JSON.stringify(info));
   }
   else if(message.split('|')[0] < 5 && message.split('|')[1] == -1 && message.split('|')[2] > -1 && message.split('|')[2] < 5){
     players_pick[message.split('|')[0]] = message.split('|')[2];
     info_pick = {};
     info_pick.players_pick = players_pick;
     wss.broadcast(JSON.stringify(info_pick));
   }
   else if(message.split('|')[0] < 5 && message.split('|')[1] && message.split('|')[2] > 0){
     info_switch = {};
     info_switch.pick = message.split('|')[2];
     info_switch.src = message.split('|')[1];
     wss.broadcast(JSON.stringify(info_switch));
   }
  })

  ws.on('close', close => {
   players_list = {};
   players = 0;
   wss.broadcast('refresh');
  })

  wss.broadcast = function broadcast(msg) {
    wss.clients.forEach(function each(client) {
       client.send(msg);
    });
  };
  wss.refresh_flop = function refresh_flop() {
     if(players != 4) return false;
     info = {};
     info.flop_card = deck.slice(4*flop,4*flop+4);
     if(deck.length < 4*flop){
        flop = 4;
	wss.broadcast('newgame');
     }
     wss.broadcast(JSON.stringify(info));
     players_pick = {};
     flop++;
  };
})

function shuffle(arra1) {
    var ctr = arra1.length, temp, index;
    while (ctr > 0) {
        index = Math.floor(Math.random() * ctr);
        ctr--;
        temp = arra1[ctr];
        arra1[ctr] = arra1[index];
        arra1[index] = temp;
    }
    return arra1;
}