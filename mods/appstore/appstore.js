const helpers = require('../../lib/helpers/index');
const ModTemplate = require('../../lib/templates/modtemplate');
const AppStoreAppspace = require('./lib/email-appspace/appstore-appspace');
const AppStoreBundleConfirm = require('./lib/email-appspace/appstore-bundle-confirm');
const fs = require('fs');
const path = require('path');



class AppStore extends ModTemplate {

  constructor(app) {
    super(app);

    this.app = app;

    this.name          = "AppStore";
    this.description   = "Application manages installing, indexing, compiling and serving Saito modules.";
    this.categories    = "Utilities Dev";
    this.alwaysRun = 1;
    this.featured_apps = ['Email', 'Testing', 'Escrow', 'Design'];
  }


  //
  // appstore displays in email
  //
  respondTo(type) {
    if (type == 'email-appspace') {
      let obj = {};
      obj.render = this.renderEmail;
      obj.attachEvents = this.attachEventsEmail;
      obj.script = '<link ref="stylesheet" href="/appstore/css/email-appspace.css" />';
      return obj;
    }
    return null;
  }
  renderEmail(app, data) {
    data.appstore = app.modules.returnModule("AppStore");
    data.helpers = helpers;
    AppStoreAppspace.render(app, data);
  }
  attachEventsEmail(app, data) {
    data.appstore = app.modules.returnModule("AppStore");
    data.helpers = helpers;
    AppStoreAppspace.attachEvents(app, data);
  }



  //
  // database queries inbound here
  //
  async handlePeerRequest(app, message, peer, mycallback = null) {

    super.handlePeerRequest(app, message, peer, mycallback);

    if (message.request === "appstore search modules") {

      let squery1 = "%" + message.data + "%";
      let squery2 = message.data;

      let sql = "SELECT name, description, version, categories, publickey, unixtime, bid, bsh FROM modules WHERE description LIKE $squery1 OR name = $squery2";
      let params = {
        $squery1: squery1,
        $squery2: squery2,
      };

      let rows = await this.app.storage.queryDatabase(sql, params, "appstore");

      let res = {};
      res.err = "";
      res.rows = rows;

      mycallback(res);

    }


  }


  //
  // publish modules into database on module install
  //
  async installModule(app) {

    if (this.app.BROWSER == 1) { return; }

    await super.installModule(app);

    let fs = app.storage.returnFileSystem();

    if (fs != null) {

      const archiver = require('archiver');
      const path = require('path');

      //
      // get a list of module directories
      //
      const getDirectories = source =>
        fs.readdirSync(source, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name)

      let mods_dir_path = path.resolve(__dirname, '../');
      let dirs = getDirectories(mods_dir_path);

      if (!fs.existsSync(path.resolve(__dirname, `mods`))) {
        fs.mkdirSync(path.resolve(__dirname, `mods`));
      }

      //
      // zip each module and output it to modules subdir
      //
      dirs.forEach(dir => {

console.log("##########################");
console.log("##########################");
console.log("##########################");
console.log("processing: " + dir);

        let mod_path = path.resolve(__dirname, `mods/${dir}.zip`);
        let output = fs.createWriteStream(mod_path);

        var archive = archiver('zip', {
          zlib: { level: 9 } // Sets the compression level.
        });

        archive.on('error', function (err) {
          throw err;
        });

        archive.pipe(output);

        let file_array = getFiles(`${mods_dir_path}/${dir}/`);

        //
        // append them to the archiver
        //
        file_array.forEach(file => {
          let fileReadStream = fs.createReadStream(file);
          var fileArray = path.relative(process.cwd(), file).split('/');
          fileArray.splice(0, 2);
          let filename = fileArray.join('/');
          // let pathBasename = path.basename(file);
          archive.append(fileReadStream, { name: filename });
        });

        // listen for all archive data to be written
        // 'close' event is fired only when a file descriptor is involved
        output.on('close', function () {

          let mod_zip_filename = path.basename(this.path);
          let mod_path = path.resolve(__dirname, `mods/${mod_zip_filename}`);
          let newtx = app.wallet.createUnsignedTransactionWithDefaultFee();
          let zip = fs.readFileSync(mod_path, { encoding: 'base64' });



          newtx.msg = {
            module: "AppStore",
            request: "submit module",
            module_zip: zip,
            name: dir,
          };

console.log("About to Fail: " + newtx.msg.name);
console.log("ZIP LEN: " + zip.length);

          newtx = app.wallet.signTransaction(newtx);

          app.network.propagateTransaction(newtx);
        });

        archive.finalize();
      });

    }
  }

