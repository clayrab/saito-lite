const saito = require('../../lib/saito/saito');
const ModTemplate = require('../../lib/templates/modtemplate');
const ArcadeMain = require('./lib/arcade-main/arcade-main');
const ArcadeInvite = require('./lib/arcade-invite/arcade-invite');
const ArcadeLoader = require('./lib/arcade-main/arcade-loader');
const ArcadeLeftSidebar = require('./lib/arcade-left-sidebar/arcade-left-sidebar');
const ArcadeRightSidebar = require('./lib/arcade-right-sidebar/arcade-right-sidebar');
const ArcadeGameCarousel = require('./lib/arcade-main/arcade-game-carousel/arcade-game-carousel');

const Header = require('../../lib/ui/header/header');
const AddressController = require('../../lib/ui/menu/address-controller');


class Arcade extends ModTemplate {

  constructor(app) {

    super(app);

    this.name = "Arcade";
    this.description = "Interface for creating and joining games coded for the Saito Open Source Game Engine.";
    this.categories = "Games Entertainment";

    this.events = ['chat-render-request'];
    this.mods = [];
    this.affix_callbacks_to = [];
    this.games = [];
    this.observer = [];
    this.old_game_removal_delay = 2000000;
    this.initialization_timer = null;
    this.viewing_arcade_initialization_page = 0;

    this.icon_fa = "fas fa-gamepad";

    this.accepted = [];

    this.description = "A place to find, play and manage games!";
    this.categories = "Games Utilities";

    this.addrController = new AddressController(app);

  }

  returnServices() {
    let services = [];
    services.push({ service : "arcade" , domain : "saito" });
    return services;
  }




  receiveEvent(type, data) {
    if (type == 'chat-render-request') {
      if (this.browser_active) {
        let uidata = {};
        uidata.arcade = this;
        ArcadeLeftSidebar.render(this.app, uidata);
        ArcadeLeftSidebar.attachEvents(this.app, uidata);
      }
    }
  }


  onResetWallet() {
    if (this.app.options) {
      if (this.app.options.games) {
        if (this.app.options.games.length > 0) {
          this.app.options.games = [];
        }
      }
    }
  }


  handleUrlParams(urlParams) {

    let i = urlParams.get('i');

    if (i == "watch") {
      let msg = urlParams.get('msg');
      this.observeGame(msg);
    }

  }




  observeGame(msg) {

    let msgobj = JSON.parse(this.app.crypto.base64ToString(msg));
    let address_to_watch = msgobj.player;
    let game_id = msgobj.game_id;
    let arcade_self = this;

    //
    // already watching game... load it
    //
    if (this.app.options.games) {
      let { games } = this.app.options;
      for (let i = 0; i < games.length; i++) {
        if (games[i].id === game_id) {
          games[i].observer_mode = 1;
          games[i].observer_mode_active = 0;
	  for (let z = 0; z < games[i].players.length; z++) {
	    if (games[i].players[z] == address_to_watch) {
              games[i].observer_mode_player = (z+1);
	    }
	  }
          games[i].ts = new Date().getTime();
          arcade_self.app.keys.addWatchedPublicKey(address_to_watch);
	  arcade_self.app.options.games = games;
	  arcade_self.app.storage.saveOptions();
          let slug = arcade_self.app.modules.returnModule(msgobj.module).returnSlug();
          window.location = '/' + slug;
          return;
        }
      }
    }

    fetch(`/arcade/observer/${game_id}`)
      .then(response => {
        response.json().then(data => {
          let game = data;
          //
          // tell peers to forward this address transactions
          //
          arcade_self.app.keys.addWatchedPublicKey(address_to_watch);
          let { games } = arcade_self.app.options;

          //
          // specify observer mode only
          //
          game.player = 0;
          if (games == undefined) {
            games = [];
          }

          for (let i = 0; i < games.length; i++) {
            if (games[i].id == game.id) {
              games.splice(i, 1);
            }
          }

          game.observer_mode = 1;
          game.observer_mode_active = 0;

	  //
	  // and we add this stuff to our queue....
	  //
	  for (let z = 0; z < game.last_turn.length; z++) {
	    game.queue.push(game.last_turn[z]);
          }

          games.push(game);

	  arcade_self.app.options.games = games;
          arcade_self.app.storage.saveOptions();

          //
          // move into game
          //
          let slug = arcade_self.app.modules.returnModule(msgobj.module).returnSlug();
          window.location = '/' + slug;
        })
      })
      .catch(err => console.info("ERROR 418019: error fetching game for observer mode", err));
  }

  render(app, data=null) {

    if (this.browser_active == 0) { return; }

    if (data == null) { data = {}; data.arcade = this; }

    ArcadeGameCarousel.render(app, data);

    ArcadeMain.render(app, data);
    ArcadeMain.attachEvents(app, data);

    ArcadeLeftSidebar.render(app, data);
    ArcadeLeftSidebar.attachEvents(app, data);

    ArcadeRightSidebar.render(app, data);
    ArcadeRightSidebar.attachEvents(app, data);

  }

  renderMain(app, data=null) {

    if (this.browser_active == 0) { return; }

    if (data == null) { data = {}; data.arcade = this; }

    ArcadeMain.render(app, data);
    ArcadeMain.attachEvents(app, data);

  }


