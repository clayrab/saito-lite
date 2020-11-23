const saito = require('./../../lib/saito/saito');
const ModTemplate = require('../../lib/templates/modtemplate');

class SuperWallet extends ModTemplate {

  constructor(app) {
    super(app);
    this.name = "SuperWallet";
    this.description = "";
    this.categories = "";
    this.rendered = false;
  }
  
  requestInterface(type = "", interfaceBuilder = null) {
    return null;
  }
  
  initialize(app) {
    super.initialize(app);
  }
  async initializeHTML (app) {
    this.render(app);
  }
  async loadBalance (responseInterface) {
    let balance = await responseInterface.getBalance();
    document.querySelector(`#crypto-${responseInterface.modname} .balance`).innerHTML = balance;
  }
  async loadPubkey (responseInterface) {
    let pubkey = await responseInterface.getPubkey();
    document.querySelector(`#crypto-${responseInterface.modname} .pubkey`).innerHTML = pubkey;
  }
  async render(app) {
    if (!this.rendered) {
      this.rendered = true;
      app.browser.addElementToDom('<div id="superwallet-container" class="superwallet-container"></div>'); 
      app.modules.requestInterfaces("is_cryptocurrency").forEach(async(responseInterface, i) => {
        app.browser.addElementToDom(`<div id="crypto-${responseInterface.modname}" class="crypto-container">
          <div class="ticker">${responseInterface.ticker}</div>
          <div class="pubkey">loading...</div>
          <div class="balance">loading...</div>
          <input class="pubkeyto" type="text"></input>
          <input class="sendbutton" type="button" value="send"></input>
        </div>`, "superwallet-container");
        this.loadBalance(responseInterface);
        this.loadPubkey(responseInterface);
      });
    }
  }

  // async onConfirmation(blk, tx, conf, app) {
  // 
  // }

  // webServer(app, expressapp, express) {
  //   super.webServer(app, expressapp, express);
  //   expressapp.get('/arcade/observer/:game_id', async (req, res) => {
  //     if (games.length > 0) {
  //       let game = games[0];
  //       res.setHeader('Content-type', 'text/html');
  //       res.charset = 'UTF-8';
  //       //console.info(JSON.stringify(game));
  //       res.write(game.game_state);
  //       res.end();
  //       return;
  //     }
  //   });
  // }




}

module.exports = SuperWallet;