  initialize(app) {
    super.initialize(app);
  }


  onConfirmation(blk, tx, conf, app) {

    let txmsg = tx.returnMessage();

    if (conf == 0) {

      switch (txmsg.request) {
        case 'submit module':
          this.submitModule(blk, tx);
          break;
        case 'request bundle':
          if (tx.isFrom(app.wallet.returnPublicKey())) {
            try {
              document.querySelector(".appstore-loading-text").innerHTML = "Your request has been received by the network. Your upgrade should be completed within about 45 seconds.";
            } catch (err) {
            }
          }
          if (!tx.isTo(app.wallet.returnPublicKey())) { return; }
          this.requestBundle(blk, tx);
          break;
        case 'receive bundle':
          if (tx.isTo(app.wallet.returnPublicKey()) && !tx.isFrom(app.wallet.returnPublicKey())) {
            console.log("##### BUNDLE RECEIVED #####");
            //
            //
            //
            if (app.options.appstore) {
              if (app.options.appstore.default != "") {
                if (tx.isFrom(app.options.appstore.default)) {
                  this.receiveBundle(blk, tx);
                }
              }
            }
          }
          break;
      }
    }
  }



  async getNameAndDescriptionFromZip(zip_bin, zip_path) {

    const fs = this.app.storage.returnFileSystem();
    const path = require('path');
    const unzipper = require('unzipper');

    //
    // convert base64 to vinary
    //
    let zip_bin2 = Buffer.from(zip_bin, 'base64').toString('binary');

    fs.writeFileSync(path.resolve(__dirname, zip_path), zip_bin2, { encoding: 'binary' });

    let name = 'Unknown Module';
    let description = 'unknown';
    let categories = 'unknown';

    try {

      const directory = await unzipper.Open.file(path.resolve(__dirname, zip_path));

      let promises = directory.files.map(async file => {

        if (file.path.substr(0,3) == "lib") { return; }
        if (file.path.substr(-2) !== "js") { return; }
        if (file.path.substr(-2) !== "js") { return; }
        if (file.path.indexOf("/") > -1) { return; }
        if (file.path.indexOf("/web/") > -1) { return; }
        if (file.path.indexOf("/www/") > -1) { return; }
        if (file.path.indexOf("/lib/") > -1) { return; }
        if (file.path.indexOf("/license/") > -1) { return; }
        if (file.path.indexOf("/docs/") > -1) { return; }
        if (file.path.indexOf("/sql/") > -1) { return; }

        let content = await file.buffer();
        let zip_text = content.toString('utf-8')
	let zip_lines = zip_text.split("\n");

	let found_name = 0;
	let found_description = 0;
	let found_categories = 0;

	for (let i = 0; i < zip_lines.length && i < 50 && (found_name == 0 || found_description == 0 || found_categories == 0); i++) {

	  //
	  // get name
	  //
	  if (/this.name/.test(zip_lines[i]) && found_name == 0) {
	    found_name = 1;
	    if (zip_lines[i].indexOf("=") > 0) {
	      name = zip_lines[i].substring(zip_lines[i].indexOf("="));
	      name = cleanString(name);
	      name = name.replace(/^\s+|\s+$/gm,'');
	      if (name.length > 50) { name = "Unknown"; found_name = 0; }
	      if (name === "name") { name = "Unknown"; found_name = 0; }
	    }
	  }

	  //
	  // get description
	  //
	  if (/this.description/.test(zip_lines[i]) && found_description == 0) {
	    found_description = 1;
	    if (zip_lines[i].indexOf("=") > 0) {
	      description = zip_lines[i].substring(zip_lines[i].indexOf("="))
	      description = cleanString(description);
	      description = description.replace(/^\s+|\s+$/gm,'');
	    }
	  }

	  //
	  // get categories
	  //
	  if (/this.categories/.test(zip_lines[i]) && found_categories == 0) {
	    found_categories = 1;
	    if (zip_lines[i].indexOf("=") > 0) {
	      categories = zip_lines[i].substring(zip_lines[i].indexOf("="))
	      categories = cleanString(categories);
	      categories = categories.replace(/^\s+|\s+$/gm,'');
	    }
	  }
	}


        function cleanString(str) {
	  str = str.replace(/^\s+|\s+$/gm,'');
          str = str.substring(1, str.length - 1);
          return [...str].map(char => {
            if (char == ' ') { return ' '; }
            if (char == '.') { return '.'; }
            if (char == ',') { return ','; }
            if (char == '!') { return '!'; }
            if (char == '`') { return ''; }
            if (char == "\\" || char == "\'" || char == "\"" || char == ";") { return ''; }
            if (! (/[a-zA-Z0-9_-]/.test(char))) { return ''; }
            return char;
          }).join('');
        }
      });

      await Promise.all(promises);
    } catch (err) {
      console.log(err);
    }

    //
    // delete unziped module
    //
    fs.unlink(path.resolve(__dirname, zip_path));

    return { name, description, categories };
  }



