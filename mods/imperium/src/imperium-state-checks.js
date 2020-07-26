


  /////////////////////
  // Return Factions //
  /////////////////////
  returnFaction(player) {
    if (this.game.players_info[player-1] == null) { return "Unknown"; }
    if (this.game.players_info[player-1] == undefined) { return "Unknown"; }
    return this.returnFactionName(this, player);
  }
  returnFactionName(imperium_self, player) {
    let factions = imperium_self.returnFactions();
    return factions[imperium_self.game.players_info[player-1].faction].name;
  }
  returnPlayerHomeworld(player) {
    let factions = this.returnFactions();
    return factions[this.game.players_info[player-1].faction].homeworld
  }
  returnSpeaker() {
    let factions = this.returnFactions();
    return factions[this.game.players_info[this.game.state.speaker-1].faction].name;
  }
  returnSectorName(pid) {
    return this.game.sectors[this.game.board[pid].tile].name;
  }
  returnPlanetName(sector, planet_idx) {
    let sys = this.returnSectorAndPlanets(sector);
    return sys.p[planet_idx].name;
  }



  returnNameFromIndex(idx=null) {
    if (idx == null) { return ""; }
    if (idx.indexOf("planet") == 0) { if (this.game.planets[idx]) { return this.game.planets[idx].name; } }
    if (idx.indexOf("sector") == 0) { if (this.game.sectors[idx]) { return this.game.sectors[idx].sector; } }
    return idx;
  }


  returnActiveAgenda() {
    for (let i = this.game.queue.length-1; i >= 0; i--) {
      let x = this.game.queue[i].split("\t");
      if (x[0] == "agenda") { return x[1]; }
    }
    return "";
  }


  returnPlayerFleet(player) {

    let obj = {};
        obj.fighters = 0;
        obj.infantry = 0;
        obj.carriers = 0;
        obj.cruisers = 0;
        obj.destroyers = 0;
        obj.dreadnaughts = 0;
        obj.flagships = 0;
        obj.warsuns = 0;
        obj.pds = 0;
        obj.spacedocks = 0;

    for (let i in this.game.sectors) {
      if (this.game.sectors[i].units[player-1]) {
        for (let k in this.game.sectors[i].units[player-1]) {
          let unit = this.game.sectors[i].units[player-1][k];
	  if (unit.type == "fighter")     { obj.fighters++; }
	  if (unit.type == "carrier")     { obj.carriers++; }
	  if (unit.type == "cruiser")     { obj.cruisers++; }
	  if (unit.type == "destroyer")   { obj.destroyers++; }
	  if (unit.type == "dreadnaught") { obj.dreadnaughts++; }
	  if (unit.type == "flagship")    { obj.flagship++; }
	  if (unit.type == "warsun")      { obj.warsun++; }
        }
      }
    }

    for (let i in this.game.planets) {
      if (this.game.planets[i].units[player-1]) {
        for (let k in this.game.planets[i].units[player-1]) {
          let unit = this.game.planets[i].units[player-1][k];
	  if (unit.type == "infantry")  { obj.infantry++; }
	  if (unit.type == "spacedock") { obj.spacedock++; }
  	  if (unit.type == "pds")       { obj.pds++; }
        }
      }
    }

    return obj;

  }


  isPlayerOverCapacity(player, sector) {

    let imperium_self = this;

    let ships_over_capacity = this.returnShipsOverCapacity(player, sector);
    let fighters_over_capacity = this.returnFightersWithoutCapacity(player, sector);

    if (ships_over_capacity > 0) {
      return 1;
    }
    if (fighters_over_capacity > 0) {
      return 1;
    }

    return 0;
  }



  returnSpareFleetSupplyInSector(player, sector) {

    let imperium_self = this;
    let sys = this.returnSectorAndPlanets(sector);
    let fleet_supply = this.game.players_info[player-1].fleet_supply;

    let capital_ships = 0;
    let fighter_ships = 0;
    let total_ships = 0;

    for (let i = 0; i < sys.s.units[player-1].length; i++) {
      let ship = sys.s.units[player-1][i];
      total_ships++;
      if (ship.type == "destroyer") { capital_ships++; }
      if (ship.type == "carrier") { capital_ships++; }
      if (ship.type == "cruiser") { capital_ships++; }
      if (ship.type == "dreadnaught") { capital_ships++; }
      if (ship.type == "flagship") { capital_ships++; }
      if (ship.type == "warsun") { capital_ships++; }
      if (ship.type == "fighter") { fighter_ships++; }
    }

    if ((fleet_supply-capital_ships) > 0) {
      return (fleet_supply-capital_ships);
    }
    
    return 0;
  }

  returnShipsOverCapacity(player, sector) {

    let imperium_self = this;
    let sys = this.returnSectorAndPlanets(sector);
    let fleet_supply = this.game.players_info[player-1].fleet_supply;

    let spare_capacity = 0;
    let capital_ships = 0;
    let fighter_ships = 0;
    let storable_ships = 0;
    let total_capacity = 0;

    for (let i = 0; i < sys.s.units[player-1].length; i++) {
      let ship = sys.s.units[player-1][i];
      total_capacity += ship.capacity;
      spare_capacity += imperium_self.returnRemainingCapacity(ship);
      if (ship.type == "destroyer") { capital_ships++; }
      if (ship.type == "carrier") { capital_ships++; }
      if (ship.type == "cruiser") { capital_ships++; }
      if (ship.type == "dreadnaught") { capital_ships++; }
      if (ship.type == "flagship") { capital_ships++; }
      if (ship.type == "warsun") { capital_ships++; }
      if (ship.type == "fighter") { fighter_ships++; }
    }

    if (capital_ships > fleet_supply) { return (capital_ships - fleet_supply); }
    
    return 0;
  }


  returnFightersWithoutCapacity(player, sector) {

    let imperium_self = this;
    let sys = this.returnSectorAndPlanets(sector);
    let fleet_supply = this.game.players_info[player-1].fleet_supply;

    let spare_capacity = 0;
    let capital_ships = 0;
    let fighter_ships = 0;
    let storable_ships = 0;
    let total_capacity = 0;

    for (let i = 0; i < sys.s.units[player-1].length; i++) {
      let ship = sys.s.units[player-1][i];
      total_capacity += ship.capacity;
      spare_capacity += imperium_self.returnRemainingCapacity(ship);
      if (ship.type == "destroyer") { capital_ships++; }
      if (ship.type == "carrier") { capital_ships++; }
      if (ship.type == "cruiser") { capital_ships++; }
      if (ship.type == "dreadnaught") { capital_ships++; }
      if (ship.type == "flagship") { capital_ships++; }
      if (ship.type == "warsun") { capital_ships++; }
      if (ship.type == "fighter") { fighter_ships++; }
    }

    //
    // fighter II
    //
    if (imperium_self.doesPlayerHaveTech(player, "fighter-ii")) {
      if ((fighter_ships+capital_ships-spare_capacity) > fleet_supply) { return (fighter_ships - (spare_capacity+(fleet_supply-capital_ships))); }
    }

    //
    // fighter I
    //
    if (fighter_ships > total_capacity) { return (fighter_ships - total_capacity); }
    
    return 0;
  }

  checkForVictory() {
    for (let i = 0; i < this.game.players_info.length; i++) {
      if (this.game.players_info[i].vp >= this.vp_needed) {
        this.updateStatus("Game Over: " + this.returnFaction(i+1) + " has reached 14 VP");
        return 1;
      }
    }
    return 0;
  }

  

  returnSectorsWherePlayerCanRetreat(player, sector) {

    let retreat_sectors = [];
    let as = this.returnAdjacentSectors(sector);
    for (let i = 0; i < as.length; i++) {
      let addsec = 0;
      if (this.doesSectorContainPlayerShips(as[i]) && (!this.doesSectorContainNonPlayerShips(as[i]))) { addsec = 1; }
      if (this.doesSectorContainPlanetOwnedByPlayer(sector, player)&& (!this.doesSectorContainNonPlayerShips(as[i]))) { addsec = 1; }
      if (addsec == 1) { retreat_sectors.push(as[i]); }
    }

    return retreat_sectors;
  }
  canPlayerRetreat(player, attacker, defender, sector) {

    let as = this.returnAdjacentSectors(sector);
    for (let i = 0; i < as.length; i++) {
      if (this.doesSectorContainPlayerShips(as[i]) && (!this.doesSectorContainNonPlayerShips(as[i]))) { return 1; }
      if (this.doesSectorContainPlanetOwnedByPlayer(sector, player)&& (!this.doesSectorContainNonPlayerShips(as[i]))) { return 1; }
    }

    return 0;
  }
  

  canPlayerTrade(player) {
    for (let i = 0; i < this.game.players_info.length; i++) {
      if (this.game.players_info[i].traded_this_turn == 0 && (i+1) != this.game.player) {
        if (this.arePlayersAdjacent(this.game.player, (i+1))) {
	  //
	  // anyone have anything to trade?
	  //
	  if (this.game.players_info[this.game.player-1].commodities > 0 || this.game.players_info[this.game.player-1].goods > 0) {
	    if (this.game.players_info[i].commodities > 0 || this.game.players_info[i].goods > 0) {
	      return 1;
	    }
	  }
        }
      }
    }
    return 0;
  }
  
  canPlayerPlayStrategyCard(player) {
    for (let i = 0; i < this.game.players_info[player-1].strategy.length; i++) {
      if (!this.game.players_info[player-1].strategy_cards_played.includes(this.game.players_info[player-1].strategy[i])) {
        return 1;
      }
    }
    return 0;
  }
  
  
  canPlayerPass(player) {
    if (this.canPlayerPlayStrategyCard(player) == 1) { return 0; }
    return 1;
  }

  canPlayerPlayActionCard(player) {
    let array_of_cards = this.returnPlayerActionCards(this.game.player);
    if (array_of_cards.length > 0) {
      return 1;
    } 
    return 0;
  }
  


  exhaustPlayerResearchTechnologyPrerequisites(tech) {

    let mytech = this.game.players_info[this.game.player-1].tech;
    if (mytech.includes(tech)) { return 0; }

    let prereqs = JSON.parse(JSON.stringify(this.tech[tech].prereqs));
    let techfaction = this.tech[tech].faction;
    let techtype = this.tech[tech].type;

    for (let i = 0; i < mytech.length; i++) {
      if (this.tech[mytech[i]]) {
        let color = this.tech[mytech[i]].color;
        for (let j = 0; j < prereqs.length; j++) {
          if (prereqs[j] == color) {
            prereqs.splice(j, 1);
  	    j = prereqs.length;
          }
        }
      }
    }

    //
    // permanent blue tech skip
    //
    if (this.game.players_info[this.game.player-1].permanent_blue_tech_prerequisite == 1) {
      for (let j = 0; j < prereqs.length; j++) {
        if (prereqs[j] == "blue") {
          prereqs.splice(j, 1);
  	  j = prereqs.length;
        }
      }
    }

    //
    // permanent green tech skip
    //
    if (this.game.players_info[this.game.player-1].permanent_green_tech_prerequisite == 1) {
      for (let j = 0; j < prereqs.length; j++) {
        if (prereqs[j] == "green") {
          prereqs.splice(j, 1);
  	  j = prereqs.length;
        }
      }
    }

    //
    // permanent red tech skip
    //
    if (this.game.players_info[this.game.player-1].permanent_red_tech_prerequisite == 1) {
      for (let j = 0; j < prereqs.length; j++) {
        if (prereqs[j] == "red") {
          prereqs.splice(j, 1);
  	  j = prereqs.length;
        }
      }
    }

    //
    // permanent yellow tech skip
    //
    if (this.game.players_info[this.game.player-1].permanent_yellow_tech_prerequisite == 1) {
      for (let j = 0; j < prereqs.length; j++) {
        if (prereqs[j] == "yellow") {
          prereqs.splice(j, 1);
  	  j = prereqs.length;
        }
      }
    }

    //
    // temporary blue tech skip
    //
    if (this.game.players_info[this.game.player-1].temporary_blue_tech_prerequisite == 1) {
      for (let j = 0; j < prereqs.length; j++) {
        if (prereqs[j] == "blue") {
          prereqs.splice(j, 1);
  	  j = prereqs.length;
	  this.game.players_info[this.game.player-1].temporary_blue_tech_prerequisite = 0;
        }
      }
    }

    //
    // temporary green tech skip
    //
    if (this.game.players_info[this.game.player-1].temporary_green_tech_prerequisite == 1) {
      for (let j = 0; j < prereqs.length; j++) {
        if (prereqs[j] == "green") {
          prereqs.splice(j, 1);
  	  j = prereqs.length;
	  this.game.players_info[this.game.player-1].temporary_green_tech_prerequisite = 0;
        }
      }
    }

    //
    // temporary red tech skip
    //
    if (this.game.players_info[this.game.player-1].temporary_red_tech_prerequisite == 1) {
      for (let j = 0; j < prereqs.length; j++) {
        if (prereqs[j] == "red") {
          prereqs.splice(j, 1);
  	  j = prereqs.length;
	  this.game.players_info[this.game.player-1].temporary_red_tech_prerequisite = 0;
        }
      }
    }

    //
    // temporary yellow tech skip
    //
    if (this.game.players_info[this.game.player-1].temporary_yellow_tech_prerequisite == 1) {
      for (let j = 0; j < prereqs.length; j++) {
        if (prereqs[j] == "yellow") {
          prereqs.splice(j, 1);
  	  j = prereqs.length;
	  this.game.players_info[this.game.player-1].temporary_yellow_tech_prerequisite = 0;
        }
      }
    }

    //
    // we don't meet the prereqs but have a skip
    //
    if (prereqs.length >= 1 && this.game.players_info[this.game.player-1].permanent_ignore_number_of_tech_prerequisites_on_nonunit_upgrade >= 1) {
      prereqs.splice(0, 1);
    }


    //
    // we don't meet the prereqs but have a skip
    //
    if (prereqs.length >= 1 && this.game.players_info[this.game.player-1].temporary_ignore_number_of_tech_prerequisites_on_nonunit_upgrade >= 1) {
      prereqs.splice(0, 1);
      this.game_players_info[this.game.player-1].temporary_ignore_number_of_tech_prerequisities_on_nonunit_upgrade = 0;
    }


    //
    // we meet the pre-reqs
    //
    if (prereqs.length == 0) {
      if (techfaction == "all" || techfaction == this.game.players_info[this.game.player-1].faction) {
	if (techtype == "normal") {
          return 1;
	}
      }
    }

    return 0;


  }


  canPlayerResearchTechnology(tech) {
  
    let mytech = this.game.players_info[this.game.player-1].tech;
    if (mytech.includes(tech)) { return 0; }
 
    if (this.tech[tech] == undefined) {
      console.log("Undefined Technology: " + tech);
      return 0;
    }

    let prereqs = JSON.parse(JSON.stringify(this.tech[tech].prereqs));
    let techfaction = this.tech[tech].faction;
    let techtype = this.tech[tech].type;

    //
    // we can use tech to represent non-researchable
    // powers, these are marked as "special" because
    // they cannot be researched or stolen.
    //
    if (techtype == "special") { return 0; };

    for (let i = 0; i < mytech.length; i++) {
      if (this.tech[mytech[i]]) {
        let color = this.tech[mytech[i]].color;
        for (let j = 0; j < prereqs.length; j++) {
          if (prereqs[j] == color) {
            prereqs.splice(j, 1);
    	    j = prereqs.length;
          }
        }
      }
    }

    //
    // temporary blue tech skip
    //
    if (this.game.players_info[this.game.player-1].temporary_blue_tech_prerequisite == 1) {
      for (let j = 0; j < prereqs.length; j++) {
        if (prereqs[j] == "blue") {
          prereqs.splice(j, 1);
  	  j = prereqs.length;
        }
      }
    }

    //
    // temporary green tech skip
    //
    if (this.game.players_info[this.game.player-1].temporary_green_tech_prerequisite == 1) {
      for (let j = 0; j < prereqs.length; j++) {
        if (prereqs[j] == "green") {
          prereqs.splice(j, 1);
  	  j = prereqs.length;
        }
      }
    }

    //
    // temporary red tech skip
    //
    if (this.game.players_info[this.game.player-1].temporary_red_tech_prerequisite == 1) {
      for (let j = 0; j < prereqs.length; j++) {
        if (prereqs[j] == "red") {
          prereqs.splice(j, 1);
  	  j = prereqs.length;
        }
      }
    }

    //
    // temporary yellow tech skip
    //
    if (this.game.players_info[this.game.player-1].temporary_yellow_tech_prerequisite == 1) {
      for (let j = 0; j < prereqs.length; j++) {
        if (prereqs[j] == "yellow") {
          prereqs.splice(j, 1);
  	  j = prereqs.length;
        }
      }
    }

    //
    // permanent blue tech skip
    //
    if (this.game.players_info[this.game.player-1].permanent_blue_tech_prerequisite == 1) {
      for (let j = 0; j < prereqs.length; j++) {
        if (prereqs[j] == "blue") {
          prereqs.splice(j, 1);
  	  j = prereqs.length;
        }
      }
    }

    //
    // permanent green tech skip
    //
    if (this.game.players_info[this.game.player-1].permanent_green_tech_prerequisite == 1) {
      for (let j = 0; j < prereqs.length; j++) {
        if (prereqs[j] == "green") {
          prereqs.splice(j, 1);
  	  j = prereqs.length;
        }
      }
    }

    //
    // permanent red tech skip
    //
    if (this.game.players_info[this.game.player-1].permanent_red_tech_prerequisite == 1) {
      for (let j = 0; j < prereqs.length; j++) {
        if (prereqs[j] == "red") {
          prereqs.splice(j, 1);
  	  j = prereqs.length;
        }
      }
    }

    //
    // permanent yellow tech skip
    //
    if (this.game.players_info[this.game.player-1].permanent_yellow_tech_prerequisite == 1) {
      for (let j = 0; j < prereqs.length; j++) {
        if (prereqs[j] == "yellow") {
          prereqs.splice(j, 1);
  	  j = prereqs.length;
        }
      }
    }

    //
    // we don't meet the prereqs but have a skip
    //
    if (prereqs.length == 1 && this.game.players_info[this.game.player-1].permanent_ignore_number_of_tech_prerequisites_on_nonunit_upgrade >= 1) {
      prereqs.splice(0, 1);
    }

    //
    // we don't meet the prereqs but have a skip
    //
    if (prereqs.length == 1 && this.game.players_info[this.game.player-1].temporary_ignore_number_of_tech_prerequisites_on_nonunit_upgrade >= 1) {
      prereqs.splice(0, 1);
    }

    //
    // we meet the pre-reqs
    //
    if (prereqs.length == 0) {
      if (techfaction == "all" || techfaction == this.game.players_info[this.game.player-1].faction) {
	if (techtype == "normal") {
          return 1;
	}
      }
    }

    return 0;
  
  }


  returnAvailableVotes(player) {

    let array_of_cards = this.returnPlayerPlanetCards(player);
    let total_available_votes = 0;
    for (let z = 0; z < array_of_cards.length; z++) {
      total_available_votes += this.game.planets[array_of_cards[z]].influence;
    }
    return total_available_votes;

  }


  returnPlayersLeastDefendedPlanetInSector(player, sector) {

    let sys = this.returnSectorAndPlanets(sector);
    let least_defended = 100;
    let least_defended_idx = 0;

    if (sys.p.length == 0) { return -1; }
    
    for (let i = 0; i < sys.p.length; i++) {
      if (sys.p[i].owner == player && sys.p[i].units[player-1].length < least_defended) {
	least_defended = sys.p[i].units[player-1].length;
	least_defended_idx = i;
      }
    }

    return least_defended_idx;

  }

  returnPlayerFleetInSector(player, sector) {

    let sys = this.returnSectorAndPlanets(sector);
    let fleet = '';

    for (let i = 0; i < sys.s.units[player-1].length; i++) {
      if (sys.s.units[player-1][i].destroyed == 0) {
        if (i > 0) { fleet += ", "; }
        fleet += sys.s.units[player-1][i].name;
        //if (sys.s.units[player-1][i].storage.length > 0) {
        //  fleet += ' (';
        //  for (let ii = 0; ii < sys.s.units[player-1][i].storage.length; ii++) {
        //    if (ii > 0) { fleet += ", "; }
        //    fleet += sys.s.units[player-1][i].storage[ii].name;
        //  }
        //  fleet += ')';
        //}
      }
    }
    return fleet;
  }


  returnTotalResources(player) {
  
    let array_of_cards = this.returnPlayerPlanetCards(player);
    let total_available_resources = 0;
    for (let z = 0; z < array_of_cards.length; z++) {
      total_available_resources += this.game.planets[array_of_cards[z]].resources;
    }
    total_available_resources += this.game.players_info[player-1].goods;
    return total_available_resources;
  
  }


  returnTotalInfluence(player) {
  
    let array_of_cards = this.returnPlayerPlanetCards(player); // unexhausted
    let total_available_influence = 0;
    for (let z = 0; z < array_of_cards.length; z++) {
      total_available_influence += this.game.planets[array_of_cards[z]].influence;
    }
    total_available_influence += this.game.players_info[player-1].goods;
    return total_available_influence;
  
  }
  
  returnAvailableResources(player) {
  
    let array_of_cards = this.returnPlayerUnexhaustedPlanetCards(player); // unexhausted
    let total_available_resources = 0;
    for (let z = 0; z < array_of_cards.length; z++) {
      total_available_resources += this.game.planets[array_of_cards[z]].resources;
    }
    total_available_resources += this.game.players_info[player-1].goods;
    return total_available_resources;
  
  }


  returnAvailableInfluence(player) {
  
    let array_of_cards = this.returnPlayerUnexhaustedPlanetCards(player); // unexhausted
    let total_available_influence = 0;
    for (let z = 0; z < array_of_cards.length; z++) {
      total_available_influence += this.game.planets[array_of_cards[z]].influence;
    }
    total_available_influence += this.game.players_info[player-1].goods;
    return total_available_influence;
  
  }
  
  
  returnAvailableTradeGoods(player) {
  
    return this.game.players_info[player-1].goods;
  
  }
  
  
  canPlayerActivateSystem(pid) {
  
    let imperium_self = this;
    let sys = imperium_self.returnSectorAndPlanets(pid);
    if (sys.s.activated[imperium_self.game.player-1] == 1) { return 0; }
    return 1;
  
  }




  returnDefender(attacker, sector, planet_idx=null) {

    let sys = this.returnSectorAndPlanets(sector);

    let defender = -1;
    let defender_found = 0;

    if (planet_idx == null) {
      for (let i = 0; i < sys.s.units.length; i++) {
        if (attacker != (i+1)) {
          if (sys.s.units[i].length > 0) {
            defender = (i+1);
          }
        }
      }
      return defender;
    }

    //
    // planet_idx is not null
    //
    for (let i = 0; i < sys.p[planet_idx].units.length; i++) {
      if (attacker != (i+1)) {
        if (sys.p[planet_idx].units[i].length > 0) {
          defender = (i+1);
        }
      }
    }

    if (defender == -1) {
      if (sys.p[planet_idx].owner != attacker) {
	return sys.p[planet_idx].owner;
      }
    }

    return defender;
  }


  hasUnresolvedSpaceCombat(attacker, sector) {
 
    let sys = this.returnSectorAndPlanets(sector);
 
    let defender = 0;
    let defender_found = 0;
    let attacker_found = 0;

    for (let i = 0; i < sys.s.units.length; i++) {
      if (attacker != (i+1)) {
        if (sys.s.units[i].length > 0) {
          for (let b = 0; b < sys.s.units[i].length; b++) {
	    if (sys.s.units[i][b].destroyed == 0) {
              defender = (i+1);
              defender_found = 1;
	    }
	  }
        }
      } else {
        if (sys.s.units[i].length > 0) {
          for (let b = 0; b < sys.s.units[i].length; b++) {
	    if (sys.s.units[i][b].destroyed == 0) {
	      attacker_found = 1;
	    }
	  }
	}
      }
    }

    if (defender_found == 0) {
      return 0;
    }
    if (defender_found == 1 && attacker_found == 1) { 
      return 1;
    }

    return 0;

  }



  hasUnresolvedGroundCombat(attacker, sector, pid) {

    let sys = this.returnSectorAndPlanets(sector);

    let defender = -1;
    for (let i = 0; i < sys.p[pid].units.length; i++) {
      if (sys.p[pid].units[i].length > 0) {
        if ((i+1) != attacker) {
	  defender = (i+1);
	}
      }
    }

    if (defender == attacker) { 
      return 0; 
    }

    if (attacker == -1) {
      attacker_forces = 0;
    } else {
      attacker_forces = this.returnNumberOfGroundForcesOnPlanet(attacker, sector, pid);
    }
    if (defender == -1) {
      defender_forces = 0;
    } else {
      defender_forces = this.returnNumberOfGroundForcesOnPlanet(defender, sector, pid);
    }

    if (attacker_forces > 0 && defender_forces > 0) { return 1; }
    return 0;

  }


  

  isPlanetExhausted(planetname) {
    if (this.game.planets[planetname].exhausted == 1) { return 1; }
    return 0;
  }

  returnAdjacentSectors(sector) {

    let adjasec = [];
    let s = this.addWormholesToBoardTiles(this.returnBoardTiles());  
    for (let i in s) {

      if (this.game.board[i]) {
        let sys = this.returnSectorAndPlanets(i);
        if (sys.s.sector == sector) {
          for (let t = 0; t < s[i].neighbours.length; t++) {

	    let sys2 = this.returnSectorAndPlanets(s[i].neighbours[t]);

	    adjasec.push(sys2.s.sector);

  	  }
        }
      }

    }
    return adjasec;

  }



  areSectorsAdjacent(sector1, sector2) {

    let s = this.addWormholesToBoardTiles(this.returnBoardTiles()); 

    if (sector1 === "") { return 0; }
    if (sector2 === "") { return 0; }

    let sys1 = this.returnSectorAndPlanets(sector1);
    let sys2 = this.returnSectorAndPlanets(sector2);
    let tile1 = sys1.s.tile;
    let tile2 = sys2.s.tile;

    if (tile1 === "" || tile2 === "") { return 0; }

    if (s[tile1].neighbours.includes(tile2)) { return 1; }
    if (s[tile2].neighbours.includes(tile1)) { return 1; }

    for (let i = 0; i < this.game.state.temporary_adjacency.length; i++) {
      if (temporary_adjacency[i][0] == sector1 && temporary_adjacency[i][1] == sector2) { return 1; }
      if (temporary_adjacency[i][0] == sector2 && temporary_adjacency[i][1] == sector1) { return 1; }
    }

    return 0;
  }
  
  arePlayersAdjacent(player1, player2) {

    let p1sectors = this.returnSectorsWithPlayerUnits(player1);
    let p2sectors = this.returnSectorsWithPlayerUnits(player2);

    for (let i = 0; i < p1sectors.length; i++) {
      for (let ii = 0; ii < p2sectors.length; ii++) {
        if (p1sectors[i] === p2sectors[ii]) { return 1; }
	if (this.areSectorsAdjacent(p1sectors[i], p2sectors[ii])) { return 1; }
      }
    }

    return 0;
  }

  isPlayerAdjacentToSector(player, sector) {

    let p1sectors = this.returnSectorsWithPlayerUnits(player);

    for (let i = 0; i < p1sectors.length; i++) {
      if (p1sectors[i] == sector) { return 1; }
      if (this.areSectorsAdjacent(p1sectors[i], sector)) { return 1; }
    }
    return 0;

  }



  isPlayerShipAdjacentToSector(player, sector) {

    let p1sectors = this.returnSectorsWithPlayerShips(player);

    for (let i = 0; i < p1sectors.length; i++) {
      if (p1sectors[i] == sector) { return 1; }
      if (this.areSectorsAdjacent(p1sectors[i], sector)) { return 1; }
    }
    return 0;

  }


  returnPlanetsOnBoard(filterfunc=null) {
    let planets_to_return = [];
    for (let i in this.game.planets) {
      if (this.game.planets[i].tile != "") {
	if (filterfunc == null) {
	  planets_to_return.push(i);
	} else {
	  if (filterfunc(this.game.planets[i])) {
	    planets_to_return.push(i);
	  }
	}
      }
    }
    return planets_to_return;
  }

  returnSectorsOnBoard(filterfunc=null) {
    let sectors_to_return = [];
    for (let i in this.game.sectors) {
      if (this.game.sectors[i].tile) {
	if (filterfunc == null) {
  	  sectors_to_return.push(i);
        } else {
	  if (filterfunc(this.game.sectors[i])) {
  	    sectors_to_return.push(i);
	  }
	}
      }
    }
    return sectors_to_return;
  }


  returnSectorsWithPlayerShips(player) {
    let sectors_with_units = [];
    for (let i in this.game.sectors) {
      if (this.doesSectorContainPlayerShips(player, i)) {
	sectors_with_units.push(i);
      }
    }
    return sectors_with_units;
  }

  returnSectorsWithPlayerUnits(player) {
    let sectors_with_units = [];
    for (let i in this.game.sectors) {
      if (this.doesSectorContainPlayerUnits(player, i)) {
	sectors_with_units.push(i);
      }
    }
    return sectors_with_units;
  }

  canPlayerProduceInSector(player, sector) {
    if (this.game.players_info[player-1].may_player_produce_without_spacedock == 1) {
      return 1;
    }
    let sys = this.returnSectorAndPlanets(sector);
    for (let i = 0; i < sys.p.length; i++) {
      for (let k = 0; k < sys.p[i].units[player-1].length; k++) {
        if (sys.p[i].units[player-1][k].type == "spacedock") {
          return 1;
        }
      }
    }
    return 0;
  }



  canPlayerInvadePlanet(player, sector) {
  
    let sys = this.returnSectorAndPlanets(sector);
    let space_transport_available = 0;
    let planets_ripe_for_plucking = 0;
    let total_available_infantry = 0;
    let can_invade = 0;
  
    //
    // any planets available to invade?
    //
    for (let i = 0; i < sys.p.length; i++) {
      if (sys.p[i].locked == 0 && sys.p[i].owner != player) { planets_ripe_for_plucking = 1; }
    }
    if (planets_ripe_for_plucking == 0) { return 0; }

  
  
    //
    // do we have any infantry for an invasion
    //
    for (let i = 0; i < sys.s.units[player-1].length; i++) {
      let unit = sys.s.units[player-1][i];
      for (let k = 0; k < unit.storage.length; k++) {
        if (unit.storage[k].type == "infantry") {
          total_available_infantry += 1;
        }
      }
      if (unit.capacity > 0) { space_tranport_available = 1; }
    }
  
    //
    // return yes if troops in space
    //
    if (total_available_infantry > 0) {
      return 1;
    }
  
    //
    // otherwise see if we can transfer over from another planet in the sector
    //
    if (space_transport_available == 1) {
      for (let i = 0; i < sys.p.length; i++) {
        for (let k = 0; k < sys.p[i].units[player-1].length; k++) {
          if (sys.p[i].units[player-1][k].type == "infantry") { return 1; }
        }
      }
    }
  
    //
    // sad!
    //
    return 0;
  }
  
  
  

  returnSpeakerOrder() {

    let speaker = this.game.state.speaker;
    let speaker_order = [];
  

    for (let i = 0; i < this.game.players.length; i++) {
      let thisplayer = (i+speaker+1);
      if (thisplayer > this.game.players.length) { thisplayer-=this.game.players.length; }
      speaker_order.push(thisplayer);
    }

    return speaker_order;

  }



  returnInitiativeOrder() {
  
    let strategy_cards   = this.returnStrategyCards();
    let card_io_hmap  = [];
    let player_lowest = [];

    for (let j in strategy_cards) {
      card_io_hmap[j] = strategy_cards[j].rank;
    }

    for (let i = 0; i < this.game.players_info.length; i++) {

      player_lowest[i] = 100000;

      for (let k = 0; k < this.game.players_info[i].strategy.length; k++) {
        let sc = this.game.players_info[i].strategy[k];
        let or = card_io_hmap[sc];
        if (or < player_lowest[i]) { player_lowest[i] = or; }
      }
    }

  
    let loop = player_lowest.length;
    let player_initiative_order = [];

    for (let i = 0; i < loop; i++) {

      let lowest_this_loop 	 = 100000;
      let lowest_this_loop_idx = 0;

      for (let ii = 0; ii < player_lowest.length; ii++) {
        if (player_lowest[ii] < lowest_this_loop) {
	  lowest_this_loop = player_lowest[ii];
	  lowest_this_loop_idx = ii;
	}
      }

      player_lowest[lowest_this_loop_idx] = 999999;
      player_initiative_order.push(lowest_this_loop_idx+1);

    }

    return player_initiative_order;
  
  }




  returnSectorsWithinHopDistance(destination, hops, player=null) {

    let sectors = [];
    let distance = [];
    let s = this.addWormholesToBoardTiles(this.returnBoardTiles());  

    let add_at_end = [];

    sectors.push(destination);
    distance.push(0);

  
    //
    // find which systems within move distance (hops)
    //
    for (let i = 0; i < hops; i++) {
      let tmp = JSON.parse(JSON.stringify(sectors));
      for (let k = 0; k < tmp.length; k++) {

//
// 2/3-player game will remove some tiles
//
if (this.game.board[tmp[k]] != undefined) {

	//
	// if the player is provided and this sector has ships from 
	// other players, then we cannot calculate hop distance as 
	// it would mean moving through systems that are controlled by
	// other players.
	//
	let can_hop_through_this_sector = 1;

	if (player == null) {} else {
	  if (this.game.players_info[player-1].move_through_sectors_with_opponent_ships == 1 || this.game.players_info[player-1].temporary_move_through_sectors_with_opponent_ships == 1) {
	  } else {
	    if (this.doesSectorContainNonPlayerShips(player, tmp[k])) {
	      can_hop_through_this_sector = 0;
	    }
	  }
	}


        //
        // ASTEROIDS
        //
        if (tmp[k].type == 3) {
          if (this.game.players_info[player-1].fly_through_asteroids == 0) {
            can_hop_through_this_sector = 0;
          }
        }


        //
        // SUPERNOVA
        //
        if (tmp[k].type == 4) {
          if (this.game.players_info[player-1].fly_through_supernovas == 0) {
            can_hop_through_this_sector = 0;
          }
        }


        //
        // NEBULA
        //
        if (tmp[k].type == 2) {
          if (this.game.players_info[player-1].fly_through_nebulas == 0) {
            can_hop_through_this_sector = 0;
          }
        }


	//
	// otherwise we can't move into our destination
	//
	if (tmp[k] == destination) { can_hop_through_this_sector = 1; }


	if (can_hop_through_this_sector == 1) {

	  //
	  // board adjacency 
	  //
          let neighbours = s[tmp[k]].neighbours;
          for (let m = 0; m < neighbours.length; m++) {
    	    if (!sectors.includes(neighbours[m]))  {
  	      sectors.push(neighbours[m]);
  	      distance.push(i+1);
  	    }
          }

	  //
	  // temporary adjacency 
	  //
          for (let z = 0; z < this.game.state.temporary_adjacency.length; z++) {
	    if (tmp[k] == this.game.state.temporary_adjacency[z][0]) {
  	      if (!sectors.includes(this.game.state.temporary_adjacency[z][1]))  {
  	        sectors.push(this.game.state.temporary_adjacency[z][1]);
  	        distance.push(i+1);
  	      }
	    }
	    if (tmp[k] == this.game.state.temporary_adjacency[z][1]) {
  	      if (!sectors.includes(this.game.state.temporary_adjacency[z][0]))  {
  	        sectors.push(this.game.state.temporary_adjacency[z][0]);
  	        distance.push(i+1);
  	      }
	    }
	  }
	}
}
      }
    }
    return { sectors : sectors , distance : distance };
  }
  




  doesPlanetHavePDS(planet) {
    if (planet.units == undefined) {
      let x = this.game.planets[planet];
      if (x.units) { planet = x; }
      else { return 0; }
    }
    for (let i = 0; i < planet.units.length; i++) {
      for (let ii = 0; ii < planet.units[i].length; ii++) {
	if (planet.units[i][ii].type == "pds") { return 1; }
      }
    }
    return 0;
  }


  doesPlanetHaveSpaceDock(planet) {
    if (planet.units == undefined) { planet = this.game.planets[planet]; }
    for (let i = 0; i < planet.units.length; i++) {
      for (let ii = 0; ii < planet.units[i].length; ii++) {
	if (planet.units[i][ii].type == "spacedock") { return 1; }
      }
    }
    return 0;
  }


  doesPlanetHaveInfantry(planet) {
console.log("p: " + planet);
    if (planet.units == undefined) { planet = this.game.planets[planet]; }
    for (let i = 0; i < planet.units.length; i++) {
      for (let ii = 0; ii < planet.units[i].length; ii++) {
	if (planet.units[i][ii].type == "infantry") { return 1; }
      }
    }
    return 0;
  }


  doesPlanetHaveUnits(planet) {
    if (planet.units == undefined) { planet = this.game.planets[planet]; }
    for (let i = 0; i < planet.units.length; i++) {
      if (planet.units[i].length > 0) { return 1; }
    }
    return 0;
  }




  doesPlanetHavePlayerInfantry(planet, player) {
    if (planet.units == undefined) { planet = this.game.planets[planet]; }
    for (let ii = 0; ii < planet.units[player-1].length; ii++) {
      if (planet.units[i][ii].type == "infantry") { return 1; }
    }
    return 0;
  }


  doesPlanetHavePlayerSpaceDock(planet, player) {
    for (let ii = 0; ii < planet.units[player-1].length; ii++) {
      if (planet.units[i][ii].type == "spacedock") { return 1; }
    }
    return 0;
  }


  doesPlanetHavePlayerPDS(planet, player) {
    for (let ii = 0; ii < planet.units[player-1].length; ii++) {
      if (planet.units[i][ii].type == "pds") { return 1; }
    }
    return 0;
  }



  doesPlayerHaveRider(player) {

    for (let i = 0; i < this.game.state.riders.length; i++) {
      if (this.game.state.riders[i].player == player) { return 1; }
    }

    if (this.game.turn) {
      for (let i = 0; i < this.game.turn.length; i++) {
console.log("RIDER: " + this.game.turn[i]);
	if (this.game.turn[i]) {
	  let x = this.game.turn[i].split("\t");
	  if (x[0] == "rider") { if (x[1] == this.game.player) { return 1; } }
	}
      }
    }

    return 0;

  }


  doesPlayerHaveInfantryOnPlanet(player, sector, planet_idx) {

    let sys = this.returnSectorAndPlanets(sector);
    if (sys.p[planet_idx].units[player-1].length > 0) { return 1; }
    return 0;

  }



  doesPlayerHaveShipsInSector(player, sector) {

    let sys = this.returnSectorAndPlanets(sector);
    if (sys.s.units[player-1].length > 0) { 
      for (let i = 0; i < sys.s.units[player-1].length; i++) {
        if (sys.s.units[player-1][i].destroyed == 0) { return 1; } 
      }
    }
    return 0;

  }


  doesPlayerHaveUnitOnBoard(player, unittype) {

    for (let i in this.game.sectors) {
      for (let ii = 0; ii < this.game.sectors[i].units[player-1].length; ii++) {
	if (this.game.sectors[i].units[player-1][ii].type == unittype) { return 1; }
      }
    }

    for (let i in this.game.planets) {
      for (let ii = 0; ii < this.game.planets[i].units[player-1].length; ii++) {
	if (this.game.planets[i].units[player-1][ii].type == unittype) { return 1; }
      }
    }

    return 1;

  }


  doesPlayerHavePDSUnitsWithinRange(attacker, player, sector) {

    let sys = this.returnSectorAndPlanets(sector);
    let x = this.returnSectorsWithinHopDistance(sector, 1);
    let sectors = [];
    let distance = [];

    sectors = x.sectors;
    distance = x.distance;

    //
    // get pds units within range
    //
    let battery = this.returnPDSWithinRange(attacker, sector, sectors, distance);

    for (let i = 0; i < battery.length; i++) {
      if (battery[i].owner == player) { return 1; }
    }

    return 0;
  }


  returnPDSWithinRangeOfSector(attacker, player, sector) {

    let sys = this.returnSectorAndPlanets(sector);
    let x = this.returnSectorsWithinHopDistance(sector, 1);
    let sectors = [];
    let distance = [];

    let defender = -1;
    for (let i = 0; i < this.game.players_info.length; i++) {
      if (sys.s.units[i].length > 0 && (i+1) != attacker) {
	defender = (i+1);
      }
    }


    sectors = x.sectors;
    distance = x.distance;

    //
    // get pds units within range
    //
    let battery = this.returnPDSWithinRange(attacker, sector, sectors, distance);

    let z = this.returnEventObjects();
    for (let z_index in z) {
      for (let i = 0; i < this.game.players_info.length; i++) {
	battery = z[z_index].returnPDSUnitsWithinRange(this, (i+1), attacker, defender, sector, battery);
      }
    }

    return battery;

  }



  returnPDSWithinRange(attacker, destination, sectors, distance) {
  
    let z = this.returnEventObjects();
    let battery = [];
  
    for (let i = 0; i < sectors.length; i++) {
  
      let sys = this.returnSectorAndPlanets(sectors[i]);

      //
      // experimental battlestation
      //
      for (let z = 0; z < this.game.players_info.length; z++) {
        if (this.game.players_info[z].experimental_battlestation === sectors[i]) {
          let pds = {};
  	      pds.combat = this.returnUnit((z+1), "pds").combat;
  	      pds.owner = (z+1);
  	      pds.sector = sectors[i];
    	  battery.push(pds);
        }  
      }


      //
      // some sectors not playable in 3 player game
      //
      if (sys != null) {
        for (let j = 0; j < sys.p.length; j++) {
          for (let k = 0; k < sys.p[j].units.length; k++) {
  	  if (k != attacker-1) {
  	      for (let z = 0; z < sys.p[j].units[k].length; z++) {
    	        if (sys.p[j].units[k][z].type == "pds") {
  		  if (sys.p[j].units[k][z].range >= distance[i]) {
  	            let pds = {};
  	                pds.combat = sys.p[j].units[k][z].combat;
  		        pds.owner = (k+1);
  		        pds.sector = sectors[i];
  	            battery.push(pds);
  	  	  }
  	        }
  	      }
  	    }
          }
        }
      }
    }

    return battery;
  
  }
  




  returnShipsMovableToDestinationFromSectors(destination, sectors, distance) {
  
    let imperium_self = this;
    let ships_and_sectors = [];
    for (let i = 0; i < sectors.length; i++) {
  
      let sys = this.returnSectorAndPlanets(sectors[i]);
      
  
      //
      // some sectors not playable in 3 player game
      //
      if (sys != null) {
  
        let x = {};
        x.ships = [];
        x.ship_idxs = [];
        x.sector = null;
        x.distance = distance[i];
        x.adjusted_distance = [];
  
        //
        // only move from unactivated systems
        //
        if (sys.s.activated[imperium_self.game.player-1] == 0) {
  
          for (let k = 0; k < sys.s.units[this.game.player-1].length; k++) {
            let this_ship = sys.s.units[this.game.player-1][k];
            if (this_ship.move >= distance[i]) {
  	    x.adjusted_distance.push(distance[i]);
              x.ships.push(this_ship);
              x.ship_idxs.push(k);
              x.sector = sectors[i];
            }
          }
          if (x.sector != null) {
            ships_and_sectors.push(x);
          }
        }
  
      }
    }
  
    return ships_and_sectors;
  
  }
 


  returnNumberOfGroundForcesOnPlanet(player, sector, planet_idx) {
  
    let sys = this.returnSectorAndPlanets(sector);
    let num = 0;

    for (let z = 0; z < sys.p[planet_idx].units[player-1].length; z++) {
      if (sys.p[planet_idx].units[player-1][z].strength > 0 && sys.p[planet_idx].units[player-1][z].destroyed == 0) {
        if (sys.p[planet_idx].units[player-1][z].type === "infantry" && sys.p[planet_idx].units[player-1][z].destroyed == 0) {
          num++;
        }
      }
    }
  
    return num;
  }


  
  
  ///////////////////////////////
  // Return System and Planets //
  ///////////////////////////////
  //
  // pid can be the tile "2_2" or the sector name "sector42"
  //
  returnSectorAndPlanets(pid) {

    let sys = null;
    
    if (this.game.board[pid] == null) {
      //
      // then this must be the name of a sector
      //
      if (this.game.sectors[pid]) {
        sys = this.game.sectors[pid];
      } else {
        return;
      }
    } else {
      if (this.game.board[pid].tile == null) {
        return;
      } else {
        sys = this.game.sectors[this.game.board[pid].tile];
      }
    }

    if (sys == null) { return null; }

    let planets = [];

    for (let i = 0; i < sys.planets.length; i++) {
      planets[i] = this.game.planets[sys.planets[i]];
    }
  
    return {
      s: sys,
      p: planets
    };
  }; 
  
  


  /////////////////////////////
  // Save System and Planets //
  /////////////////////////////
  saveSystemAndPlanets(sys) {
    for (let key in this.game.sectors) {
      if (this.game.sectors[key].img == sys.s.img) {
        this.game.sectors[key] = sys.s;
        for (let j = 0; j < this.game.sectors[key].planets.length; j++) {
          this.game.planets[this.game.sectors[key].planets[j]] = sys.p[j];
        }
      }
    }
  };
  
  



  
  returnOtherPlayerHomeworldPlanets(player=this.game.player) {
  
    let planets = [];
  
    for (let i = 0; i < this.game.players_info.length; i++) {
      if (this.game.player != (i+1)) {
        let their_home_planets = this.returnPlayerHomeworldPlanets((i+1));
        for (let z = 0; z < their_home_planets.length; z++) {
          planets.push(their_home_planets);
        }
      }
    }
  
    return planets;
  
  }
  
  
  returnPlayerHomeworldPlanets(player=null) {
    if (player == null) { player = this.game.player; }
    let home_sector = this.game.board[this.game.players_info[player-1].homeworld].tile;  // "sector";
    return this.game.sectors[home_sector].planets;
  }
  
  returnPlayerUnexhaustedPlanetCards(player=null) {
    if (player == null) { player = this.game.player; }
    return this.returnPlayerPlanetCards(player, 1);
  }
  returnPlayerExhaustedPlanetCards(player=null) {
    if (player == null) { player = this.game.player; }
    return this.returnPlayerPlanetCards(player, 2);
  }
  // mode = 0 ==> all
  // mode = 1 ==> unexausted
  // mode = 2 ==> exhausted
  //
  returnPlayerPlanetCards(player=null, mode=0) {
  
    if (player == null) { player == parseInt(this.game.player); }

    let x = [];
  
    for (var i in this.game.planets) {

      if (this.game.planets[i].owner == player) {

        if (mode == 0) {
          x.push(i);
        }
        if (mode == 1 && this.game.planets[i].exhausted == 0) {
          x.push(i);
        }
        if (mode == 2 && this.game.planets[i].exhausted == 1) {
  	  x.push(i);
        }
      }
    }
  
    return x;
  
  }
  returnPlayerActionCards(player=null, types=[]) {

    if (player == null) { player = this.game.player; }  

    let x = [];
    //
    // deck 2 -- hand #1 -- action cards
    //
    for (let i = 0; i < this.game.deck[1].hand.length; i++) {
      if (types.length == 0) {
        if (!this.game.players_info[player-1].action_cards_played.includes(this.game.deck[1].hand[i])) {
	  x.push(this.game.deck[1].hand[i]);
	}
      } else {
	if (types.includes(this.action_cards[this.game.deck[1].hand[i]].type)) {
          if (!this.game.players_info[player-1].action_cards_played.includes(this.game.deck[1].hand[i])) {
	    x.push(this.game.deck[1].hand[i]);
	  }
	}
      }
    }
  
    return x;
  
  }
  returnPlayerObjectives(player=null, types=[]) {

    if (player == null) { player = this.game.player; }  

    let x = [];

    //
    // deck 6 -- hand #5 -- secret objectives
    //
    if (this.game.player == player) {
      for (let i = 0; i < this.game.deck[5].hand.length; i++) {
        if (types.length == 0) {
  	  x.push(this.secret_objectives[this.game.deck[5].hand[i]]);
        } else {
  	  if (types.includes("secret_objectives")) {
	    x.push(this.secret_objectives[this.game.deck[5].hand[i]]);
	  }
        }
      }
    }

    //
    // stage 1 public objectives
    //
    for (let i = 0; i < this.game.state.stage_i_objectives.length; i++) {
      if (types.length == 0) {
	x.push(this.stage_i_objectives[this.game.state.stage_i_objectives[i]]);
      } else {
	if (types.includes("stage_i_objectives")) {
	  x.push(this.stage_i_objectives[this.game.state.stage_i_objectives[i]]);
	}
      }
    }


    //
    // stage 2 public objectives
    //
    for (let i = 0; i < this.game.state.stage_ii_objectives.length; i++) {
      if (types.length == 0) {
	x.push(this.stage_ii_objectives[this.game.state.stage_ii_objectives[i]]);
      } else {
	if (types.includes("stage_ii_objectives")) {
	  x.push(this.stage_ii_objectives[this.game.state.stage_ii_objectives[i]]);
	}
      }
    }

    return x;
  
  }
  
  returnPlanetCard(planetname="") {
  
    var c = this.game.planets[planetname];
    if (c == undefined) {
  
      //
      // this is not a card, it is something like "skip turn" or cancel
      //
      return '<div class="noncard">'+cardname+'</div>';
  
    }
  
    var html = `
      <div class="planetcard" style="background-image: url('${c.img}');">
      </div>
    `;
    return html;
  
  }
  
  
  returnStrategyCard(cardname) {
  
    let cards = this.returnStrategyCards();
    let c = cards[cardname];
  
    if (c == undefined) {
  
      //
      // this is not a card, it is something like "skip turn" or cancel
      //
      return '<div class="noncard">'+cardname+'</div>';
  
    }
  
    var html = `
      <div class="strategycard" style="background-image: url('${c.img}');">
        <div class="strategycard_name">${c.name}</div>
      </div>
    `;
    return html;
  
  }
  
  
  returnActionCard(cardname) {

    let cards = this.returnActionCards();
    let c = cards[cardname];
 
  }

  doesSectorContainPlanetOwnedByPlayer(sector, player) {

    let sys = this.returnSectorAndPlanets(sector);
    if (!sys) { return 0; }
    for (let i = 0; i < sys.p.length; i++) {
      if (sys.p[i].owner == player) { 
	return 1;
      }
    }
    return 0;
 
  }

  doesSectorContainUnit(sector, unittype) {

    let sys = this.returnSectorAndPlanets(sector);
    if (!sys) { return 0; }
    for (let i = 0; i < sys.s.units.length; i++) {
      for (let ii = 0; ii < sys.s.units[i].length; ii++) {
        if (sys.s.units[i][ii].type == unittype) {
	  return 1;
	}
      }
    }
    return 0;
 
  }


  doesSectorContainPlayerShip(player, sector) {
    return this.doesSectorContainPlayerShips(player, sector);
  }
  doesSectorContainPlayerShips(player, sector) {
    let sys = this.returnSectorAndPlanets(sector);
    if (!sys) { return 0; }
    if (sys.s.units[player-1].length > 0) { return 1; }
    return 0;
  }

  doesSectorContainShips(sector) {
    let sys = this.returnSectorAndPlanets(sector);
    if (!sys) { return 0; }
    for (let i = 0; i < sys.s.units.length; i++) { 
      if (sys.s.units[i].length > 0) { return 1; }
    }
    return 0;
  }

  doesSectorContainPlayerUnits(player, sector) {
    let sys = this.returnSectorAndPlanets(sector);
    if (!sys) { return 0; }
    if (sys.s.units[player-1].length > 0) { return 1; }
    for (let i = 0; i < sys.p.length; i++) {
      if (sys.p[i].units[player-1].length > 0) { return 1; }
    }
    return 0;
  }


  doesSectorContainNonPlayerUnit(player, sector, unittype) {

    for (let i = 0; i < this.game.players_info.length; i++) {
      if ((i+1) != player) {
	if (this.doesSectorContainPlayerUnit((i+1), sector, unittype)) { return 1; }
      }
    }

    return 0;
 
  }
  
  doesSectorContainNonPlayerShips(player, sector) {
    for (let i = 0; i < this.game.players_info.length; i++) {
      if ((i+1) != player) {
	if (this.doesSectorContainPlayerShips((i+1), sector)) { return 1; }
      }
    }
    return 0;
  }
  

  doesSectorContainPlayerUnit(player, sector, unittype) {

    let sys = this.returnSectorAndPlanets(sector);
    if (!sys) { return 0; }

    for (let i = 0; i < sys.s.units[player-1].length; i++) {
      if (sys.s.units[player-1][i].type == unittype) { return 1; }
    }
    for (let i = 0; i < sys.p.length; i++) {
      for (let ii = 0; ii < sys.p[i].units[player-1].length; ii++) {
        if (sys.p[i].units[player-1][ii].type == unittype) { return 1; }
      }
    }
    return 0;
 
  }
  
  


