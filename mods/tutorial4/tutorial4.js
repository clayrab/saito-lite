var saito = require('../../lib/saito/saito');
var fs = require('fs');
const Big = require('big.js');
var ModTemplate = require('../../lib/templates/modtemplate');

class Tutorial4 extends ModTemplate {

  constructor(app) {
    super(app);
    this.name            = "Tutorial4";
    this.description     = "Writing data";
    this.categories      = "Tutorials";
    
    this.balance = null;
    this.default_html = 1;
    this.txIdObj = {};
    
    //this.initialize = this.onlyOnActiveBrowser(this.initialize.bind(this));
    this.initializeHTML = this.onlyOnActiveBrowser(this.initializeHTML.bind(this));
    this.updateBalance = this.onlyOnActiveBrowser(this.updateBalance.bind(this));
    this.render = this.onlyOnActiveBrowser(this.render.bind(this));
    this.write = this.onlyOnServer(this.write.bind(this));
    return this;
  }
  
  installModule(app) {
    console.log("******** Tutorial4 installModule ********")
    super.installModule(app);
    //this.write(app);
  }
  
  initialize(app) {
    console.log("******** Tutorial4 initialize ********")
    this.readTxId();
    super.initialize(app); 
    //this.write(app);
    
  }

  initializeHTML(app) {
    console.log("tut 4 initializeHTML");
    this.render(app);
    addCss();
  }

  render(app) {
    console.log("tut 4 render");
    document.querySelector("#content .main").innerHTML = makeHTML(this);
    // document.getElementById("getpaid").onclick = (event) => {
    //    fetch(`/gimme?pubkey=${app.wallet.returnPublicKey()}`).then(response => {
    //      console.log(response);
    //    }).catch((err) => {
    //      console.log(err)
    //    });
    // };
    document.getElementById("sendbutton").onclick = (event) => {
     fetch(`/writeservice`).then(response => {
       console.log(response);
     }).catch((err) => {
       console.log(err)
     });
    };
  }

  updateBalance(app) {
    this.balance = app.wallet.returnBalance();
    this.render(app);
  }

  async onConfirmation(blk, tx, confnum, app) {
    let txIdObj = {"blkid": blk.returnId(), "txid": tx.transaction.id }
    this.readTxId(txIdObj);
  }
  async webServer(app, expressapp, express) {
    super.webServer(app, expressapp, express);
    //this.write(app);
    expressapp.get('/writeservice', (function (req, res) {
      this.write(app);
    }).bind(this));
    expressapp.get('/getcraig', (async function (req, res) {
      let success = false;
      if(this.txIdObj) {
        let block = await app.blockchain.returnBlockById(this.txIdObj.blkid);
        if(block){
          block.transactions.forEach((tx) => {
            if(tx.transaction.id === this.txIdObj.txid) {
              let msg = JSON.parse(app.crypto.base64ToString(tx.transaction.m));
              success = true;
              res.type('image/jpeg');
              //res.set({'Content-Type':'image/jpeg', 'Content-Length': Buffer.byteLength(msg.jpgdata)});
              res.status(200);
              res.send(Buffer.from(msg.jpgdata, 'base64'));
            }
          });  
        }    
      }
      if(!success) {
        res.status(400);
        res.send({status: "fail"});  
      }      
    }).bind(this));
  }
  readTxId(txIdObj = null){
    fs.readFile(__dirname + '/txid', null, function (err, data) {
      if (err) {
        if(err.code == 'ENOENT') { // "Error NO ENTity", i.e. the file doesn't exist
          // the id file isn't there, we should write it.
          if(txIdObj){
            fs.writeFile(__dirname + "/txid", JSON.stringify({"blkid": txIdObj.blkid, "txid": txIdObj.txid }), (err) => {
              if (err) throw err;
              console.log('The file has been saved!');
            });  
          }
        } else {
          throw err;
        }
      } else {
        this.txIdObj = JSON.parse(data);
      }
    }.bind(this));
  }
  
  write(app, fee = 2){
    try {
      // var fs = require('fs'),
      // binary = fs.readFileSync('./binary');
      // process.stdout.write(binary.slice(0, 48));
      fs.readFile(__dirname + '/cw.jpg', null, function (err, data) {
        if (err) {
          return console.log(err);
        }
        let toAddress = app.wallet.returnPublicKey();
        let total_fees = Big(fee);
        let newtx = new saito.transaction();
        newtx.transaction.from = app.wallet.returnAdequateInputs(total_fees.toString());
        // add change input
        var total_from_amt = newtx.transaction.from
          .map(slip => slip.amt)
          .reduce((a, b) => Big(a).plus(Big(b)), 0);
        // generate change address(es)
        var change_amount = total_from_amt.minus(total_fees);
        // create slips. We will have one slip with 1 Saito in it for now...
        newtx.transaction.to = app.wallet.createToSlips(1, toAddress, 1, change_amount);
        newtx.msg = {"module": "Tutorial4", jpgdata: data.toString('base64')};
        newtx = app.wallet.signTransaction(newtx);
        app.network.propagateTransaction(newtx);
      });
      // 
      
    } catch(err){
      console.log("error sending transaction");
      console.log(err);
    }
  }
}

function addCss() {
  var style = document.createElement("style");
  style.innerHTML = `
    #content .main {

    }
    #greeting {
      font-size: 24px;
    }
    #wallet {
      width: 50%;
      background-color: #FF6030;
      margin: auto;
      text-align: center;
      margin-top: 5px;
      margin-bottom: 5px;
    }
  `;
  document.head.appendChild(style);
}
function makeHTML(mod) {
  let html =  "";
  html += "<div id='wallet'>";
  html += " <div id='greeting'>My Saito Wallet</div>";
  if(mod.balance) {
  html += " <div>balance:</div>";
  html += " <div>" + mod.balance + "</div>";
  }
  html += " <input id='sendbutton' type='button' value='send'/>";
  html += "</div>"
  return html;
}
module.exports = Tutorial4;