  async submitModule(blk, tx) {

    if (this.app.BROWSER == 1) {

      if (tx.isFrom(this.app.wallet.returnPublicKey())) {

        let newtx = this.app.wallet.createUnsignedTransaction();
            newtx.msg.module       = "Email";
            newtx.msg.title        = "Saito Application Published";
            newtx.msg.message      = `

	    Your application is now available at the following link:

	    <p></p>

	    <a href="http://saito.io/email?module=appstore&app=${tx.transaction.ts}-${tx.transaction.sig}">http://saito.io/email?module=appstore&app=${tx.transaction.ts}-${tx.transaction.sig}</a>

	    <p></p>

	    or by searching on your preferred AppStore for the following APP-ID:

	    <p></p>

	     ${tx.transaction.ts}-${tx.transaction.sig}

            <p></p>

	    If your application does not appear shortly, it means there is a bug in the code preventing AppStores from compiling it successfully. We recommend that you <a href="https://org.saito.tech/developers">install Saito locally</a> and compile and test your module locally to eliminate any errors before uploading in this case.

        `;
        newtx = this.app.wallet.signTransaction(newtx);
	let emailmod = this.app.modules.returnModule("Email");
	if (emailmod) {
          emailmod.emails.inbox.push(newtx);
	}
        this.app.storage.saveTransaction(newtx);

      }

      return;

    }

    let sql = `INSERT OR IGNORE INTO modules (name, description, version, categories, publickey, unixtime, bid, bsh, tx, featured) VALUES ($name, $description, $version, $categories, $publickey, $unixtime, $bid, $bsh, $tx, $featured)`;

    let { from, sig, ts } = tx.transaction;

    // should happen locally from ZIP
    let { module_zip } = tx.returnMessage();

    let { name, description, categories } = await this.getNameAndDescriptionFromZip(module_zip, `mods/module-${sig}-${ts}.zip`);

    let featured_app = 0;
    if (tx.transaction.from[0].add == this.app.wallet.returnPublicKey()) { featured_app = 1; }

    let params = {
      $name:name,
      $description: description || '',
      $version: `${ts}-${sig}`,
      $categories: categories,
      $publickey: from[0].add,
      $unixtime: ts,
      $bid: blk.block.id,
      $bsh: blk.returnHash(),
      $tx: JSON.stringify(tx.transaction),
      $featured: featured_app,
    };

    if (name != "unknown") {
      try {
      await this.app.storage.executeDatabase(sql, params, "appstore");
      } catch (err) {}

      if (this.featured_apps.includes(name) && tx.isFrom(this.app.wallet.returnPublicKey())) {

        sql = "UPDATE modules SET featured = 0 WHERE name = $name";
        params = { $name: name };
        await this.app.storage.executeDatabase(sql, params, "appstore");


        sql = "UPDATE modules SET featured = 1 WHERE name = $name AND version = $version";
        params = {
          $name: name,
          $version: `${ts}-${sig}`,
        };
        await this.app.storage.executeDatabase(sql, params, "appstore");

      }

    }

  }




