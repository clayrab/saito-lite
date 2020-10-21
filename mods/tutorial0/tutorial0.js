var ModTemplate = require('../../lib/templates/modtemplate');

class Tutorial0 extends ModTemplate {
  constructor(app) {
    super(app);
    this.name            = "TutorialWallet";
    this.description     = "A Basic Wallet to demonstrate the basic Saito Module APIs";
    this.categories      = "Tutorials";
    return this;
  }

  initializeHTML(app) {
    document.querySelector("#content .main").innerHTML = "<div>Hello World!</div>"
  }
  attachEvents(app) {
    // This is where you should attach events to your HTML
    console.log("tutWallet attachEvents");

  }
}

module.exports = Tutorial0;
