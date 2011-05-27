var copy = require('dryice').copy;
var cleanCSS = require('clean-css');

var result = copy.createDataObject();

["support/ace/build/src/ace.js",
 "support/ace/build/src/theme-twilight.js",
 "support/ace/build/src/mode-javascript.js",
 "support/ace/build/src/mode-html.js",
 "support/ace/build/src/mode-xml.js",
 "support/jquery-ui-1.8.13.custom.min.js"].forEach(function (file) {
    copy({
      source: file,
      filter: [
        function (data) {
          return data + ";\n";
        }
      ],
      dest: result
    });
});

copy({
  source: ["support/jquery.event.drag-2.0.js",  
           "support/quickdiff/quickdiff.js",
           "support/sha256.js",
           "support/mdext/src/showdown.js",
           
           "src/js/markdown-mode.js",
           "src/js/ace-highlight.js",
           "src/js/notify.js",
           "src/js/universal.js",
           "src/js/editor-tools.js",
           "src/js/browser.js"],
  filter: copy.filter.uglifyjs,
  dest  : result
});

copy({
  source: result,
  dest: "public/javascripts/browser.js"
});

var result_css = copy.createDataObject();

["src/css/browser.css",
 "src/css/universal.css",
 "src/css/ace-twilight.css",
 "src/css/sprites.css"].forEach(function (css) {
    copy({
      source: css,
      filter: function (data) { return data + "\n"; },
      dest: result_css
    });
  });

copy({
  source: result_css,
  filter: cleanCSS.process,
  dest: "public/stylesheets/browser.css"
});