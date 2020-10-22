var ModTemplate = require('../../lib/templates/modtemplate');
var TestingAppspace = require('./lib/email-appspace/testing-appspace');

//////////////////
// CONSTRUCTOR  //
//////////////////
class Testing extends ModTemplate {

  constructor(app) {

    super(app);

    this.app             = app;
    this.name            = "Testing";
    this.description     = "Demo application with a clickable button - intended as guide for developers";
    this.categories      = "Dev Utilities";
    this.alwaysRun = 1;
    return this;

  }

  initialize(app) {

    console.log("########################");
    console.log("#########TESTING########");
    console.log("########################");

  }

  respondTo(type) {

    if (type == 'email-appspace') {
      let obj = {};
          obj.render = this.renderEmail;
          obj.attachEvents = this.attachEventsEmail;
      return obj;
    }

    return null;
  }
  renderEmail(app, data) {
     TestingAppspace.render(app, data);
  }
  attachEventsEmail(app, data) {
     TestingAppspace.attachEvents(app, data);
  }

}

module.exports = Testing;
