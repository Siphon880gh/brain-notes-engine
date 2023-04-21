[H[2J[3J* Running: grep -nriI ./ --exclude={.git,\*.sql,package-lock.json,webpack.config.js,composer.lock,\*.chunk.css,\*.chunk.js,\*.css.map,\*.js.map} --exclude-dir={.git,.git/index,bower_components,node_modules,.sass-cache,vendor\*,\*backup\*,\*cached\*} -e "\.dat"
Eg. gr = new

* Tip: If you are searching a phrase or sentence, place the expression in quotation marks:
gr "fox jumps over fence"
* Tip: If excluding directories, prepend with forward slash /. If excluding files, do not prepend. These are additional arguments after the expression argument. There is no restriction on the number of arguments.
gr "fox jumps over fence" /cached .gitignore README.md
Btw, the cached folder and .gitignore file is automatically ignored because I know how common those are in projects.
* Tip: Go to top of results on Macs with CMC+Up, or Ctrl+Home on Windows.
* Tip: Open the file and line in Visual Code:
code -g filepath:line

.//a.js:1:[H[2J[3J* Running: grep -nriI ./ --exclude={.git,\*.sql,package-lock.json,webpack.config.js,composer.lock,\*.chunk.css,\*.chunk.js,\*.css.map,\*.js.map} --exclude-dir={.git,.git/index,bower_components,node_modules,.sass-cache,vendor\*,\*backup\*,\*cached\*} -e "\.dat"
.//prep/MySql/a.txt:82:Making moment js dates compatible with Sequelize DataTypes.DATE
.//explorer.php:141:        $saveid_globs = glob($path . "+saveid*.dat");
.//explorer.php:144:          file_put_contents($path . "+saveid" . $microtime . ".dat", "");
.//explorer.php:145:          $saveid_glob = $microtime . ".dat";
.//explorer.php:497:            <small>Open by unique Id (Id is in li[data-uid] or folder contents): scrollToUniqueId("unique....dat"):</small><br/>
.//explorer.php:498:            <input type="text" id="by-uid" value="saveid1562162987.2096.dat">
.//explorer.php:504:              The story is about a man who started understanding the concept of <a href="javascript:void(0)" onclick='scrollToUniqueId("saveid1562162987.2094.dat");'>number 1</a>.
.//curriculum/a.js:1:[H[2J[3J* Running: grep -nriI ./ --exclude={.git,\*.sql,package-lock.json,webpack.config.js,composer.lock,\*.chunk.css,\*.chunk.js,\*.css.map,\*.js.map} --exclude-dir={.git,.git/index,bower_components,node_modules,.sass-cache,vendor\*,\*backup\*,\*cached\*} -e "\.dat"
.//curriculum/a.js:13:.//a.js:1:[H[2J[3J* Running: grep -nriI ./ --exclude={.git,\*.sql,package-lock.json,webpack.config.js,composer.lock,\*.chunk.css,\*.chunk.js,\*.css.map,\*.js.map} --exclude-dir={.git,.git/index,bower_components,node_modules,.sass-cache,vendor\*,\*backup\*,\*cached\*} -e "\.dat"
.//curriculum/a.js:14:.//languages-newer/node - databases/SQL databases (MySQL2, SQLite3, Sequelize)/ORM - Sequelize/Models/Init/Model Config Object - Timestamp/meta.md:11:        createdAt: Sequelize.DATE,
.//curriculum/a.js:15:.//languages-newer/node - databases/SQL databases (MySQL2, SQLite3, Sequelize)/ORM - Sequelize/Models/Init/Model Config Object - Timestamp/meta.md:12:        updatedAt: Sequelize.DATE,
.//curriculum/a.js:16:.//languages-newer/node - databases/SQL databases (MySQL2, SQLite3, Sequelize)/Dialects - SQLite3, MySQL/SQLite3 Node Module/meta.md:12:const db = new sqlite3.Database("./db/election.db", err => {
.//curriculum/a.js:17:.//languages-newer/node - databases/SQL databases (MySQL2, SQLite3, Sequelize)/Dialects - SQLite3, MySQL/SQLite3 Shell - Fundamental - Commands/meta.md:3:.databases
.//curriculum/a.js:18:.//languages-newer/node - databases/SQL databases (MySQL2, SQLite3, Sequelize)/Dialects - SQLite3, MySQL/SQLite3 Shell - Fundamental - Commands/meta.md:21:.database
.//curriculum/a.js:19:.//languages-newer/node - databases/SQL databases (MySQL2, SQLite3, Sequelize)/Dialects - SQLite3, MySQL/Best Practice - Workflow - Shell before Node Module/meta.md:25:.database
.//curriculum/languages-newer/node - databases/SQL databases (MySQL2, SQLite3, Sequelize)/ORM - Sequelize/Models/Init/Model Config Object - Timestamp/meta.md:11:        createdAt: Sequelize.DATE,
.//curriculum/languages-newer/node - databases/SQL databases (MySQL2, SQLite3, Sequelize)/ORM - Sequelize/Models/Init/Model Config Object - Timestamp/meta.md:12:        updatedAt: Sequelize.DATE,
.//curriculum/languages-newer/node - databases/SQL databases (MySQL2, SQLite3, Sequelize)/Dialects - SQLite3, MySQL/SQLite3 Node Module/meta.md:12:const db = new sqlite3.Database("./db/election.db", err => {
.//curriculum/languages-newer/node - databases/SQL databases (MySQL2, SQLite3, Sequelize)/Dialects - SQLite3, MySQL/SQLite3 Shell - Fundamental - Commands/meta.md:3:.databases
.//curriculum/languages-newer/node - databases/SQL databases (MySQL2, SQLite3, Sequelize)/Dialects - SQLite3, MySQL/SQLite3 Shell - Fundamental - Commands/meta.md:21:.database
.//curriculum/languages-newer/node - databases/SQL databases (MySQL2, SQLite3, Sequelize)/Dialects - SQLite3, MySQL/Best Practice - Workflow - Shell before Node Module/meta.md:25:.database
.//assets-explorer/js/multistates.js:10:            $el = $el.find(".data-wrapper").first();
.//assets-explorer/js/multistates.js:33:            $el = $el.find(".data-wrapper").first();
.//assets-explorer/js/multistates.js:103:                  $data = $p.closest(".data-wrapper");
.//assets-explorer/js/multistates.js:187:                    $data = $p.closest(".data-wrapper");
.//assets-explorer/js/jquery.highlight.js:49:            var match = node.data.match(re);
.//assets-explorer/js/app.js:228:      $meta.data("gotos", gotos);
.//assets-explorer/js/app.js:307:              multistates: $(el).find(".multistates .data-wrapper").attr("data-states")} 
.//assets-explorer/js/app.js:348:          $thermo.find(".fas").eq(dat.data.thermo).addClass("active");
.//assets-explorer/js/app.js:349:          console.log(`dat.data.thermo:` + dat.data.thermo);
.//assets-explorer/js/app.js:352:          var states = dat.data.multistates;
.//assets-explorer/js/app.js:353:          var $states = $row.find(">.contain .data-wrapper");
.//assets-explorer/js/app.js:539:        if ($el.data('toggle') !== 'tooltip' && $el.closest(".tooltip").length === 0) {
.//assets/js/multistates.js:10:            $el = $el.find(".data-wrapper").first();
.//assets/js/multistates.js:33:            $el = $el.find(".data-wrapper").first();
.//assets/js/multistates.js:103:                  $data = $p.closest(".data-wrapper");
.//assets/js/multistates.js:187:                    $data = $p.closest(".data-wrapper");
.//assets/js/app-snippets.js:254:            $meta.data("gotos", gotos);
.//assets/js/app-snippets.js:440:            if ($el?.data('toggle') !== 'tooltip' && $el.closest(".tooltip").length === 0) {
.//assets/js/app.js:522:            // var correctPos = ui.item.data("correct-order");
.//assets/js/app.js:534:                var correctPos = $listItem.data("correct-order");
