var ModTemplate = require('../../lib/templates/modtemplate');

class TutorialWallet extends ModTemplate {

//////////////////// MODULE API: //////////////////////////
//
// async installModule(app)
// async initialize(app)
// initializeHTML(app) }
// attachEvents(app)
// loadFromArchives(app, tx)
// implementsKeys(request)
// async onConfirmation(blk, tx, confnum, app)
// onNewBlock(blk, lc)
// onChainReorganization(block_id, block_hash, lc, pos)
// onConnectionUnstable(app)
// onConnectionStable(app)
// onWalletReset()
// onPeerHandshakeComplete(app, peer)
// onConnectionStable(app, peer)
// onConnectionUnstable(app, peer)
// shouldAffixCallbackToModule(modname)
// webServer(app, expressapp, express)
// updateBalance(app)
// updateIdentifier(app)
// updateBlockchainSync(app, current, target)
// respondTo(request_type = "")
// receiveEvent(eventname, data)
// sendEvent(eventname, data)
// async handlePeerRequest(app, message, peer, mycallback = null)
// async sendPeerDatabaseRequest(dbname, tablename, select = "", where = "", peer = null, mycallback = null)
// isSQLSafe (sql)
// async sendPeerDatabaseRequestWithFilter(modname="", sql="", success_callback=null, peerfilter=null)
// async sendPeerRequestWithFilter(msg_callback=null, success_callback=null, peerfilter=null)
// async sendPeerDatabaseRequestRaw(db, sql, mycallback = null)
// returnSlug()
// returnLink()
// returnServices()
// handleUrlParams(urlParams)}
// showAlert()
//

  // Called in Saito.init:
  //  let x = new Module(this);
  constructor(app) {
    console.log("tutWallet constructor")
    //console.log("caller is " + arguments.callee.caller.toString());
    //console.log(printStackTrace().join('\n\n'));
    super(app);

    // This name will form the "slug" in the url of your module. If
    // name.toLowerCase matches the filename Saito's Lite Client will
    // detect this in the browser and fire your initializeHTML() method.
    this.name            = "TutorialWallet";
    this.description     = "A Basic Wallet to demonstrate the basic Saito Module APIs";
    this.categories      = "Tutorials";
    // this.browser_active  = 1;
    return this;

  }

  onConfirmation(blk, tx, conf, app) {
    console.log("tutWallet onConfirmation")
    let txmsg = tx.returnMessage();
    if (conf == 0) {
      if (txmsg.request == "chat message") {
        if (tx.transaction.from[0].add == app.wallet.returnPublicKey()) { return; }
        this.receiveMessage(app, tx);
      }
    }

  }

  respondTo(type) {
    console.log("tutWallet respondTo");
    return null;
  }

  initialize(app) {
    console.log("tutWallet initialize");
    // console.log("caller is " + arguments.callee.caller.toString());
    super.initialize(app);
  }

  initializeHTML(app) {
    console.log("tutWallet initializeHTML");
    // super.initializeHTML(app);
    // console.log(document.querySelector("#content .main"));
    // console.log(document.querySelector(".content"));
    // console.log(document.querySelector("#content"));
    console.log(document)
    console.log(document.querySelector)
    document.querySelector("#content .main").innerHTML = "<div>Hello World!</div>"

  }
  attachEvents(app) {
    console.log("tutWallet attachEvents")
  }

  async installModule(app) {
    console.log("tutWallet installModule")
  }

  // loadFromArchives(app, tx) {
  //   console.log("tutWallet loadFromArchives")
  // }
  // implementsKeys(request) {
  //   console.log("tutWallet implementsKeys")
  // }
  // onNewBlock(blk, lc) {
  //   console.log("tutWallet onNewBlock")
  // }
  // onChainReorganization(block_id, block_hash, lc, pos) {
  //   console.log("tutWallet onChainReorganization")
  // }
  // onConnectionUnstable(app) {
  //   console.log("tutWallet onConnectionUnstable")
  // }
  // onConnectionStable(app) {
  //   console.log("tutWallet onConnectionStable")
  // }
  // onWalletReset() {
  //   console.log("tutWallet onWalletReset")
  // }
  // onPeerHandshakeComplete(app, peer) {
  //   console.log("tutWallet onPeerHandshakeComplete")
  // }
  // onConnectionStable(app, peer) {
  //   console.log("tutWallet onConnectionStable")
  // }
  // onConnectionUnstable(app, peer) {
  //   console.log("tutWallet onConnectionUnstable")
  // }
  // shouldAffixCallbackToModule(modname) {
  //   console.log("tutWallet shouldAffixCallbackToModule")
  // }
  // // webServer(app, expressapp, express) {
  // //   console.log("tutWallet webServer")
  // // }
  // updateBalance(app) {
  //   console.log("tutWallet updateBalance")
  // }
  // updateIdentifier(app) {
  //   console.log("tutWallet updateIdentifier")
  // }
  // updateBlockchainSync(app, current, target) {
  //   console.log("tutWallet updateBlockchainSync")
  // }
  // receiveEvent(eventname, data) {
  //   console.log("tutWallet receiveEvent")
  // }
  // sendEvent(eventname, data) {
  //   console.log("tutWallet sendEvent")
  // }



}

module.exports = TutorialWallet;
