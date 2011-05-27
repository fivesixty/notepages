var copy = require('dryice').copy;

var result = copy.createDataObject();

["public/lib/ace/build/src/ace.js",
 "public/lib/ace/build/src/theme-twilight.js",
 "public/lib/ace/build/src/mode-javascript.js",
 "public/lib/ace/build/src/mode-html.js",
 "public/lib/ace/build/src/mode-xml.js"].forEach(function (file) {
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
  source: ["public/lib/jquery.event.drag-2.0.js",
           "public/javascripts/markdown-mode.js",
           "public/javascripts/ace-highlight.js",
           "public/javascripts/notify.js",
           "public/lib/quickdiff/quickdiff.js",
           "public/lib/sha256.js",

           "public/lib/mdext/src/showdown.js",
           "public/javascripts/universal.js",
           "public/javascripts/editor-tools.js",
           "public/javascripts/browser.js"],
  filter: copy.filter.uglifyjs,
  dest  : result
});

copy({
  source: result,
  dest: "public/javascripts/build.js"
});

var result_css = copy.createDataObject();

["public/stylesheets/browser.css",
 "public/stylesheets/universal.css",
 "public/stylesheets/ace-twilight.css"].forEach(function (css) {
    copy({
      source: css,
      filter: function (data) { return data + "\n"; },
      dest: result_css
    });
  });

copy({
  source: result_css,
  dest: "public/stylesheets/build.css"
});