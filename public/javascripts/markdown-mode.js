/* vim:ts=4:sts=4:sw=4:
 * ***** BEGIN LICENSE BLOCK *****
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
 *      Mihai Sucan <mihai DOT sucan AT gmail DOT com>
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

define('ace/mode/markdown', ['require', 'exports', 'module' , 'pilot/oop', 'ace/mode/text', 'ace/tokenizer', 'ace/mode/markdown_highlight_rules'], function(require, exports, module) {

var oop = require("pilot/oop");
var TextMode = require("ace/mode/text").Mode;
var Tokenizer = require("ace/tokenizer").Tokenizer;
var MarkdownHighlightRules = require("ace/mode/markdown_highlight_rules").MarkdownHighlightRules;

var Mode = function() {
    this.$tokenizer = new Tokenizer(new MarkdownHighlightRules().getRules());
};
oop.inherits(Mode, TextMode);

(function() {
    this.getNextLineIndent = function(state, line, tab) {
        var indent = this.$getIndent(line);
        return indent;
    };
}).call(Mode.prototype);

exports.Mode = Mode;
});

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

define('ace/mode/markdown_highlight_rules', ['require', 'exports', 'module', 'pilot/oop', 'ace/mode/text_highlight_rules' ], function(require, exports, module) {

var oop = require("pilot/oop");
var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

var trex = function (name) {
  return { token: name, regex: name };
}

var debugToken = function (show, token) {
  return function (input) {
    console.log(input, show);
    return token;
  }
}

var MarkdownHighlightRules = function() {

    // regexp must not have capturing parentheses
    // regexps are ordered -> the first match is used

    this.$rules = {
        "start" : [ {
            token : "empty_line",
            regex : '^$'
        },
        /*
           trex("constant"),
           trex("keyword"),
           trex("string.regexp"),
           trex("string"),
           trex("comment"),
           trex("invalid.illegal"),
           trex("invalid.deprecated"),
           trex("support.function"),
           trex("support"),
           trex("variable"),
           trex("xml_pe"),
           trex("url"),
        */
        { // code span `
            token : "support.function",
            regex : "`[^\\r]*?[^`]`"
        }, { // code block
            token : "support.function",
            regex : "^[ ]{4}.+"
        }, { // header
            token : "constant",
            regex : "^\#{1,6}",
            next  : "header"
        }, { // reference
            token : "text",
            regex : "^[ ]{0,3}\\[(?=[^\\]]+\\]:\\s*[^ ]+\\s*(?:[\"][^\"]+[\"])?\\s*$)",
            next  : "reference"
        }, { // link by reference
            token : "text",
            regex : "\\[(?=(?:[[^\\]]*\\]|[^\\[\\]])*\\][ ]?(?:\\n[ ]*)?\\[(?:.*?)\\])",
            next  : "linkref"
        }, { // link by url
            token : "text",
            regex : "\\[(?=(?:\\[[^\\]]*\\]|[^\\[\\]])*\\]"+
                    "\\([ \\t]*<?(?:(?:[^\\(]*?\\([^\\)]*?\\)\\S*?)|(?:.*?))>?[ \t]*"+
                    "(?:\"(?:.*?)\"[ \\t]*)?"+
                    "\\))",
            next  : "linkurl"
        }, { // HR *
            token : "constant",
            regex : "^[ ]{0,2}(?:[ ]?\\*[ ]?){3,}[ \\t]*$"
        }, { // HR -
            token : "constant",
            regex : "^[ ]{0,2}(?:[ ]?\\-[ ]?){3,}[ \\t]*$"
        }, { // HR _
            token : "constant",
            regex : "^[ ]{0,2}(?:[ ]?\\_[ ]?){3,}[ \\t]*$"
        }, { // list
            token : "support.function",
            regex : "^(?:[*+-]\\s.+)",
            next  : "listblock"
        }, { // math span
            token : "keyword",
            regex : "%%.+?%%"
        }, { // math div
            token : "keyword",
            regex : "[$]{2}.+?[$]{2}"
        }, { // strong **
            token : "string",
            regex : "[*]{2}(?=\\S)(?:[^\\r]*?\\S[*_]*)[*]{2}"
        }, { // emphasis *
            token : "string",
            regex : "[*](?=\\S)(?:[^\\r]*?\\S[*_]*)[*]"
        }, { // strong __
            token : "string",
            regex : "[_]{2}(?=\\S)(?:[^\\r]*?\\S[*_]*)[_]{2}"
        }, { // emphasis _
            token : "string",
            regex : "[_](?=\\S)(?:[^\\r]*?\\S[*_]*)[_]"
        }, {
            token : "text",
            regex : "[^\\*_%$`\\[#]+"
        } ],
        
        "listblock" : [ {
            token : "empty_line",
            regex : "^$",
            next  : "start",
        }, {
            token : "support.function",
            regex : ".+"
        } ],
        
        "linkurl" : [ {
            token : "string",
            regex : "(?:\\[[^\\]]*\\]|[^\\[\\]])+"
        }, {
            token : "text",
            regex : "\\]\\([ \\t]*<?",
            next  : "linkurl-mid"
        } ],
        "linkurl-mid" : [ {
            token : "url",
            regex : "[^\\s\\)]+"
        }, {
            token : "string",
            regex : "\\s*[\"][^\"]+[\"]",
            next  : "linkurl-end"
        }, {
            token : "text",
            regex : "\\s*\\)",
            next  : "start"
        }, {
            token : "text",
            regex : ".",
            next  : "start"
        } ],
        "linkurl-end" : [ {
            token : "text",
            regex : "\\s*\\)",
            next  : "start"
        } ],
        
        "linkref" : [ {
            token : "string",
            regex : "[^\\]]+",
            next  : "linkref-mid"
        }],
        "linkref-mid": [ {
            token : "text",
            regex : "\\][ ]?(?:\\n[ ]*)?\\["
        }, {
            token : "constant",
            regex : "[^\\]]+"
        }, {
            token : "text",
            regex : "\\]",
            next : "start"
        }],
        
        "header" : [ { // end of header
            token : "keyword",
            regex : ".+$",
            next  : "start"
        }, {
            token : "text",
            regex : ".",
            next  : "start"
        } ],
        
        "reference" : [ {
            token : "constant",
            regex : "[^\\]]+",
            next  : "reflink"
        }, {
            token : "text",
            regex : ".",
            next  : "start"
        } ],
        
        "reflink" : [ {
            token : "text",
            regex : "\\]:\\s*"
        }, {
            token : "url",
            regex : "[^ ]+$",
            next  : "start"
        }, {
            token : "url",
            regex : "[^ ]+"
        }, {
            token : "string",
            regex : "\\s*[\"][^\"]+[\"]\\s*$",
            next  : "start"
        }, {
            token : "text",
            regex : "\\s*$",
            next  : "start"
        }]
    };
};
oop.inherits(MarkdownHighlightRules, TextHighlightRules);

exports.MarkdownHighlightRules = MarkdownHighlightRules;
});