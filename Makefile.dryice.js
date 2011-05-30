/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *      Julian Viereck <julian.viereck@gmail.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/**
  * This file contains parts of the ACE build script, integrated into a larger build.
  **/
  
var copy = require('dryice').copy;
var cleanCSS = require('clean-css');

var aceHome = __dirname + "/support/ace";

console.log('# browser.js ---------');

var aceProject = [
    aceHome + '/support/pilot/lib',
    aceHome + '/lib'
];

var modes = [
    "css", "html", "javascript", "php", "python", "xml", "ruby", "java", "c_cpp",
    "coffee", "perl", "csharp", "svg", "clojure"
];

var themes = [
    "clouds", "clouds_midnight", "cobalt", "dawn", "idle_fingers", "kr_theme",
    "mono_industrial", "monokai", "pastel_on_dark", "twilight", "eclipse",
    "merbivore", "merbivore_soft", "vibrant_ink"
];

var project = copy.createCommonJsProject(aceProject);

function filterTextPlugin(text) {
    return text.replace(/(['"])text\!/g, "$1text/");
    /*return text
        .replace(/define\(\s*['"]text\!\)/g, "text/")
        .replace(/require\(\s*['"]text\!\)/g, "text/")*/
}

var ace = copy.createDataObject();
copy({
    source: [aceHome + '/build_support/mini_require.js'],
    dest: ace
});
copy({
    source: [
        copy.source.commonjs({
            project: project,
            require: [
                "pilot/fixoldbrowsers",
                "ace/ace"
            ].concat(modes.map(function(mode) { return "ace/mode/" + mode; }))
             .concat(themes.map(function(theme) { return "ace/theme/" + theme; }))
        })
    ],
    filter: [ copy.filter.moduleDefines ],
    dest: ace
});
copy({
    source: {
        root: project,
        include: /.*\.css$/,
        exclude: /tests?\//
    },
    filter: [ copy.filter.addDefines ],
    dest: ace
});
copy({
    source: [aceHome + '/build_support/boot.js'],
    dest: ace
});

copy({
  source: "support/jquery-ui-1.8.13.custom.min.js",
  filter: [
    function (data) {
      return ";\n" + data + ";\n";
    }
  ],
  dest: ace
});

copy({
  source: ["support/jquery.event.drag-2.0.js",  
           "support/quickdiff/quickdiff.js",
           "support/sha256.js",
           "support/mdext/src/showdown.js",
           "support/store/json.js",
           "support/store/store.js",
           
           "src/js/markdown-mode.js",
           "src/js/ace-highlight.js",
           "src/js/notify.js",
           "src/js/universal.js",
           "src/js/editor-tools.js",
           "src/js/browser.js"],
  dest  : ace
});

copy({
    source: ace,
    filter: [copy.filter.uglifyjs, filterTextPlugin],
    dest:   'public/javascripts/browser.js'
});
copy({
    source: ace,
    filter: [filterTextPlugin],
    dest:   'public/javascripts/browser-uncompressed.js'
});

console.log('# browser.css ---------');

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