  async requestBundle(blk, tx) {

    if (this.app.BROWSER == 1) { return; }

    let sql = '';
    let params = '';
    let txmsg = tx.returnMessage();
    let module_list = txmsg.list;

    //
    // module_list consists of a list of the modules to bundle, these contain a name or
    // version number (or both) depending on how they were originally issued to the
    // client.
    //
    // module list = [
    //   { name : "Email" , version : "" } ,
    //   { name : "", version : "1830591927-AE752CDF7529E0419C2E13ABCCD6ABCA252313" }
    // ]
    //
    let module_names = [];
    let module_versions = [];
    let modules_selected = [];

    for (let i = 0; i < module_list.length; i++) {
      if (module_list[i].version != "") {
        module_versions.push(module_list[i].version);
      } else {
        if (module_list[i].name != "") {
          module_names.push(module_list[i].name);
        }
      }
    }

    //
    // unversioned apps (first as default)
    //
    //
    for (let i = 0; i < module_names.length; i++) {
      sql = `SELECT * FROM modules WHERE name = $name`;
      params = { $name: module_names[i] };
      let rows = await this.app.storage.queryDatabase(sql, params, "appstore");

      for (let i = 0; i < rows.length; i++) {
        let tx = JSON.parse(rows[i].tx);
        modules_selected.push(
          {
            name: rows[i].name,
            description: rows[i].description,
            zip: tx.msg.module_zip
          }
        );
      }
    }

    //
    // versioned apps (second as overrules default)
    //
    for (let i = 0; i < module_versions.length; i++) {
      sql = `SELECT * FROM modules WHERE version = $version`;
      params = { $version: module_versions[i] };
      let rows = await this.app.storage.queryDatabase(sql, params, "appstore");

      for (let i = 0; i < rows.length; i++) {
        let tx = JSON.parse(rows[i].tx);
        modules_selected.push(
          {
            name: rows[i].name,
            description: rows[i].description,
            zip: tx.msg.module_zip
          }
        );
      }
    }


    //
    // WEBPACK
    //
    let bundle_filename = await this.bundler(modules_selected);

    //
    // insert resulting JS into our bundles database
    //
    let bundle_binary = fs.readFileSync(path.resolve(__dirname, `./bundler/dist/${bundle_filename}`), { encoding: 'binary' });

    //
    // show link to bundle or save in it? Should save it as a file
    //
    sql = `INSERT OR IGNORE INTO bundles (version, publickey, unixtime, bid, bsh, name, script) VALUES ($version, $publickey, $unixtime, $bid, $bsh, $name, $script)`;
    let { from, sig, ts } = tx.transaction;
    params = {
      $version: `${ts}-${sig}`,
      $publickey: from[0].add,
      $unixtime: ts,
      $bid: blk.block.id,
      $bsh: blk.returnHash(),
      $name: bundle_filename,
      $script: bundle_binary,
    }

    await this.app.storage.executeDatabase(sql, params, "appstore");

    //
    //
    //
    let online_version = this.app.options.server.endpoint.protocol + "://" + this.app.options.server.endpoint.host + ":" + this.app.options.server.endpoint.port + "/appstore/bundle/" + bundle_filename;


    //
    // send our filename back at our person of interest
    //
    let newtx = this.app.wallet.createUnsignedTransactionWithDefaultFee(from[0].add);
    let msg = {
      module: "AppStore",
      request: "receive bundle",
      bundle: online_version
    };
    newtx.msg = msg;
    newtx = this.app.wallet.signTransaction(newtx);
    this.app.network.propagateTransaction(newtx);

  }





