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

  constructor(app) {
    super(app);
    //
    // This name will form the "slug" in the url of your module. If
    // name.toLowerCase matches the filename, Saito's Lite Client will also
    // detect this in the browser and fire your initializeHTML() method.
    //
    // If any transactions are found which have tx.msg.module = slug, Saito
    // will send these to your module via onConfirmation
    //
    this.name            = "TutorialWallet";
    this.description     = "A Basic Wallet to demonstrate the basic Saito Module APIs";
    this.categories      = "Tutorials";
    return this;
  }

  initialize(app) {
    console.log("tutWallet initialize");
    super.initialize(app);
  }

  initializeHTML(app) {
    document.querySelector("#content .main").innerHTML = "<div>Hello World!</div>"
  }
}

module.exports = TutorialWallet;
