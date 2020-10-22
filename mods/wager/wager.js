const saito = require('../../lib/saito/saito');
const ModTemplate = require('../../lib/templates/modtemplate');

//
// Allows users to play a game of skill for Saito tokens
//
class Wager extends ModTemplate {

  constructor(app) {

    super(app);

    this.name = "Wager";
    this.description = "Adds a bit of skin in the game...";
    this.categories = "Games Entertainment";
    this.alwaysRun = 1;
    this.affix_callbacks_to = [];
    this.mods = [];
  }



  initialize(app) {

    super.initialize(app);
    let redirect_fncts = {};

    //
    // adjust games that respond to arcade games
    //
    this.app.modules.respondTo("arcade-games").forEach(mod => {

      redirect_fncts[mod.returnSlug()] = mod.returnGameOptionsHTML;
      mod.returnGameOptionsHTML = function() {
	return `<label for="player1">Wager:</label>
            <select name="wager">
              <option value="none"default>none</option>
              <option value="100">100</option>
              <option value="1000">1000</option>
              <option value="10000">10000</option>
              <option value="100000">100000</option>
            </select>` + redirect_fncts[mod.returnSlug()]();
      }

    });

  }


  shouldAffixCallbackToModule(modname) {
    if (modname == "Wager") { return 1; }
    for (let i = 0; i < this.affix_callbacks_to.length; i++) {
      if (this.affix_callbacks_to[i] == modname) {
        return 1;
      }
    }
    return 0;
  }

}

module.exports = Wager;
