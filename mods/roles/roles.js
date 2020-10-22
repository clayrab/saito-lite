var saito = require('../../lib/saito/saito');
var ModTemplate = require('../../lib/templates/modtemplate');


class Roles extends ModTemplate {

  constructor(app) {
    super(app);

    this.app            = app;
    this.name           = "Roles";
    this.description    = "BETA application allowing users to organize publickeys into roles and hierarchies, such as staff in an institution";
    this.utilities      = "Utilities Admin";


    this.roles		= [];
    this.groups 	= [];

    this.description = "Simple user identity and role management system for Saito";
    this.categories  = "Admin Users";
    this.alwaysRun = 1;

    return this;

  }



  initializeHTML(app) {
    console.log("###########################");
    console.log("#### HEADLESS WEB APP #####");
    console.log("###########################");
  }


  initialize(app) {

/**** EXAMPLE OF HANDLING LINKS ***
    //
    // send an email
    //
    let email_title = "Confirm Membership";
    let email_text = `
Click on this link and we'll see what happens:

<a href="/roles?member=Empire&role=stormtrooper">Click on this link to confirm please</a>

    `;
    let email_to = app.wallet.returnPublicKey();
    let email_from = app.wallet.returnPublicKey();

    let newtx = app.wallet.createUnsignedTransactionWithDefaultFee(email_to, 0.0);
    if (!newtx) {
      return;
    }

    newtx.msg.module   = "Email";
    newtx.msg.title    = email_title;
    newtx.msg.message  = email_text;
    newtx = app.wallet.signTransaction(newtx);

    let emailmod = app.modules.returnModule("Email");
    if (emailmod != null) {
try {
console.log("ADDING EMAIL TO ONCONFIRMATION!");
      emailmod.onConfirmation(null, newtx, 0, app);
} catch (err) {}
    }
*****************/

  }


  respondTo(type) {
    return null;
  }



}







module.exports = Roles;
