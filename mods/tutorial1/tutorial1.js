var ModTemplate = require('../../lib/templates/modtemplate');

class Tutorial1 extends ModTemplate {

  constructor(app) {
    console.log("tutWallet constructor")
    super(app);

    // This name will form the "slug" in the url of your module. If
    // name.toLowerCase matches the filename Saito's Lite Client will
    // detect this in the browser and fire your initializeHTML() method.
    this.name            = "Tutorial1";
    this.description     = "A Basic Wallet to demonstrate the basic Saito Module APIs";
    this.categories      = "Tutorials";
    this.balance         = null;
    return this;
  }

  initialize(app) {
    super.initialize(app);
    this.balance = app.wallet.returnBalance();
  }

  initializeHTML(app) {
    this.render(app);
  }
  render(app) {
    let html = "<div id='helloworld'>Hello World!</div>";
    if(this.balance) {
      html += "<div>" + this.balance + "</div>";
    }
    document.querySelector("#content .main").innerHTML = html;
    document.getElementById("helloworld").onclick = (event) => {
      app.modules.respondTo("send-reward").forEach((mod, i) => {
        console.log(mod.respondTo("send-reward").makePayout)
        console.log(app.wallet.returnPublicKey())
        //mod.respondTo("send-reward").makePayout( app.wallet.returnPublicKey(), 10);
        mod.makePayout( app.wallet.returnPublicKey(), 10);
      });
    };
  }

  webServer(app, expressapp, express) {
    expressapp.get('/gimme', function (req, res) {
      app.modules.requestInterfaces("send-reward").forEach((itnerface, i) => {
        itnerface.makePayout(req.query.pubkey, 10000);
        res.type('application/json');
        res.status(200);
        res.send({status: "ok"});
      });
      return;
    });
    super.webServer(app, expressapp, express);
  };


}

module.exports = Tutorial1;