  async bundler(modules) {

    //
    // shell access
    //
    const util = require('util');
    const exec = util.promisify(require('child_process').exec);

    //
    // modules has name, description, version, zip
    //
    const fs = this.app.storage.returnFileSystem();
    const path = require('path');
    const unzipper = require('unzipper');


    let ts = new Date().getTime();
    let hash = this.app.crypto.hash(modules.map(mod => mod.version).join(''));

    let bash_script_create = `mods/compile-${ts}-${hash}-create`;
    let bash_script = `mods/compile-${ts}-${hash}`;

    let newappdir = `${ts}-${hash}`;

    let bash_script_content = '';
    let bash_script_delete = '';
    let bash_script_create_dirs = '';

    //
    // create and execute script that creates directories
    //
    bash_script_create_dirs = 'cp -rf '  + __dirname + "/../../bundler/default " + __dirname + "/../../bundler/" + newappdir + "\n";
    bash_script_create_dirs += 'rm -f '  + __dirname + "/../../bundler/" + newappdir + "/config/*.js" + "\n";
    bash_script_create_dirs += 'rm -rf ' + __dirname + "/../../bundler/" + newappdir + "/mods" + "\n";
    bash_script_create_dirs += 'mkdir  ' + __dirname + "/../../bundler/" + newappdir + "/mods" + "\n";
    bash_script_create_dirs += 'mkdir  ' + __dirname + "/../../bundler/" + newappdir + "/dist" + "\n";


    fs.writeFileSync(path.resolve(__dirname, bash_script_create), bash_script_create_dirs, { encoding: 'binary' });
    try {
      let cwdir = __dirname;
      let createdir_command = 'sh ' + bash_script_create;
      const { stdout, stderr } = await exec(createdir_command, { cwd: cwdir, maxBuffer: 4096 * 2048 });
    } catch (err) {
      console.log(err);
    }


    bash_script_content += 'cd ' + __dirname + '/mods' + "\n";
    bash_script_delete  += 'cd ' + __dirname + '/mods' + "\n";

    //
    // save MODS.zip and create bash script to unzip
    //
    let module_paths = modules.map(mod => {

      let mod_path = `mods/${returnSlug(mod.name)}-${ts}-${hash}.zip`;


      bash_script_content += `unzip ${returnSlug(mod.name)}-${ts}-${hash}.zip -d ../../../bundler/${newappdir}/mods/${returnSlug(mod.name)} \\*.js \\*.css \\*.html \\*.wasm` + "\n";
      bash_script_content += `rm -rf ../../../bundler/${newappdir}/mods/${returnSlug(mod.name)}/web` + "\n";
      bash_script_content += `rm -rf ../../../bundler/${newappdir}/mods/${returnSlug(mod.name)}/www` + "\n";
      bash_script_content += `rm -rf ../../../bundler/${newappdir}/mods/${returnSlug(mod.name)}/sql` + "\n";
      bash_script_content += `rm -rf ../../../bundler/${newappdir}/mods/${returnSlug(mod.name)}/DESCRIPTION.txt` + "\n";
      bash_script_content += `rm -rf ../../../bundler/${newappdir}/mods/${returnSlug(mod.name)}/BUGS.txt` + "\n";
      bash_script_content += `rm -rf ../../../bundler/${newappdir}/mods/${returnSlug(mod.name)}/README.txt` + "\n";
      bash_script_content += `rm -rf ../../../bundler/${newappdir}/mods/${returnSlug(mod.name)}/README.md` + "\n";
      bash_script_content += `rm -rf ../../../bundler/${newappdir}/mods/${returnSlug(mod.name)}/install.sh` + "\n";
      bash_script_content += `rm -rf ../../../bundler/${newappdir}/mods/${returnSlug(mod.name)}/license` + "\n";

      bash_script_delete += `rm -rf ${returnSlug(mod.name)}-${ts}-${hash}.zip` + "\n";
      bash_script_delete += `rm -rf ../../bundler/${newappdir}/mods/${returnSlug(mod.name)}` + "\n";

      let zip_bin2 = Buffer.from(mod.zip, 'base64').toString('binary');
      fs.writeFileSync(path.resolve(__dirname, mod_path), zip_bin2, { encoding: 'binary' });
      //return `${returnSlug(mod.name)}-${ts}-${hash}/${returnSlug(mod.name)}`;
      return `${returnSlug(mod.name)}/${returnSlug(mod.name)}.js`;
    });


    bash_script_delete += `rm -f ${__dirname}/mods/compile-${ts}-${hash}-create` + "\n";
    bash_script_delete += `rm -f ${__dirname}/mods/compile-${ts}-${hash}` + "\n";


    //
    // write our modules config file
    //
    let modules_config_filename = `modules.config-${ts}-${hash}.json`;
    await fs.writeFile(path.resolve(__dirname, `../../bundler/${newappdir}/config/${modules_config_filename}`),
      JSON.stringify({ mod_paths: module_paths })
    );

    //
    // other filenames
    //
    let bundle_filename = `saito-${ts}-${hash}.js`;
    let index_filename = `index-${ts}-${hash}.js`;

    //
    // write our index file for bundling
    //
    let IndexTemplate = require('./bundler/templates/index.template.js');
    await fs.writeFile(path.resolve(__dirname, `../../bundler/${newappdir}/config/${index_filename}`),
      IndexTemplate(modules_config_filename)
    );


    //
    // execute bundling process
    //
    let entry = path.resolve(__dirname, `../../bundler/${newappdir}/config/${index_filename}`);
    let output_path = path.resolve(__dirname, `./bundler/dist`);

    bash_script_content += 'cd ' + __dirname + "\n";
    bash_script_content += 'cd ../../' + "\n";
    bash_script_content += `sh bundle.sh ${entry} ${output_path} ${bundle_filename}`;
    bash_script_content += "\n";
    //bash_script_content += bash_script_delete;


    fs.writeFileSync(path.resolve(__dirname, bash_script), bash_script_content, { encoding: 'binary' });
    try {
      let cwdir = __dirname;
      let bash_command = 'sh ' + bash_script;
//console.log("running bash command: " + bash_command);
//console.log(" with: " + bash_script_content);
      const { stdout, stderr } = await exec(bash_command, { cwd: cwdir, maxBuffer: 4096 * 2048 });
    } catch (err) {
      console.log(err);
    }

    //
    // create tx
    //
    let newtx = this.app.wallet.createUnsignedTransactionWithDefaultFee();
    let bundle_bin = "";
    if (fs) { bundle_bin = fs.readFileSync(path.resolve(__dirname, `./bundler/dist/${bundle_filename}`), { encoding: 'binary' }); }
    newtx.msg = { module: "AppStore", request: "add bundle", bundle: bundle_bin };
    newtx = this.app.wallet.signTransaction(newtx);
    this.app.network.propagateTransaction(newtx);



    //
    // cleanup
    //
// tmp disabled
//    await fs.rmdir(path.resolve(__dirname, `../../bundler/${newappdir}/`), function () {
//      console.log("Appstore Compilation Files Removed!");
//    });

    return bundle_filename;
  }