  renderInvite(app, data) {
    let inviteBase64 = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1);
    try {
      data.arcade.invite_payload = JSON.parse(app.crypto.base64ToString(inviteBase64));
    } catch (err) {
      console.log(err);
    }
    ArcadeInvite.render(app, data);
    ArcadeInvite.attachEvents(app, data);
  }


  respondTo(type = "") {
    if (type == "header-dropdown") {
      return {};
    }
    return null;
  }




  initialize(app) {

    super.initialize(app);
    let { modules } = this.app;

    //
    // main-panel games
    //
    modules.respondTo("arcade-games").forEach(mod => {
      this.mods.push(mod);
      this.affix_callbacks_to.push(mod.name);
    });

    //
    // left-panel chat
    //
    let x = this.app.modules.respondTo("email-chat");
    for (let i = 0; i < x.length; i++) {
      this.mods.push(x[i]);
    }

    //
    // right-panel sidebar
    //
    let y = this.app.modules.respondTo("arcade-sidebar");
    for (let i = 0; i < y.length; i++) {
      this.mods.push(y[i]);
    }

    //
    // delete outdated games
    //
    if (this.app.options.games) {
      for (let i = this.app.options.games.length - 1; i >= 0; i--) {
        if (this.app.options.games[i].over == 1 && this.app.options.games[i].last_block > 0 && this.app.options.games[i].last_block > (this.app.blockchain.last_bid - 10)) {
          this.app.options.games.splice(i, 1);
        }
      }
    }

    //
    // add my own games (as fake txs)
    //
    if (this.app.options.games != null) {

      let { games } = this.app.options;

      games.forEach(game => {
        let game_tx = this.createGameTXFromOptionsGame(game);
        if(game_tx) {
          this.addGameToOpenList(game_tx);
        }
      });
    }
  }


  initializeHTML(app) {

    let data = {};
    data.arcade = this;

    Header.render(app, data);
    Header.attachEvents(app, data);

    if (window.location.pathname.split('/')[2] == "invite") {
      this.renderInvite(app, data);
    } else {
      this.render(app, data);
    }


    // initialize any existing game
    this.onConnectionStable(app);


  }


  onConnectionStable(app) {

    //
    // are we initializing any game?
    //
    let arcadeMod = app.modules.returnModule("Arcade");

    if (arcadeMod.browser_active == 1) {
      if (app.options) {
        if (app.options.games) {
          for (let i = 0; i < app.options.games.length; i++) {
            if (app.options.games[i].initializing == 1) {
              let gamemod = app.modules.returnModule(app.options.games[i].module);
              if (gamemod) {
		gamemod.loadGame(app.options.games[i].id);
                gamemod.startQueue();
              }
            }
          }
        }
      }
    }

  }


  //
  // load transactions into interface when the network is up
  //
  onPeerHandshakeComplete(app, peer) {

    if (this.browser_active == 0) { return; }

    let arcade_self = this;

    //
    // load open games from server
    //
    this.sendPeerDatabaseRequestWithFilter(

	"Arcade",

	`SELECT * FROM games WHERE status = "open"`,

	(res) => {
          if (res.rows) {
            res.rows.forEach(row => {
              let gametx = JSON.parse(row.tx);
              let tx = new saito.transaction(gametx.transaction);
              this.addGameToOpenList(tx);
            });
          }
        }
    );


    //
    // load active games for observer mode
    //
    let current_timestamp = new Date().getTime() - 1200000;

    this.sendPeerDatabaseRequestWithFilter(

      "Arcade" ,

      `SELECT DISTINCT game_id, module, player, players_array FROM gamestate WHERE (1 = 1 AND last_move > ${current_timestamp} GROUP BY game_id ORDER BY last_move DESC LIMIT 5`,

      (res) => {
        if (res.rows) {
          res.rows.forEach(row => {
            let { game_id, module, players_array, player } = row;
            this.addGameToObserverList({
              game_id,
              module,
              players_array,
              player,
            });
          });
        }
      }
    );


  }



  createGameTXFromOptionsGame(game) {

    let game_tx = new saito.transaction();

    //
    // ignore games that are over
    //
    //console.info("GAME OVER + LAST BLOCK: " + game.over + " -- " + game.last_block + " -- " + game.id);

    if (game.over) { if (game.last_block > 0) { return; } }

    if (game.players) {
      game_tx.transaction.to = game.players.map(player => new saito.slip(player));
      game_tx.transaction.from = game.players.map(player => new saito.slip(player));
    } else {
      game_tx.transaction.from.push(new saito.slip(this.app.wallet.returnPublicKey()));
      game_tx.transaction.to.push(new saito.slip(this.app.wallet.returnPublicKey()));
    }

    let msg = {
      request: "loaded",
      game: game.module,
      game_id: game.id,
      options: game.options,
      players: game.players ,
      players_needed: game.players_needed,
      over: game.over,
      last_block: game.last_block,
    }
    if (game.status === "Opponent Resigned") { msg.options_html = "Opponent Resigned"; }

    game_tx.transaction.sig = game.id;
    game_tx.msg = msg;

    return game_tx;
  }

  addGameToObserverList(msg) {

    for (let i = 0; i < this.observer.length; i++) {
      if (msg.game_id == this.observer[i].game_id) {
        return;
      }
    }
    this.observer.push(msg);

    let data = {};
    data.arcade = this;

    if (this.browser_active == 1) {
      ArcadeRightSidebar.render(this.app, data);
      ArcadeRightSidebar.attachEvents(this.app, data);
    }
  }



  addGameToOpenList(tx) {

    if (!tx.transaction) {
      return;
    } else {
      if (!tx.transaction.sig) { return; }
      if (tx.msg.over == 1) { return; }
    }

    let txmsg = tx.returnMessage();

    for (let i = 0; i < this.games.length; i++) {

      let transaction = Object.assign({sig: "" }, this.games[i].transaction);
      if (tx.transaction.sig == transaction.sig) { return; }
      if (txmsg.game_id != "" && txmsg.game_id == transaction.sig) { return; }

      if (txmsg.game_id === this.games[i].transaction.sig) {
	console.log("ERROR 480394: not re-adding existing game to list");
	return;
      }

    }


    var for_us = true;
    if (txmsg.options.players_invited) {
      for_us = false;
      if (tx.transaction.from[0].add == this.app.wallet.returnPublicKey()) {
        for_us = true;
      } else {
        txmsg.options.players_invited.forEach(player => {
          if (player == this.app.wallet.returnPublicKey() || player == this.app.keys.returnIdentifierByPublicKey(this.app.wallet.returnPublicKey())) {
            for_us = true;
          }
        });
      }
    }


    this.removeOldGames();


    if (for_us) {

      this.games.unshift(tx);

      let data = {};
      data.arcade = this;

      if (this.browser_active == 1) {
        if (this.viewing_arcade_initialization_page == 0) {
          ArcadeMain.render(this.app, data);
          ArcadeMain.attachEvents(this.app, data);
        }
      }
    }
  }



  removeOldGames() {

    let removed_old_games = 0;

    // if the game is very old, remove it
    for (let i = 0; i < this.games.length; i++) {
      let gamets = parseInt(this.games[i].transaction.ts);
      let timepassed = (new Date().getTime()) - gamets;
      if (timepassed > this.old_game_removal_delay) {
	this.games.splice(i, 1);
        removed_old_games = 1;
	i--;
      }
    }

    let data = {};
    data.arcade = this;

    if (this.browser_active == 1) {
      if (this.viewing_arcade_initialization_page == 0) {
        if (removed_old_games == 1) {
          ArcadeMain.render(this.app, data);
          ArcadeMain.attachEvents(this.app, data);
        }
      }
    }

  }




  joinGameOnOpenList(tx) {

    if(!tx.transaction) {
      return;
    } else {
      if (!tx.transaction.sig) { return; }
      if (tx.msg.over == 1) { return; }
    }

    let txmsg = tx.returnMessage();

    for (let i = 0; i < this.games.length; i++) {
      if (this.games[i].transaction.sig == txmsg.game_id) {
        if (!this.games[i].msg.players.includes(tx.transaction.from[0].add)) {
          //
          // TODO is validate accept sig
          //
          if (tx.msg.invite_sig != "") {
            this.games[i].msg.players.push(tx.transaction.from[0].add);
            if (!this.games[i].msg.players_sigs) { this.games[i].msg.players_sigs = []; }
            this.games[i].msg.players_sigs.push(txmsg.invite_sig);
          }
        }
      }
    }

    let data = {};
    data.arcade = this;

    if (this.browser_active == 1) {
      if (this.viewing_arcade_initialization_page == 0) {
        ArcadeMain.render(this.app, data);
        ArcadeMain.attachEvents(this.app, data);
      }
    }
  }



  // just receive the sig of the game to remove
  removeGameFromOpenList(game_sig) {

    this.games = this.games.filter(game => {
      if (game.transaction) {
        return game.transaction.sig != game_sig;
      } else {
        return true;
      }
    });

    if (this.app.options) {
      if (this.app.options.games) {
        for (let i = 0; i < this.app.options.games.length; i++) {
          if (this.app.options.games[i].id == game_sig) {
              this.app.options.games.splice(i, 1);
            this.app.storage.saveOptions();
          }
        }
      }
    }

    //
    // save to delete for good
    //

    let data = {};
    data.arcade = this;

    if (this.browser_active == 1) {

      //ArcadeMain.render(this.app, data);
      //ArcadeMain.attachEvents(this.app, data);

      if (document.getElementById(`arcade-game-${game_sig}`)) {
        document.getElementById(`arcade-gamelist`).removeChild(document.getElementById(`arcade-game-${game_sig}`));
      }

    }
  }


  async onConfirmation(blk, tx, conf, app) {

    let txmsg = tx.returnMessage();
    let arcade_self = app.modules.returnModule("Arcade");

    if (conf == 0) {

      //
      // purge any bad games from options file
      //
      if (app.options) {
        if (app.options.games) {
          for (let i = app.options.games.length-1; i >= 0; i--) {
            if (app.options.games[i].module === "" && app.options.games[i].id.length < 25) {
	      app.options.games.splice(i, 1);
  	    }
  	  }
        }
      }

      //
      // notify SPV clients of "open", "join" and "close"(, and "accept") messages
      //
      if (app.BROWSER == 0 && txmsg.request == "open" || txmsg.request == "join" || txmsg.request == "accept" || txmsg.request == "close") {

        for (let i = 0; i < arcade_self.app.network.peers.length; i++) {
          if (arcade_self.app.network.peers[i].peer.synctype == "lite") {

            //
            // fwd tx to peer
            //
            let message = {};
              message.request = "arcade spv update";
              message.data = {};
              message.data.tx = tx;
            arcade_self.app.network.peers[i].sendRequest(message.request, message.data);
          }
        }
      }


      //
      // open msgs -- public invitations
      //
      if (txmsg.module === "Arcade" && txmsg.request == "open") {
        this.addGameToOpenList(tx);
        this.receiveOpenRequest(blk, tx, conf, app);
      }

      //
      // open msgs -- private invitations
      //
      if (txmsg.module === "ArcadeInvite" && txmsg.request == "open" && tx.isTo(app.wallet.returnPublicKey())) {
        this.addGameToOpenList(tx);
      }

      //
      // join msgs -- add myself to game list
      //
      if (txmsg.request == "join") {

	let game_id = txmsg.game_id;

	for (let i = 0; i < this.games; i++) {
	  if (this.games[i].transaction) {
	    if (this.games[i].transaction.msg) {
	      if (txmsg.game_id == this.games[i].transaction.msg.game_id) {

		let existing_players_found = 0;

		for (let z = 0; z < this.games[i].transaction.msg.players.length; z++) {
		  for (let zz = 0; zz < tx.transaction.to.length; zz++) {
		    if (this.games[i].transaction.msg.players[z] == tx.transaction.to[zz].add) {
		      existing_players_found++;
		      z = this.games[i].transaction.msg.players.length+1;
		    }
		  }
		}

		if (existing_players_found < this.games[i].transaction.msg.players.length) {

//console.log("WE HAVE FOUND A GAME WITH A PLAYER IN IT WHO WAS NOT ACCEPTED...");
//console.log(JSON.stringify(this.games[i].transaction.msg.players));
//console.log("vs");
//console.log(JSON.stringify(tx.transaction.to));


		}
	      }
	    }
	  }
	}


        this.joinGameOnOpenList(tx);
        this.receiveJoinRequest(blk, tx, conf, app);

	//
	// it is possible that we have multiple joins that bring us up to
	// the required number of players, but that did not arrive in the
	// one-by-one sequence needed for the last player to trigger an
	// "accept" request instead of another "join".
	//
	// in this case the last player sends an accept request which triggers
	// the start of the game automatically.
	//
        if (tx.transaction) {
          if (!tx.transaction.sig) { return; }
          if (tx.msg.over == 1) { return; }

          for (let i = 0; i < this.games.length; i++) {
            if (this.games[i].transaction.sig == txmsg.game_id) {

 	      //
	      // console.log
	      //
	      let number_of_willing_players = this.games[i].msg.players.length;
	      let number_of_players_needed  = this.games[i].msg.players_needed;

	      console.log("NUMBER OF WILLING PLAYERS IN THIS GAME: " + number_of_willing_players);
	      console.log("NUMBER OF PLAYERS NEEDED IN THIS GAME: " + number_of_players_needed);

	      if (number_of_willing_players >= number_of_players_needed) {

	        //
	        // first player is the only one with a guaranteed consistent order in all
	        // browsers -- cannot use last player to join as players may disagree on
		// their order. so the first player is responsible for processing the "accept"
		//
	        if (this.games[i].msg.players[0] == this.app.wallet.returnPublicKey()) {

	 	  // i should send an accept request to kick this all off
		  this.games[i].msg.players.splice(0, 1);
		  this.games[i].msg.players_sigs.splice(0, 1);

		  let newtx = this.createAcceptTransaction(this.games[i]);
		  this.app.network.propagateTransaction(newtx);

	        }
	      }
	    }
          }
        }

      }

      //
      // cancel open games
      //
      if (txmsg.module == "Arcade" && txmsg.request == "close") {
        this.receiveCloseRequest(blk, tx, conf, app);
        this.receiveGameoverRequest(blk, tx, conf, app);
      }

      //
      // save state -- also prolifigate
      //
      if (txmsg.game_state != undefined && txmsg.game_id != "") {
        this.saveGameState(blk, tx, conf, app);
      }


      if (txmsg.request === "sorry") {
        if (tx.isTo(app.wallet.returnPublicKey())) {
          arcade_self.receiveSorryAcceptedTransaction(blk, tx, conf, app);
        }
      }


      //
      // acceptances
      //
      if (txmsg.request === "accept") {

//        console.info("\n\n\nARCADE GETS ACCEPT MESSAGE: " + txmsg.request);
//        console.info("i am " + app.wallet.returnPublicKey());
//        console.info("TX: " + JSON.stringify(tx.transaction));
//        console.info("MSG: " + txmsg);

        //
        // remove game from server
        //
        // let players_array = txmsg.players.join("_");;
        let sql = `UPDATE games SET status = "active" WHERE game_id = $game_id`;
        let params = {
          $game_id : tx.msg.game_id ,
        }
        await this.app.storage.executeDatabase(sql, params, 'arcade');


        //
        // do not process if transaction is not for us
        //
        if (!tx.isTo(app.wallet.returnPublicKey())) {

/*****
	  let game_found = false;

          if (this.app.options.games) {
            for (let i = 0; i < this.app.options.games.length; i++) {
              if (this.app.options.games[i].id == txmsg.game_id) {
                game_found = true;
              }
            }
	  }

          if (game_found == false) { return; }
*****/
	  return;
	}



        //
        // make sure game in options file
        //
        if (this.app.options) {

          if (!this.app.options.games) {
            this.app.options.games = [];
          }

          if (this.app.options.games) {
            let game_found = false;
            for (let i = 0; i < this.app.options.games.length; i++) {
              if (this.app.options.games[i].id == txmsg.game_id) {
                game_found = true;
              }
            }

            if (game_found == false) {

              //
              // copied above reject all tx not to us NEW
              //
              if (!tx.isTo(app.wallet.returnPublicKey())) {
                if (this.games.length > 0) {
                  for (let i = 0; i < this.games.length; i++) {

                    let transaction = Object.assign({ sig: "" }, this.games[i].transaction);
                    if (transaction.sig == txmsg.game_id) {
                      //
                      // remove game (accepted players are equal to number needed)
                      //
                      transaction.msg = Object.assign({ players_needed: 0, players: [] }, this.games[i].msg);
                      if (parseInt(transaction.msg.players_needed) >= (transaction.msg.players.length + 1)) {
                        this.removeGameFromOpenList(txmsg.game_id); //on confirmation
                      }
                    }
                  }
                }
              }

              //
              // only load games that are for us
              //
	      // this eliminates observer mode....
	      //
              if (tx.isTo(app.wallet.returnPublicKey())) {
                let gamemod = this.app.modules.returnModule(tx.msg.game);
                if (gamemod) {
                  gamemod.loadGame(tx.msg.game_id);
                }
              }
            }
          }
        }

        //
        // multiplayer games might hit here without options.games
        // in which case we need to import game details including
        // options, etc.
        //
        if (this.app.BROWSER == 1) {

          if (this.app.options != undefined) {
            if (this.app.options.games != undefined) {
              for (let i = 0; i < this.app.options.games.length; i++) {
                if (this.app.options.games[i].id == txmsg.game_id) {
                  if (this.app.options.games[i].initializing == 0) {

                    //
                    // is this old? exit
                    //
                    let currentTime = new Date().getTime();
                    if ((currentTime - this.app.options.games[i].ts) > 5000) {
                      console.log(`${currentTime} ------- ${this.app.options.games[i].ts}`);
                      return;
                    }
                  }
                }
              }
            }
          }

          //
          // also possible this is game in our displayed list
          //
          if (!tx.isTo(app.wallet.returnPublicKey())) {
            if (this.games.length > 0) {
              for (let i = 0; i < this.games.length; i++) {
                let transaction = Object.assign({ sig: "" }, this.games[i].transaction);
                if (transaction.sig == txmsg.game_id) {
                  transaction.msg = Object.assign({ players_needed: 0, players: [] }, this.games[i].msg);
                  if (parseInt(transaction.msg.players_needed) == (transaction.msg.players.length + 1)) {
                    this.removeGameFromOpenList(txmsg.game_id); // handle peer
                  }
                }
              }
            }
          }


          //
          // remove games from open games list
          //
          for (let i = 0; i < this.games.length; i++) {
            let transaction = Object.assign({ sig: "" }, this.games[i].transaction);
            if (transaction.sig === tx.msg.game_id) {
              if (transaction.options) {
                if (transaction.options.players_needed <= (transaction.players.length + 1)) {
                  console.info("ACCEPT MESSAGE SENT ON GAME WAITING FOR ONE PLAYER! -- deleting");
                  this.games.splice(i, 1);
                  console.info("RE-RENDER");
                  if (this.viewing_arcade_initialization_page == 0) {
                    this.renderMain(this.app);
                  }
                }
              }
            }
          }
        }
        await this.receiveAcceptRequest(blk, tx, conf, app);


        //
        // alert us someone has accepted our game if elsewhere
        //
        if (this.browser_active == 0) {
          if (txmsg.module === "Arcade" && tx.isTo(app.wallet.returnPublicKey())) {
            this.showAlert();
          }
        }

        //
        // only launch game if it is for us -- observer mode?
        //
        if (tx.isTo(app.wallet.returnPublicKey())) {
          console.info("THIS GAMEIS FOR ME: " + tx.isTo(app.wallet.returnPublicKey()));
          console.info("OUR GAMES: ", this.app.options.games);
          // game is over, we don't care
          if (tx.msg.over) {
            if (tx.msg.over == 1) { return; }
          }
          this.launchGame(txmsg.game_id);
        }
      }

    }
  }

  async handlePeerRequest(app, message, peer, mycallback = null) {


    //
    // this code doubles onConfirmation
    //
    if (message.request == 'arcade spv update') {

      let tx = new saito.transaction(message.data.tx.transaction);
      let txmsg = tx.returnMessage();
      let conf = 0;
      let blk = null;

      //
      // open msgs -- public invitations
      //
      if (txmsg.module === "Arcade" && txmsg.request == "open") {
        siteMessage(txmsg.game + ' invite created.', 3000);
        this.addGameToOpenList(tx);
        this.receiveOpenRequest(blk, tx, conf, app);
      }

      //
      // open msgs -- private invitations
      //
      if (txmsg.module === "ArcadeInvite" && txmsg.request == "open" && tx.isTo(app.wallet.returnPublicKey())) {
        siteMessage('Private ' + txmsg.game + ' invite created.', 3000);
        this.addGameToOpenList(tx);
      }

      //
      // join msgs -- add myself to game list
      //
      if (txmsg.request == "join") {
        this.joinGameOnOpenList(tx);
        this.receiveJoinRequest(blk, tx, conf, app);
      }

      //
      // accept msgs -- remove games from list
      //
      if (txmsg.request == "accept") {
          this.removeGameFromOpenList(txmsg.game_id);
          if(txmsg.players.includes(app.wallet.returnPublicKey())) {
            siteMessage(txmsg.module + ' invite accepted.', 20000);
            app.browser.sendNotification('Game Accepted', txmsg.module + ' invite accepted.', 'game-acceptance-notification');
          }
      }

      //
      // cancel open games
      //
      if (txmsg.module == "Arcade" && txmsg.request == "close") {
        // try to give game over message
        // this.receiveGameoverRequest();

        if (tx.isFrom(this.app.wallet.returnPublicKey())) {
          this.removeGameFromOpenList(tx.returnMessage().sig);
        } else {
          if (this.app.options) {
            if (this.app.options.games) {
              for (let i = 0; i < this.app.options.games.length; i++) {

                if (this.app.options.games[i].id === tx.returnMessage().sig) {

                  console.log("%%%%%%%%%%%%%%%%");
                  console.log("%%%%%%%%%%%%%%%%");
                  console.log("%%%% DELETED %%%");
                  console.log("%%%%%%%%%%%%%%%%");
                  console.log("%%%%%%%%%%%%%%%%");

                  this.app.options.games[i].status = "Opponent Resigned";
                  this.app.options.games[i].over = 1;
                  this.app.storage.saveOptions();

                  let gamemod = this.app.modules.returnModule(this.app.options.games[i].module);
                  if (gamemod) {
                    gamemod.loadGame(tx.returnMessage().sig);
                    gamemod.updateStatus("Opponent Resigned");
                    gamemod.updateLog("Opponent Resigned");
                  }
                }
              }
            }
          }
        }

        this.removeGameFromOpenList(txmsg.sig);
        if (this.viewing_arcade_initialization_page == 0 && this.browser_active == 1) {
          this.renderMain(this.app);
        }
      }
      this.receiveCloseRequest(blk, tx, conf, app);
    } // end peer relayed txs



    if (message.request == 'rawSQL' && app.BROWSER == 0 && message.data.module == "Arcade") {

      //
      // intercept a very particular query
      //
      if (message.data.sql.indexOf("is_game_already_accepted") > -1) {

        let game_id = message.data.game_id;

        let res = {};
        res.rows = [];

        if (this.accepted[game_id] > 0) {

          if (this.accepted[game_id] > 2) {

            //
            // check required of players_needed vs. players_accepted
            //
            let sql3 = `SELECT status FROM games WHERE game_id = $game_id`;
            let params3 = { $game_id : game_id }
            let rows3 = await this.app.storage.queryDatabase(sql3, params3, 'arcade');
            if (rows3) {
              if (rows3.length > 0) {
                if (rows3[0].status === "open") {
                  this.accepted[game_id] = 0;
                  res.rows.push({ game_still_open: 1 });
                  mycallback(res);
                  return;
                }
              }
            }
          }

          this.accepted[game_id]++;
          res.rows.push({ game_still_open: 0 });
        } else {
          this.accepted[game_id] = 1;
          res.rows.push({ game_still_open: 1 });
        }

        mycallback(res);
        return;

      }


      let sql = `SELECT * FROM games WHERE status = "open"`;
      let rows = await this.app.storage.queryDatabase(sql, {}, 'arcade');

      for (let i = 0; i < rows.length; i++) {

        let gametx = new saito.transaction(JSON.parse(rows[i].tx));

        let sql2 = `SELECT * FROM invites WHERE game_id = "${gametx.sig}"`;
        let rows2 = await this.app.storage.queryDatabase(sql2, {}, 'arcade');

        if (rows2) {
        if (rows2.length > 0) {

          // only do if invites exist
          if (! gametx.msg.players ) {
            gametx.msg.players = [];
            gametx.msg.players_sigs = [];
          }

          for (let z = 0; z < rows2.length; z++) {
            gametx.msg.players.push(rows2[z].player);
            gametx.msg.players_sigs.push(rows2[z].acceptance_sig);
          }

        }
        }

        rows[i].tx = JSON.stringify(gametx);
      }

      mycallback({ rows });

      if (Math.random() < 0.05) {

        let current_timestamp = new Date().getTime() - 1200000;

        let sql3 = "DELETE FROM games WHERE status = 'open' AND created_at < "+current_timestamp;
        let params3 = {}
        await this.app.storage.executeDatabase(sql3, params3, 'arcade');

        let sql4 = "DELETE FROM invites WHERE created_at < "+current_timestamp;
        let params4 = {}
        await this.app.storage.executeDatabase(sql4, params4, 'arcade');

      }

      return;
    }

    super.handlePeerRequest(app, message, peer, mycallback);
  }

  launchGame(game_id) {

    if (this.browser_active == 0) { return; }

    let arcade_self = this;

    arcade_self.is_initializing = true;
    arcade_self.initialization_timer = setInterval(() => {

      let game_idx = -1;
      if (arcade_self.app.options.games != undefined) {
        for (let i = 0; i < arcade_self.app.options.games.length; i++) {
          if (arcade_self.app.options.games[i].id == game_id) {
            game_idx = i;
          }
        }
      }

      if (game_idx == -1) { return; }

      if (arcade_self.app.options.games[game_idx].initializing == 0) {

	//
	// check we don't have a pending TX for this game...
	//
	let ready_to_go = 1;

	if (arcade_self.app.wallet.wallet.pending.length > 0) {
	  for (let i = 0; i < arcade_self.app.wallet.wallet.pending.length; i++) {
	    let thistx = new saito.transaction(JSON.parse(arcade_self.app.wallet.wallet.pending[i]));
	    let thistxmsg = thistx.returnMessage();
	    if (thistxmsg.module == arcade_self.app.options.games[game_idx].module) {
              if (thistxmsg.game_id == arcade_self.app.options.games[game_idx].id) {
	        ready_to_go = 0;
	      }
	    }
	  }
	}

	if (ready_to_go == 0) {
	  console.log("transaction for this game still in pending...");
	  return;
	}

        clearInterval(arcade_self.initialization_timer);

        let data = {};
        data.arcade = arcade_self;
        data.game_id = game_id;

        if (window.location.pathname.split('/')[2] == "invite") {
          ArcadeInvite.render(this.app, data);
          ArcadeLoader.attachEvents(this.app, data);
          this.viewing_arcade_initialization_page = 1;
        } else {
          ArcadeLoader.render(arcade_self.app, data);
          ArcadeLoader.attachEvents(arcade_self.app, data);
          this.viewing_arcade_initialization_page = 1;
        }

      }
    }, 1000);

  }




  async saveGameState(blk, tx, conf, app) {

    let txmsg = tx.returnMessage();

    let game_state = "";
    let key_state = "";

    if (txmsg.game_state != "") { game_state = txmsg.game_state; }
    if (txmsg.key_state != "") { key_state = txmsg.key_state; }


    let sql = `INSERT INTO gamestate (
                game_id ,
                player ,
                players_array ,
                module ,
                bid ,
                tid ,
                lc ,
                key_state ,
                game_state ,
                last_move
       ) VALUES (
                $game_id,
                $player,
                $players_array,
                $module,
                $bid,
                $tid,
                $lc,
                $key_state,
                $game_state,
                $last_move
        )`;
    let x = [];
    let txto = tx.transaction.to;
    for (let z = 0; z < txto.length; z++) {
      if (!x.includes(txto[z].add)) { x.push(txto[z].add); }
    }

    //
    // add any move associated with this tx to the
    // gamestate so that it can be executed to pull
    // us up-to-date on what happened in preparation
    // for the next turn / broadcast
    //
    game_state.last_turn = txmsg.turn;


    //
    // do not save 1-player games
    //
    if (x.length == 1) { return; }

    let players_array = x.join("_");

    let params = {
      $game_id: txmsg.game_id,
      $player: tx.transaction.from[0].add,
      $players_array: players_array,
      $module: txmsg.module,
      $bid: blk.block.id,
      $tid: tx.transaction.id,
      $lc: 1,
      $key_state: JSON.stringify(key_state),
      $game_state: JSON.stringify(game_state),
      $last_move: (new Date().getTime())
    };

    await app.storage.executeDatabase(sql, params, "arcade");

  }





  async receiveOpenRequest(blk, tx, conf, app) {

    let txmsg = tx.returnMessage();

    //
    // add to games table
    //
    let game_id = tx.transaction.sig;
    let players_needed = 2;
    if (parseInt(txmsg.players_needed) > 2) { players_needed = parseInt(txmsg.players_needed); }
    let module = txmsg.game;
    let options = {};
    if (txmsg.options != undefined) { options = txmsg.options; }
    let game_status = "open";
    let player = tx.transaction.from[0].add;
    let players_array = player;
    let start_bid = 1;
    if (blk != null) { start_bid = blk.block.id; }
    let valid_for_minutes = 60;
    let created_at = parseInt(tx.transaction.ts);
    let expires_at = created_at + (60000 * parseInt(valid_for_minutes));
    let acceptance_sig = "";
    if (txmsg.players_sigs.length > 0) { acceptance_sig = txmsg.players_sigs[0]; }

    let sql = `INSERT INTO games (
                game_id ,
                players_needed ,
                players_array ,
                module ,
                status ,
                options ,
                tx ,
                start_bid ,
                created_at ,
                expires_at
              ) VALUES (
                $game_id ,
                $players_needed ,
                $players_array ,
                $module ,
                $status ,
                $options ,
                $tx,
                $start_bid ,
                $created_at ,
                $expires_at
              )`;
    let params = {
      $game_id: game_id,
      $players_needed: parseInt(players_needed),
      $players_array: players_array,
      $module: module,
      $status: game_status,
      $options: options,
      $tx: JSON.stringify(tx.transaction),
      $start_bid: start_bid,
      $created_at: created_at,
      $expires_at: expires_at
    };
    await app.storage.executeDatabase(sql, params, "arcade");



    //
    // insert into invites
    //
    let sql2 = `INSERT INTO invites (
                game_id ,
                player ,
                acceptance_sig ,
                module ,
                created_at ,
                expires_at
              ) VALUES (
                $game_id ,
                $player ,
                $acceptance_sig ,
                $module ,
                $created_at ,
                $expires_at
              )`;
    let params2 = {
      $game_id: game_id,
      $player: player,
      $acceptance_sig: acceptance_sig,
      $module: module,
      $created_at: created_at,
      $expires_at: expires_at
    };
    await app.storage.executeDatabase(sql2, params2, "arcade");

    return;

  }




  async receiveJoinRequest(blk, tx, conf, app) {

    let txmsg = tx.returnMessage();

    //
    // add to invite table
    //
    let game_id = tx.msg.game_id;
    let players_needed = 2;
    if (parseInt(txmsg.players_needed) > 2) { players_needed = parseInt(txmsg.players_needed); }
    let module = txmsg.game;
    let options = {};
    if (txmsg.options != undefined) { options = txmsg.options; }
    let game_status = "open";
    let player = tx.transaction.from[0].add;
    let players_array = player;
    let start_bid = 0;
    if (blk != null) { start_bid = blk.block.id; }
    let valid_for_minutes = 60;
    let created_at = parseInt(tx.transaction.ts);
    let expires_at = created_at + (60000 * parseInt(valid_for_minutes));
    let acceptance_sig = "";
    if (txmsg.invite_sig != "") { acceptance_sig = txmsg.invite_sig; }

    //
    // insert into invites
    //
    let sql2 = `INSERT INTO invites (
                game_id ,
                player ,
                acceptance_sig ,
                module ,
                created_at ,
                expires_at
              ) VALUES (
                $game_id ,
                $player ,
                $acceptance_sig ,
                $module ,
                $created_at ,
                $expires_at
              )`;
    let params2 = {
      $game_id: game_id,
      $player: player,
      $acceptance_sig: acceptance_sig,
      $module: module,
      $created_at: created_at,
      $expires_at: expires_at
    };
    await app.storage.executeDatabase(sql2, params2, "arcade");

    return;

  }


  createOpenTransaction(gamedata, recipient="") {

    let sendto = this.app.wallet.returnPublicKey();
    let moduletype = "Arcade";

    if (recipient != "") {
      sendto = recipient;
      moduletype = "ArcadeInvite";
    }

    let { ts, name, options, options_html, players_needed } = gamedata;
    let accept_sig = this.app.crypto.signMessage(`invite_game_${ts}`, this.app.wallet.returnPrivateKey());

    let tx = this.app.wallet.createUnsignedTransactionWithDefaultFee();
    tx.transaction.to.push(new saito.slip(sendto, 0.0));
    tx.msg = {
      ts,
      module: moduletype,
      request: "open",
      game: name,
      options,
      options_html: options_html || "",
      players_needed : parseInt(players_needed),
      players: [this.app.wallet.returnPublicKey()],
      players_sigs: [accept_sig],
    };
    tx = this.app.wallet.signTransaction(tx);

    return tx;

  }

  async receiveCloseRequest(blk, tx, conf, app) {
    let txmsg = tx.returnMessage();
    let sql = `UPDATE games SET status = $status WHERE game_id = $game_id`
    let params = { $status: 'close', $game_id: txmsg.sig };
    let resp = await app.storage.executeDatabase(sql, params, "arcade");
  }


  createInviteTransaction(app, data, gametx) {

    let txmsg = gametx.returnMessage();

    let tx = app.wallet.createUnsignedTransactionWithDefaultFee();
    tx.transaction.to.push(new saito.slip(gametx.transaction.from[0].add, 0.0));
    tx.transaction.to.push(new saito.slip(app.wallet.returnPublicKey(), 0.0));
    tx.msg.ts = "";
    tx.msg.module = txmsg.game;
    tx.msg.request = "invite";
    tx.msg.game_id = gametx.transaction.sig;
    tx.msg.players_needed = parseInt(txmsg.players_needed);
    tx.msg.options = txmsg.options;
    tx.msg.accept_sig = "";
    if (gametx.msg.accept_sig != "") {
      tx.msg.accept_sig = gametx.msg.accept_sig;
    }
    if (gametx.msg.ts != "") {
      tx.msg.ts = gametx.msg.ts;
    }
    tx.msg.invite_sig = app.crypto.signMessage(("invite_game_" + tx.msg.ts), app.wallet.returnPrivateKey());
    tx = this.app.wallet.signTransaction(tx);

    return tx;

  }




  createJoinTransaction(app, data, gametx) {

    let txmsg = gametx.returnMessage();

    let tx = app.wallet.createUnsignedTransactionWithDefaultFee();
    tx.transaction.to.push(new saito.slip(gametx.transaction.from[0].add, 0.0));
    tx.transaction.to.push(new saito.slip(app.wallet.returnPublicKey(), 0.0));
    tx.msg.ts = "";
    tx.msg.module = txmsg.game;
    tx.msg.request = "join";
    tx.msg.game_id = gametx.transaction.sig;
    tx.msg.players_needed = parseInt(txmsg.players_needed);
    tx.msg.options = txmsg.options;
    tx.msg.invite_sig = app.crypto.signMessage(("invite_game_" + gametx.msg.ts), app.wallet.returnPrivateKey());
    if (gametx.msg.ts != "") { tx.msg.ts = gametx.msg.ts; }
    tx = this.app.wallet.signTransaction(tx);

    return tx;

  }




  receiveSorryAcceptedTransaction(blk, tx, conf, app) {

    let txmsg = tx.returnMessage();

    try {

      //
      // delete from local stores
      //
      if (app.options.games) {
        for (let i = app.options.games.length - 1; i >= 0; i--) {
          if (app.options.games[i].id == txmsg.game_id) {
            //console.info("########################");
            //console.info("### SENDING SORRY TX ###");
            //console.info("########################");
            //console.info("\n\n\nSORRY -- RECEIVED: " + JSON.stringify(app.options.games[i]));
            if (app.options.games[i].players.length == parseInt(app.options.games[i].players_needed) && !app.options.games[i].players.includes(tx.transaction.from[0].add)) {

              if (this.browser_active == 1) {
                salert("Opponent has responded claiming game already accepted :( -- returning to Arcade");
              }

              app.options.games.splice(i, 1);
              app.storage.saveOptions();
            }
          }
        }
      }

      if (this.browser_active == 1) {
        salert("Sorry! Your opponent has replied that has already accepted that game!");
        window.location = "/arcade";
        return;
      }

    } catch (err) {
      //console.info("ERROR WITH SORRY ACCEPTED TRANSACTION: " + err);
    }

  }



  async receiveAcceptRequest(blk, tx, conf, app) {

    if (this.browser_active == 1) {
      let data = {};
      data.arcade = this;
      if (tx.isTo(app.wallet.returnPublicKey())) {
        ArcadeLoader.render(app, data);
        ArcadeLoader.attachEvents(app, data);
        this.viewing_arcade_initialization_page = 1;
      }
    }

    let txmsg = tx.returnMessage();
    let publickeys = [];
    for (let i = 0; i < tx.transaction.to.length; i++) {
      if (!publickeys.includes(tx.transaction.to[i].add)) {
        publickeys.push(tx.transaction.to[i].add);
      }
    }
    let unique_keys = publickeys;
    unique_keys.sort();
    let players_array = unique_keys.join("_");

    let sql = "UPDATE games SET players_array = $players_array WHERE status = $status AND game_id = $game_id";
    let params = {
      $players_array: players_array,
      $status: 'open',
      $game_id: txmsg.game_id
    }

    try {
      let resp = await this.app.storage.executeDatabase(sql, params, "arcade");
    } catch (err) {
      //console.info(err);
    }

    sql = "UPDATE games SET status = 'active' WHERE game_id = $game_id";
    params = {
      $game_id: txmsg.game_id
    }

    try {
      let resp = await this.app.storage.executeDatabase(sql, params, "arcade");
    } catch (err) {
      console.log(err);
    }
  }



  launchSinglePlayerGame(app, data, gameobj) {

    //
    //
    window.location = '/' + gameobj.slug;
    return;

  }

  createAcceptTransaction(gametx) {

    let txmsg = gametx.returnMessage();

    let accept_sig = this.app.crypto.signMessage(("invite_game_" + txmsg.ts), this.app.wallet.returnPrivateKey());
    txmsg.players.push(this.app.wallet.returnPublicKey());
    txmsg.players_sigs.push(accept_sig);
    txmsg.request = "accept";

    let tx = this.app.wallet.createUnsignedTransactionWithDefaultFee();
    for (let i = 0; i < txmsg.players.length; i++) { tx.transaction.to.push(new saito.slip(txmsg.players[i], 0.0)); }
    tx.transaction.to.push(new saito.slip(this.app.wallet.returnPublicKey(), 0.0));

    //
    // arcade will listen, but we need game engine to receive to start initialization
    //
    tx.msg = txmsg;
    tx.msg.game_id = gametx.transaction.sig;
    tx.msg.request = "accept";
    tx.msg.module = txmsg.game;
    tx = this.app.wallet.signTransaction(tx);

    return tx;

  }

  async receiveGameoverRequest(blk, tx, conf, app) {

    let txmsg = tx.returnMessage();

    //
    // we want to update the game, and also give the winner points
    //
    let sql = "UPDATE games SET status = $status, winner = $winner WHERE game_id = $game_id";
    let params = {
      $status: 'over',
      $game_id: txmsg.game_id,
      $winner: txmsg.winner
    }
    await this.app.storage.executeDatabase(sql, params, "arcade");

  }


  webServer(app, expressapp, express) {

    super.webServer(app, expressapp, express);

    const fs = app.storage.returnFileSystem();
    const path = require('path');

    if (fs != null) {

      expressapp.get('/arcade/observer/:game_id', async (req, res) => {

        console.info("\n\n\n\nHERE WE ARE!");

        let sql = "SELECT * FROM gamestate WHERE game_id = $game_id ORDER BY id DESC LIMIT 1";
        let params = { $game_id: req.params.game_id }
        let games = await app.storage.queryDatabase(sql, params, "arcade");

        if (games.length > 0) {
          let game = games[0];
          res.setHeader('Content-type', 'text/html');
          res.charset = 'UTF-8';
          //console.info(JSON.stringify(game));
          res.write(game.game_state);
          res.end();
          return;
        } else {
console.log("GAME DOES NOT EXIST!");
	}

      });


      expressapp.get('/arcade/keystate/:game_id/:player_pkey', async (req, res) => {

        let sql = "SELECT * FROM gamestate WHERE game_id = $game_id AND player_pkey = $playerpkey ORDER BY id DESC LIMIT 1";
        let params = {
          $game_id: req.params.game_id,
          $playerpkey: req.params.player_pkey
        }
        let games = await app.storage.queryDatabase(sql, params, "arcade");

        if (games.length > 0) {

          let game = games[0];
          res.setHeader('Content-type', 'text/html');
          res.charset = 'UTF-8';
          res.write(game.key_state.toString());
          res.end();
          return;

        }
      });



      expressapp.get('/arcade/restore/:game_id/:player_pkey', async (req, res) => {

        let sql = "SELECT * FROM gamestate WHERE game_id = $game_id ORDER BY id DESC LIMIT 10";
        let params = { $game_id: req.params.game_id }
        let games = await app.storage.queryDatabase(sql, params, "arcade");

        let stop_now = 0;
        let games_to_push = [];
        let recovering_pkey = "";

        try {
          if (req.params.player_pkey != undefined) { recovering_pkey = req.params.pkayer_pkey; }
        } catch (err) { }

        if (games.length > 0) {
          for (let z = 0; z < games.length; z++) {
            let game = games[z];
            if (game.player_pkey == recovering_pkey) { stop_now = 1; } else { games_to_push.push(game.state); }
            if (recovering_pkey == "" || stop_now == 1) { z = games.length + 1; }
          }
          res.setHeader('Content-type', 'text/html');
          res.charset = 'UTF-8';
          res.write(JSON.stringify(games_to_push));
          res.end();
          return;
        }

      });

      expressapp.get('/arcade/invite/:gameinvite', async (req, res) => {
        res.setHeader('Content-type', 'text/html');
        res.sendFile(path.resolve(__dirname + '/web/invite.html'));
      });

    }
  }




  //
  // reset list of games that can be accepted
  //
  onNewBlock(blk, lc) {

    //
    // we notify clients via peer request if they
    // should accept a game...
    //
    if (lc == 1) {
      for (let i in this.accepted) {
        this.accepted[i]++;
        if (this.accepted[i] > 100) { delete this.accepted[i]; }
      }
    }
  }



  shouldAffixCallbackToModule(modname) {
    if (modname == "ArcadeInvite") { return 1; }
    if (modname == "Arcade") { return 1; }
    for (let i = 0; i < this.affix_callbacks_to.length; i++) {
      if (this.affix_callbacks_to[i] == modname) {
        //console.info("AFFIXING CALLBACKS TO: " + modname);
        return 1;
      }
    }
    return 0;
  }

  updateBalance() {
    if (this.browser_active) {
      try {
        //let balance = this.app.wallet.returnBalance();
        let balance = this.returnDisplayBalance();
        document.querySelector('.saito-balance').innerHTML = balance + " SAITO";
      } catch (err) { }
    }
  }

  updateIdentifier() {
    if (this.browser_active) {
      let uidata = { arcade: this };
      ArcadeRightSidebar.render(this.app, uidata);
      ArcadeRightSidebar.attachEvents(this.app, uidata);
    }
  }

}

module.exports = Arcade;
