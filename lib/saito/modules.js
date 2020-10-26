class Mods {


  constructor(app, config) {

    this.app     = app;
    this.mods    = [];
    this.mods_list = config;

    this.lowest_sync_bid = -1;

  }

  //
  // maybeRun can be used to wrap a module function so that the function will
  // only be called in appropriate context subject to whether the module is
  // running on the server or the browser and whether the module developer
  // wants to module to run universally in a client context.
  //
  // By setting someModule.alwaysRun, module.js will ensure that all of
  // the modules methods are run, even in a client context. This can be useful
  // for modules that act like a library, for example relay.js for peer-to-peer
  // websockets or the chat module, which renders a chat box on top of other
  // modules.
  //
  static maybeRun(app, someMethod) {
    return function () {
      if(!app.BROWSER ||
        (this.alwaysRun || this.browser_active || this.alwaysRunThese.includes(someMethod))){
          let returnVal = someMethod.apply(this, arguments);
          return returnVal;
      } else {
        // I dont think we want to return anything here...
      }
    };
  }

  //
  // onlyOnActive can be used to blacklist a module method from being run unless it is the active module.
  // For example, this might be useful for a chat module which wants to run initializedHTML only when
  // the user is at /chat, but otherwise would like to enable this.alwaysRun so all it's other methods are
  // available to other modules.
  //
  static onlyOnActive(someMethod) {
    return function () {
      if(!app.BROWSER || this.browser_active) {
        let returnVal = someMethod.apply(this, arguments);
        return returnVal;
      } else {
        // I dont think we want to return anything here...
      }
    };
  }

  //
  // onlyOnFrontend can be used to blacklist a module method from being run
  // on the server. Wrapping this around your methods will cause them to only
  // run in a browser environment.
  //
  static onlyOnFrontend(someMethod) {
    return function () {
      if(!app.BROWSER) {
        let returnVal = someMethod.apply(this, arguments);
        return returnVal;
      } else {
        // I dont think we want to return anything here...
      }
    };
  }

  isModuleActive(modname="") {
    for (let i = 0; i < this.mods.length; i++) {
      if (this.mods[i].browser_active == 1) { if (modname == this.mods[i].name) { return 1; } }
    }
    return 0;
  }

  returnActiveModule() {
    for (let i = 0; i < this.mods.length; i++) {
      if (this.mods[i].browser_active == 1) { return this.mods[i]; }
    }
    return null;
  }

  attachEvents() {
    for (let imp = 0; imp < this.mods.length; imp++) {
      if (this.mods[imp].browser_active == 1) {
        //this.mods[imp].attachEvents(this.app);
        Mods.maybeRun(this.app, this.mods[imp].attachEvents).call(this.mods[imp], this.app);
      }
    }
    return null;
  }
  // This appears to be unused...
  // attachEmailEvents() {
  //   for (let imp = 0; imp < this.mods.length; imp++) {
  //     this.mods[imp].attachEmailEvents(this.app);
  //   }
  //   return null;
  // }

  affixCallbacks(tx, txindex, message, callbackArray, callbackIndexArray) {

    //
    // no callbacks on type=9 spv stubs
    //
    if (tx.transaction.type == 9) { return; }

    for (let i = 0; i < this.mods.length; i++) {
      if (message.module != undefined) {
        if (this.mods[i].shouldAffixCallbackToModule(message.module, tx) == 1) {
          callbackArray.push(this.mods[i].onConfirmation.bind(this.mods[i]));
          callbackIndexArray.push(txindex);
        }
      } else {
        if (this.mods[i].shouldAffixCallbackToModule("", tx) == 1) {
          callbackArray.push(this.mods[i].onConfirmation.bind(this.mods[i]));
          callbackIndexArray.push(txindex);
        }
      }
    }
  }

  handlePeerRequest(message, peer, mycallback=null) {
    for (let iii = 0; iii < this.mods.length; iii++) {
      try {
        this.mods[iii].handlePeerRequest(this.app, message, peer, mycallback);
      } catch (err) {
      }
    }
    return;
  }

  async initialize() {

    //
    // remove any disabled / inactive modules
    //
    if (this.app.options) {
      if (this.app.options.modules) {
        for (let i = 0; i < this.app.options.modules.length; i++) {
          if (this.app.options.modules[i].active == 0) {
            for (let z = 0; z < this.mods.length; z++) {
              if (this.mods[z].name === this.app.options.modules[i].name) {
                this.mods.splice(z, 1);
                z = (this.mods.length+1);
              }
            }
          }
        }
      }
    }



    //
    // install any new modules
    //
    let new_mods_installed = 0;
    let start_installation = 0;
    if (this.app.options.modules == null) {
      start_installation = 1;
      this.app.options.modules = [];
    } else {
      if (this.app.options.modules.length < this.mods.length) { start_installation = 1; }
    }
    if (start_installation) {
      for (let i = 0; i < this.mods.length; i++) {
        let mi = 0;
        let mi_idx = -1;
        let install_this_module = 0;

        for (let j = 0; j < this.app.options.modules.length; j++) { if (this.mods[i].name == this.app.options.modules[j].name) { mi = 1; mi_idx = j; }}

        if (mi == 0) {
          install_this_module = 1;
        } else {
          if (this.app.options.modules[i].installed == 0) {
            install_this_module = 1;
          }
        }

        if (install_this_module == 1) {
          new_mods_installed = 1;
          await this.mods[i].installModule(this.app);
          if (mi_idx != -1) {
            this.app.options.modules[mi_idx].installed = 1;
            if (this.app.options.modules[mi_idx].version == undefined) {
              this.app.options.modules[mi_idx].version == "";
            }
            if (this.app.options.modules[mi_idx].publisher == undefined) {
              this.app.options.modules[mi_idx].publisher == "";
            }
            this.app.options.modules[mi_idx].active = 1;
          } else {
            this.app.options.modules.push({ name : this.mods[i].name , installed : 1 , version : "", publisher : "" , active : 1 });
          }
        }
      }
      if (new_mods_installed == 1) {
        this.app.storage.saveOptions();
      }
    }


    //
    // initialize the modules
    //
    for (let i = 0; i < this.mods.length; i++) {
      //await Mods.maybeRun(this.app, this.mods[i].initialize).call(this.mods[i], this.app);
      await this.mods[i].initialize(this.app);
    }


    //
    // include events here
    //
    this.app.connection.on('handshake_complete', (peer) => {
      this.onPeerHandshakeComplete(peer);
    });

    this.app.connection.on('connection_dropped', (peer) => {
      this.onConnectionUnstable(peer);
    });

    this.app.connection.on('connection_up', (peer) => {
      this.onConnectionStable(peer);
    });

    //
    // .. and setup active module
    //
    if(this.app.BROWSER) {
      await this.app.modules.initializeHTML();
      await this.app.modules.attachEvents();
    }

  }


  initializeHTML() {
    for (let icb = 0; icb < this.mods.length; icb++) {
      if (this.mods[icb].browser_active == 1) {
        //this.mods[icb].initializeHTML(this.app);
        Mods.maybeRun(this.app, this.mods[icb].initializeHTML).call(this.mods[icb], this.app);
      }
    }
    return null;
  }
  // 
  // implementsKeys(request) {
  //   return this.mods
  //     .map(mod => {
  //       return mod.implementsKeys(request);
  //     })
  //     .filter(mod => {
  //       return mod != null;
  //     });
  // }

  respondTo(request) {
    return this.mods
      .filter(mod => {
        return mod.respondTo(request) != null;
      });
  }

  // respondToV2(request) {
  // requestInterface is
  requestInterfaces(request) {
    let compliantInterfaces = [];
    this.mods.forEach((mod) => {
      let itnerface = mod.requestInterface(request);
      if(itnerface != null) {
        compliantInterfaces.push({...itnerface, modname: mod.name});
      }
    });
    return compliantInterfaces;
  }

  // loadFromArchives(tx) {
  //   for (let iii = 0; iii < this.mods.length; iii++) {
  //     //this.mods[iii].loadFromArchives(this.app, tx);
  //     Mods.maybeRun(this.app, this.mods[iii].loadFromArchives).call(this.mods[iii], this.app, tx);
  //   }
  //   return;
  // }

  onNewBlock(blk, i_am_the_longest_chain) {
    for (let iii = 0; iii < this.mods.length; iii++) {
      // this.mods[iii].onNewBlock(blk, i_am_the_longest_chain);
      Mods.maybeRun(this.app, this.mods[iii].onNewBlock).call(this.mods[iii], blk, i_am_the_longest_chain);
    }
    return;
  }

  onChainReorganization(block_id, block_hash, lc, pos) {
    for (let imp = 0; imp < this.mods.length; imp++) {
      // this.mods[imp].onChainReorganization(block_id, block_hash, lc, pos);
      Mods.maybeRun(this.app, this.mods[imp].onNewBlock).call(this.mods[imp], block_id, block_hash, lc, pos);
    }
    return null;
  }

  onPeerHandshakeComplete(peer) {
    for (let i = 0; i < this.mods.length; i++) {
      // this.mods[i].onPeerHandshakeComplete(this.app, peer);
      Mods.maybeRun(this.app, this.mods[i].onNewBlock).call(this.mods[i], this.app, peer);
    }
  }

  onConnectionStable(peer) {
    for (let i = 0; i < this.mods.length; i++) {
      // this.mods[i].onConnectionStable(this.app, peer);
      Mods.maybeRun(this.app, this.mods[i].onConnectionStable).call(this.mods[i], this.app, peer);
    }
  }

  onConnectionUnstable(peer) {
    for (let i = 0; i < this.mods.length; i++) {
      //this.mods[i].onConnectionUnstable(this.app, peer);
      Mods.maybeRun(this.app, this.mods[i].onConnectionUnstable).call(this.mods[i], this.app, peer);
    }
  }


  onWalletReset() {
    for (let i = 0; i < this.mods.length; i++) {
      //this.mods[i].onWalletReset();
      Mods.maybeRun(this.app, this.mods[i].onWalletReset).call(this.mods[i]);
    }
  }


  returnModule(modname) {
    for (let i = 0; i < this.mods.length; i++) {
      if (modname === this.mods[i].name) {
        return this.mods[i];
      }
    }
    return null;
  }

  returnModuleIndex(modname) {
    for (let i = 0; i < this.mods.length; i++) {
      if (modname === this.mods[i].name) {
        return i;
      }
    }
    return -1;
  }

  updateBalance() {
    for (let i = 0; i < this.mods.length; i++) {
      // this.mods[i].updateBalance(this.app);
      Mods.maybeRun(this.app, this.mods[i].updateBalance).call(this.mods[i], this.app);
    }
    return null;
  }

  updateIdentifier() {
    for (let i = 0; i < this.mods.length; i++) {
      // this.mods[i].updateIdentifier(this.app);
      Mods.maybeRun(this.app, this.mods[i].updateIdentifier).call(this.mods[i], this.app);
    }
    return null;
  }

  updateBlockchainSync(current, target) {
    if (this.lowest_sync_bid == -1) { this.lowest_sync_bid = current; }
    target = target-(this.lowest_sync_bid-1);
    current = current-(this.lowest_sync_bid-1);
    if (target < 1) { target = 1; }
    if (current < 1) { current = 1; }
    let percent_downloaded = 100;
    if (target > current) {
      percent_downloaded = Math.floor(100*(current/target));
    }
    for (let i = 0; i < this.mods.length; i++) {
      // this.mods[i].updateBlockchainSync(this.app, percent_downloaded);
      Mods.maybeRun(this.app, this.mods[i].updateBlockchainSync).call(this.mods[i], this.app, percent_downloaded);
    }
    return null;
  }

  webServer(expressapp=null, express=null) {
    for (let i = 0; i < this.mods.length; i++) {
      this.mods[i].webServer(this.app, expressapp, express);
    }
    return null;
  }

}

module.exports = Mods