  receiveBundle(blk, tx) {

    if (this.app.BROWSER != 1) { return; }

    let txmsg = tx.returnMessage();

    let data = {};
    data.appstore = this;
    data.bundle_appstore_publickey = tx.transaction.from[0].add;
    data.appstore_bundle = txmsg.bundle;

    AppStoreBundleConfirm.render(this.app, data);
    AppStoreBundleConfirm.attachEvents(this.app, data);

  }




  //
  // override webserver to permit module-hosting
  //
  webServer(app, expressapp, express) {

    let fs = app.storage.returnFileSystem();
    if (fs != null) {

      expressapp.use('/' + encodeURI(this.name), express.static(__dirname + "/web"));
      expressapp.get('/appstore/bundle/:filename', async (req, res) => {

        let scriptname = req.params.filename;

        let sql = "SELECT script FROM bundles WHERE name = $scriptname";
        let params = {
          $scriptname: scriptname
        }
        let rows = await app.storage.queryDatabase(sql, params, "appstore");

        if (rows) {
          if (rows.length > 0) {

            res.setHeader('Content-type', 'text/javascript');
            res.charset = 'UTF-8';
            res.write(rows[0].script);
            res.end();

            return;
          }
        }

        res.setHeader('Content-type', 'text/javascript');
        res.charset = 'UTF-8';
        res.write('alert("Server does not contain your Saito javascript bundle...");');
        res.end();
      });
    }
  }
}
module.exports = AppStore;




//
// supporting utility functions
//
// recursively go through and find all files in dir
function getFiles(dir) {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  const files = dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  });
  return Array.prototype.concat(...files);
}
function returnSlug(nme) {
  nme = nme.toLowerCase();
  nme = nme.replace(/\t/g, "_");
  return nme;
}
function deleteDirs(dir) {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  dirents.forEach((dirent) => {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory() && fs.readdirSync(res).length == 0) {
      fs.rmdirSync(res, { maxRetries: 100, recursive: true });
    } else {
      deleteDirs(res);
      // delete after children have been
      fs.rmdirSync(res, { maxRetries: 100, recursive: true });
    }
  });
}
