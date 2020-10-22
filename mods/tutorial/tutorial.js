const ModTemplate = require('../../lib/templates/modtemplate');

const Modal = require('../../lib/ui/modal/modal');
const helpers = require('../../lib/helpers/index');
const AddressController = require('../../lib/ui/menu/address-controller');

const WelcomeBackupTemplate = require('./lib/modal/welcome/welcome-backup.template');
const WelcomeBackup = require('./lib/modal/welcome/welcome-backup.js');

const RegisterUsernameTemplate = require('./lib/modal/register/register-username.template');
const RegisterUsername = require('./lib/modal/register/register-username.js');

const InviteFriendsTemplate = require('./lib/modal/invite/invite-friends.template');
const InviteFriends = require('./lib/modal/invite/invite-friends.js');

const SurveyTemplate = require('./lib/modal/survey/survey.template.js');
const Survey = require('./lib/modal/survey/survey.js');

const SuggestTemplate = require('./lib/modal/suggest/suggest.template.js');
const Suggest = require('./lib/modal/suggest/suggest.js');

const NewsletterTemplate = require('./lib/modal/newsletter/newsletter.template.js');
const Newsletter = require('./lib/modal/newsletter/newsletter.js');

class Tutorial extends ModTemplate {

  constructor(app) {

    super(app);

    this.app = app;
    this.name = "Tutorial";

    this.description = "User introduction and help system.";
    this.categories = "UX Users";

    this.username_registered = 0;

    this.addrController = new AddressController(app);

    //
    // we want this running in all browsers
    //
    if (app.BROWSER == 1) {
      this.browser_active = 1;
    }

    return this;

  }



  initialize(app) {
    if (app.keys.returnIdentifierByPublicKey(app.wallet.returnPublicKey())) {
      this.username_registered = 1;
    }
  }


  initializeHTML(app) {

    //
    // run on load (or dom ready)
    //
    // 20201006 - added balance check so does not pop up
    // on first load
    if (!localStorage.getItem('visited')) {
      if (this.app.wallet.wallet.balance > 5) {
        localStorage.setItem('visited', true);
        this.welcomeBackupModal();
      }
    }
  }


  async handlePeerRequest(app, message, peer, callback) {

    if (message.request == "user subscription") {
      try {

        let sql = "INSERT OR IGNORE INTO subscribers (publickey, email, unixtime) VALUES ($publickey, $email, $unixtime);"

        let params = {
          $publickey: message.data.key,
          $email: message.data.email,
          $unixtime: message.data.time,
        }

        await this.app.storage.executeDatabase(sql, params, "tutorial");

        return;

      } catch (err) {
        console.error(err);
      }
    }

    if (message.request == "user survey") {
      try {

        let sql = "INSERT OR IGNORE INTO surveys (publickey, survey_data, unixtime) VALUES ($publickey, $survey_data, $unixtime);"

        let params = {
          $publickey: message.data.key,
          $survey_data: message.data.survey_data,
          $unixtime: message.data.time,
        }

        await this.app.storage.executeDatabase(sql, params, "tutorial");

        return;

      } catch (err) {
        console.error(err);
      }
    }

    if (message.request == "user suggest") {
      try {

        let sql = "INSERT OR IGNORE INTO suggestion (publickey, suggest_data, unixtime) VALUES ($publickey, $suggest_data, $unixtime);"

        let params = {
          $publickey: message.data.key,
          $suggest_data: message.data.suggest_data,
          $unixtime: message.data.time,
        }

        await this.app.storage.executeDatabase(sql, params, "tutorial");

        return;

      } catch (err) {
        console.error(err);
      }
    }

    if (message.request == "user newsletter") {
      try {
        let sql = "INSERT OR IGNORE INTO newsletter (publickey, email_data, unixtime) VALUES ($publickey, $email_data, $unixtime);";
        let params = {
          $publickey:   message.data.key,
          $email_data:  message.data.email_data,
          $unixtime:    message.data.time
        }

        await this.app.storage.executeDatabase(sql, params, "tutorial");

        return;

      } catch (err){
        console.log(err);
      }
    }
  }


  inviteFriendsModal() {

    let modal = new Modal(this.app, {
      id: 'friends',
      title: 'Invite Friends',
      content: InviteFriendsTemplate()
    });

    let data = {};
    data.tutorial = this;
    data.modal = modal;
    data.helpers = helpers;

    modal.render("blank");

    InviteFriends.attachEvents(this.app, data);

  }


  welcomeBackupModal() {

    let modal = new Modal(this.app, {
      id: 'rewards',
      title: 'Welcome to Saito',
      content: WelcomeBackupTemplate()
    });

    let data = {};
    data.tutorial = this;
    data.modal = modal;

    modal.render("blank");

    WelcomeBackup.attachEvents(this.app, data);

  }


  registerIdentifierModal() {

    let modal = new Modal(this.app, {
      id: 'register-username',
      title: 'Register a Saito Username',
      content: RegisterUsernameTemplate()
    });

    let data = {};
    data.tutorial = this;
    data.modal = modal;

    modal.render("blank");

    RegisterUsername.attachEvents(this.app, data);

  }

  surveyModal() {

    let modal = new Modal(this.app, {
      id: 'survey',
      title: 'Tell us about you.',
      content: SurveyTemplate()
    });

    let data = {};
    data.tutorial = this;
    data.modal = modal;

    modal.render("blank");

    Survey.attachEvents(this.app, data);

  }

  suggestModal() {

    let modal = new Modal(this.app, {
      id: 'suggest',
      title: 'Tell us about your feedback any suggestion you have!',
      content: SuggestTemplate()
    });

    let data = {};
    data.tutorial = this;
    data.modal = modal;

    modal.render("blank");

    Suggest.attachEvents(this.app, data);

  }

  newsletterModal() {

    let modal = new Modal(this.app, {
      id: 'newsletter',
      title: 'Sign up for Newsletter',
      content: NewsletterTemplate()
    });

    let data = {};
    data.tutorial = this;
    data.modal = modal;

    modal.render("blank");

    Newsletter.attachEvents(this.app, data);

  }

  shouldAffixCallbackToModule() { return 1; }

}

module.exports = Tutorial;
