const ChatCore = require('./chat-core.js')
const EmailChat = require('./lib/email-chat/email-chat');

const Header = require('../../lib/ui/header/header');
const ChatMain = require('./lib/chat-main/chat-main');

const AddressController = require('../../lib/ui/menu/address-controller');
const helpers = require('../../lib/helpers/index');

class Chat extends ChatCore {

  constructor(app) {

    super(app);

    this.app = app;

    this.name        = "Chat";
    this.description = "Chat application providing on-chain and off-chain messaging supporting encrypted communication channels.";
    this.categories = "Utilities Core";

    this.uidata = {};
    this.icon_fa = "far fa-comments";

    this.categories  = "Messaging Communication";
    this.alwaysRun = 1;

    this.mods = [];

    // defined in parent
    //this.active_groups = [];
    //this.groups = [];
    this.addrController = new AddressController(app);
    this.helpers = helpers;

  }


  respondTo(type) {
    switch (type) {
      case 'email-chat':
        return {
          render: this.renderEmailChat,
          attachEvents: this.attachEventsEmailChat,
          sendMessage: this.sendMessage,
        }
      case 'chat-manager':
        return {
          render : (app, data) => {
            data.chat = app.modules.returnModule("Chat");
            ChatManager.initialize(app, data);
            ChatManager.render(app, data);
          },
          attachEvents: (app, data) => {
            ChatManager.attachEvents(app, data);
          },
          sendMessage: this.sendMessage,
        }
      case 'header-dropdown':
        return {}
      default:
        return null;
    }
  }

  renderEmailChat(app, data) {
    let chat_self = app.modules.returnModule("Chat");
    data.chat = chat_self;
    EmailChat.initialize(app, data);
    EmailChat.render(app, data);
  }

  attachEventsEmailChat(app, data) {
    EmailChat.attachEvents(app, data);
  }

  initialize(app) {
    super.initialize(app);
  }

  initializeHTML(app) {

    if(getPreference('darkmode')) {
      addStyleSheet("/forum/dark.css");
    }

    let x = this.app.modules.respondTo("chat-navbar");
    for (let i = 0; i < x.length; i++) {
      this.mods.push(x[i]);
    }

    super.initializeHTML(app);
    this.uidata.chat = this;
    Header.render(app, this.uidata);
    Header.attachEvents(app, this.uidata);
    this.uidata.chat.active = "chat_list";
    ChatMain.initialize(app, this.uidata);
  }

}


module.exports = Chat;
