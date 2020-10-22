var ModTemplate = require('../../lib/templates/modtemplate');

class Tutorial0 extends ModTemplate {

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
    this.name            = "Tutorial0";
    this.description     = "Hello World!";
    this.categories      = "Tutorials";
    //
    this.default_html = 1;
    return this;
  }

  initialize(app) {
    console.log("tut0 initialize")
    super.initialize(app);
  }

  initializeHTML(app) {
    console.log("tut0 initializeHTML")
    document.querySelector("#content .main").innerHTML = "<div>Hello World!</div>"
  }
}
Tutorial0.initialize = ModTemplate.onlyOnActive(Tutorial0.initialize);
Tutorial0.initializeHTML = ModTemplate.onlyOnActive(Tutorial0.initializeHTML);
module.exports = Tutorial0;
