const ArcadeMainTemplate = require('./templates/arcade-main.template');
const ArcadePosts = require('./arcade-posts');
const ArcadeInfobox = require('./arcade-infobox');
const SaitoCarousel = require('../../../../lib/saito/ui/saito-carousel/saito-carousel');
const ArcadeGameDetails = require('./arcade-game-details');

let tabNames = ["arcade", "observables", "tournaments"];
module.exports = ArcadeMain = {

  render(app, mod) {

    if (!document.getElementById("arcade-container")) { app.browser.addElementToDom('<div id="arcade-container" class="arcade-container"></div>'); }
    if (!document.querySelector(".arcade-main")) { app.browser.addElementToDom(ArcadeMainTemplate(app, mod, mod.games), "arcade-container"); }

    tabNames.forEach((tabButtonName, i) => {
      document.querySelector("#tab-button-" + tabButtonName).onclick = () => {
        tabNames.forEach((tabName, i) => {
          if (tabName === tabButtonName) {
            document.querySelector("#" + tabName + "-hero").classList.remove("arcade-tab-hidden");
            document.querySelector("#tab-button-" + tabName).classList.add("active-tab-button");
          } else {
            document.querySelector("#" + tabName + "-hero").classList.add("arcade-tab-hidden");
            document.querySelector("#tab-button-" + tabName).classList.remove("active-tab-button");
          }
        });
      }
    });

    //add invites to arcade-hero section
    if (document.querySelector('.arcade-hero')) {
      mod.games.forEach((invite, i) => {
        app.browser.addElementToElement(ArcadeInviteTemplate(app, mod, invite, i), document.querySelector('.arcade-hero'));
      });
      //add the count of games to the box to let the grid know what to render;
      document.querySelector('.arcade-hero').classList.add("of_"+mod.games.length);
    }

    //
    // invite join buttons
    //
    mod.games.forEach((invite, i) => {
      document.querySelector(`#invite-${invite.transaction.sig} .invite-tile-join-button`).onclick = () => {
        ArcadeGameDetails.render(app, mod, invite);
        ArcadeGameDetails.attachEvents(app, mod);
      }
    });


    ArcadePosts.render(app, mod);
    ArcadeInfobox.render(app, mod);
    let carousel = new SaitoCarousel(app);
    carousel.render(app, mod);

  },

  attachEvents(app, mod) {

  },
}
