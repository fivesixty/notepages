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
 *      Chris Spencer <chris.ag.spencer AT googlemail DOT com>
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

define('ace/mode/markdown', function(require, exports, module) {

var oop = require("pilot/oop");
var TextMode = require("ace/mode/text").Mode;
var JavaScriptMode = require("ace/mode/javascript").Mode;
var XmlMode = require("ace/mode/xml").Mode;
var HtmlMode = require("ace/mode/html").Mode;
var Tokenizer = require("ace/tokenizer").Tokenizer;
var MarkdownHighlightRules = require("ace/mode/markdown_highlight_rules").MarkdownHighlightRules;
var Range = require("ace/range").Range;

var Mode = function() {
    var highlighter = new MarkdownHighlightRules();
    
    this.$tokenizer = new Tokenizer(highlighter.getRules());
    this.$embeds = highlighter.getEmbeds();
    this.createModeDelegates({
      "js-": JavaScriptMode,
      "xml-": XmlMode,
      "html-": HtmlMode
    });
    
    /*
    this.addBehaviour("codespan", function (state, editor, session, text) {
        if (text == '`') {
            var selection = editor.getSelectionRange();
            var selected = session.doc.getTextRange(selection);
            if (selected !== "") {
                return {
                    text: '`' + selected + '`',
                    selection: false
                }
            } else {
                return {
                    text: '``',
                    selection: [1,1]
                }
            }
        }
        return false;
    }, function (state, editor, session, range) {
        var selected = session.doc.getTextRange(range);
        if (!range.isMultiLine() && selected == '`') {
            var rightChar = session.doc.getLine(range.start.row).substring(range.start.column+1, range.start.column+2);
            if (rightChar == '`') {
                return new Range(range.start.row, range.start.column, range.start.row, range.end.column+1);
            }
        }
        return false;
    });*/
};
oop.inherits(Mode, TextMode);

(function() {
    this.getNextLineIndent = function(state, line, tab) {
        if (state == "listblock") {
            var match = /^((?:.+)?)([-+*][ ]+)/.exec(line);
            if (match) {
                return new Array(match[1].length + 1).join(" ") + match[2];
            } else {
                return "";
            }
        } else {
            return this.$getIndent(line);
        }
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
 *      Chris Spencer <chris.ag.spencer AT googlemail DOT com>
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

define('ace/mode/markdown_highlight_rules', function(require, exports, module) {

var oop = require("pilot/oop");
var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;
var JavaScriptHighlightRules = require("ace/mode/javascript_highlight_rules").JavaScriptHighlightRules;
var XmlHighlightRules = require("ace/mode/xml_highlight_rules").XmlHighlightRules;
var HtmlHighlightRules = require("ace/mode/html_highlight_rules").HtmlHighlightRules;
var TexHighlightRules = require("ace/mode/tex_highlight_rules").TexHighlightRules;

function github_embed(tag, prefix) {
  return { // Github style block
    token : "invalid.illegal.deprecated", // Pick something really obvious
    regex : "^```" + tag + "\\s*$",
    next  : prefix + "start"
  }
}

var MarkdownHighlightRules = function() {

    // regexp must not have capturing parentheses
    // regexps are ordered -> the first match is used

    this.$rules = {
        "start" : [ {
            token : "empty_line",
            regex : '^$'
        }, { // code span `
            token : "support.function",
            regex : "(`+)([^\\r]*?[^`])(\\1)"
        }, { // code block
            token : "support.function",
            regex : "^[ ]{4}.+"
        }, github_embed("javascript", "js-"),
           github_embed("xml", "xml-"),
           github_embed("html", "html-"),
        { // Github style block
            token : "support.function",
            regex : "^```[a-zA-Z]+\\s*$",
            next  : "githubblock"
        }, { // block quote
            token : "string",
            regex : "^>[ ].+$",
            next  : "blockquote"
        }, { // header
            token : ["constant", "keyword"],
            regex : "^(#{1,6})(.+)$"
        }, { // reference
            token : ["text", "constant", "text", "url", "string", "text"],
            regex : "^([ ]{0,3}\\[)([^\\]]+)(\\]:\\s*)([^ ]+)(\\s*(?:[\"][^\"]+[\"])?\\s*)$"
        }, { // link by reference
            token : ["text", "string", "text", "constant", "text"],
            regex : "(\\[)((?:[[^\\]]*\\]|[^\\[\\]])*)(\\][ ]?(?:\\n[ ]*)?\\[)(.*?)(\\])"
        }, { // link by url
            token : ["text", "string", "text", "url", "string", "text"],
            regex : "(\\[)"+
                    "(\\[[^\\]]*\\]|[^\\[\\]]*)"+
                    "(\\]\\([ \\t]*)"+
                    "(<?(?:(?:[^\\(]*?\\([^\\)]*?\\)\\S*?)|(?:.*?))>?)"+
                    "((?:[ \t]*\"(?:.*?)\"[ \\t]*)?)"+
                    "(\\))"
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
            token : "constant",
            regex : "%%(?=.+?%%)",
            next  : "texi-start"
        }, { // math div
            token : "constant",
            regex : "[$]{2}(?=.+?[$]{2})",
            next  : "tex-start"
        }, { // strong ** __
            token : "string",
            regex : "([*]{2}|[_]{2}(?=\\S))([^\\r]*?\\S[*_]*)(\\1)"
        }, { // emphasis * _
            token : "string",
            regex : "([*]|[_](?=\\S))([^\\r]*?\\S[*_]*)(\\1)"
        }, { // 
            token : ["text", "url", "text"],
            regex : "(<)("+
                      "(?:https?|ftp|dict):[^'\">\\s]+"+
                      "|"+
                      "(?:mailto:)?[-.\\w]+\\@[-a-z0-9]+(?:\\.[-a-z0-9]+)*\\.[a-z]+"+
                    ")(>)"
        }, {
            token : "text",
            regex : "[^\\*_%$`\\[#<>]+"
        } ],
        
        "listblock" : [ { // Lists only escape on completely blank lines.
            token : "empty_line",
            regex : "^$",
            next  : "start"
        }, {
            token : "support.function",
            regex : ".+"
        } ],
        
        "blockquote" : [ { // BLockquotes only escape on blank lines.
            token : "empty_line",
            regex : "^\\s*$",
            next  : "start"
        }, {
            token : "string",
            regex : ".+"
        } ],
        
        "githubblock" : [ {
            token : "support.function",
            regex : "^```",
            next  : "start"
        }, {
            token : "support.function",
            regex : ".+"
        } ]
    };
    
    this.embedRules(JavaScriptHighlightRules, "js-", [{
       token : "invalid.illegal.deprecated", // Pick something really obvious
       regex : "^```",
       next  : "start"
    }]);
    
    this.embedRules(HtmlHighlightRules, "html-", [{
       token : "invalid.illegal.deprecated", // Pick something really obvious
       regex : "^```",
       next  : "start"
    }]);
    
    this.embedRules(XmlHighlightRules, "xml-", [{
       token : "invalid.illegal.deprecated", // Pick something really obvious
       regex : "^```",
       next  : "start"
    }]);
    
    this.embedRules(TexHighlightRules, "tex-", [{
        token : "constant",
        regex : "\\$\\$",
        next  : "start"
    }]);
    
    this.embedRules(TexHighlightRules, "texi-", [{
        token : "constant",
        regex : "%%",
        next  : "start"
    }]);
};
oop.inherits(MarkdownHighlightRules, TextHighlightRules);

exports.MarkdownHighlightRules = MarkdownHighlightRules;
});

define("ace/mode/tex_highlight_rules", function (require, exports, module) {

var oop = require("pilot/oop");
var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

var commands = "above|abovewithdelims|acute|aleph|alpha|amalg|And|angle|approx|approxeq|arccos|arcsin|arctan|arg|array|Arrowvert|arrowvert|ast|asymp|atop|atopwithdelims|backepsilon|backprime|backsim|backsimeq|backslash|backslash|bar|barwedge|Bbb|Bbbk|because|begin|beta|beth|between|bf|Big|big|bigcap|bigcirc|bigcup|Bigg|bigg|Biggl|biggl|Biggm|biggm|Biggr|biggr|Bigl|bigl|Bigm|bigm|bigodot|bigoplus|bigotimes|Bigr|bigr|bigsqcup|bigstar|bigtriangledown|bigtriangleup|biguplus|bigvee|bigwedge|binom|blacklozenge|blacksquare|blacktriangle|blacktriangledown|blacktriangleleft|blacktriangleright|bmod|boldsymbol|bot|bowtie|Box|boxdot|boxed|boxminus|boxplus|boxtimes|brace|bracevert|brack|breve|buildrel|bullet|Bumpeq|bumpeq|cal|cap|Cap|cases|cdot|cdotp|cdots|centerdot|cfrac|check|checkmark|chi|choose|circ|circeq|circlearrowleft|circlearrowright|circledast|circledcirc|circleddash|circledR|circledS|class|clubsuit|colon|color|complement|cong|coprod|cos|cosh|cot|coth|cr|csc|cssId|cup|Cup|curlyeqprec|curlyeqsucc|curlyvee|curlywedge|curvearrowleft|curvearrowright|dagger|daleth|dashleftarrow|dashrightarrow|dashv|dbinom|ddagger|ddddot|dddot|ddot|ddots|DeclareMathOperator|def|deg|Delta|delta|det|dfrac|diagdown|diagup|diamond|Diamond|diamondsuit|digamma|dim|displaylines|displaystyle|div|divideontimes|dot|doteq|Doteq|doteqdot|dotplus|dots|dotsb|dotsc|dotsi|dotsm|dotso|doublebarwedge|doublecap|doublecup|Downarrow|downarrow|downdownarrows|downharpoonleft|downharpoonright|ell|emptyset|end|enspace|epsilon|eqalign|eqalignno|eqcirc|eqsim|eqslantgtr|eqslantless|equiv|eta|eth|exists|exp|fallingdotseq|fbox|Finv|flat|forall|frac|frac|frak|frown|Game|Gamma|gamma|gcd|ge|genfrac|geq|geqq|geqslant|gets|gg|ggg|gggtr|gimel|gnapprox|gneq|gneqq|gnsim|grave|gt|gt|gtrapprox|gtrdot|gtreqless|gtreqqless|gtrless|gtrsim|gvertneqq|hat|hbar|hbox|hdashline|heartsuit|hline|hom|hookleftarrow|hookrightarrow|hphantom|href|hskip|hslash|hspace|Huge|huge|idotsint|iff|iiiint|iiint|iint|Im|imath|impliedby|implies|in|inf|infty|injlim|int|intercal|intop|iota|it|jmath|Join|kappa|ker|kern|Lambda|lambda|land|langle|LARGE|Large|large|LaTeX|lbrace|lbrack|lceil|ldotp|ldots|le|leadsto|left|Leftarrow|leftarrow|leftarrowtail|leftharpoondown|leftharpoonup|leftleftarrows|Leftrightarrow|leftrightarrow|leftrightarrows|leftrightharpoons|leftrightsquigarrow|leftroot|leftthreetimes|leq|leqalignno|leqq|leqslant|lessapprox|lessdot|lesseqgtr|lesseqqgtr|lessgtr|lesssim|lfloor|lg|lgroup|lhd|lim|liminf|limits|limsup|ll|llap|llcorner|Lleftarrow|lll|llless|lmoustache|ln|lnapprox|lneq|lneqq|lnot|lnsim|log|Longleftarrow|longleftarrow|Longleftrightarrow|longleftrightarrow|longmapsto|Longrightarrow|longrightarrow|looparrowleft|looparrowright|lor|lower|lozenge|lrcorner|Lsh|lt|lt|ltimes|lVert|lvert|lvertneqq|maltese|mapsto|mathbb|mathbf|mathbin|mathcal|mathchoice|mathclose|mathfrak|mathinner|mathit|mathop|mathopen|mathord|mathpunct|mathrel|mathring|mathrm|mathscr|mathsf|mathstrut|mathtt|matrix|max|mbox|measuredangle|mho|mid|min|mit|mkern|mod|models|moveleft|moveright|mp|mskip|mspace|mu|multimap|nabla|natural|ncong|ne|nearrow|neg|negmedspace|negthickspace|negthinspace|neq|newcommand|newenvironment|newline|nexists|ngeq|ngeqq|ngeqslant|ngtr|ni|nLeftarrow|nleftarrow|nLeftrightarrow|nleftrightarrow|nleq|nleqq|nleqslant|nless|nmid|nobreakspace|nolimits|normalsize|not|notag|notin|nparallel|nprec|npreceq|nRightarrow|nrightarrow|nshortmid|nshortparallel|nsim|nsubseteq|nsubseteqq|nsucc|nsucceq|nsupseteq|nsupseteqq|ntriangleleft|ntrianglelefteq|ntriangleright|ntrianglerighteq|nu|nVDash|nVdash|nvDash|nvdash|nwarrow|odot|oint|oldstyle|Omega|omega|omicron|ominus|operatorname|oplus|oslash|otimes|over|overbrace|overleftarrow|overleftrightarrow|overline|overrightarrow|overset|overwithdelims|owns|parallel|partial|perp|phantom|Phi|phi|Pi|pi|pitchfork|pm|pmatrix|pmb|pmod|pod|Pr|prec|precapprox|preccurlyeq|preceq|precnapprox|precneqq|precnsim|precsim|prime|prod|projlim|propto|Psi|psi|qquad|quad|raise|rangle|rbrace|rbrack|rceil|Re|renewcommand|require|restriction|rfloor|rgroup|rhd|rho|right|Rightarrow|rightarrow|rightarrowtail|rightharpoondown|rightharpoonup|rightleftarrows|rightleftharpoons|rightleftharpoons|rightrightarrows|rightsquigarrow|rightthreetimes|risingdotseq|rlap|rm|rmoustache|root|Rrightarrow|Rsh|rtimes|Rule|rVert|rvert|S|scr|scriptscriptstyle|scriptsize|scriptstyle|searrow|sec|setminus|sf|sharp|shortmid|shortparallel|shoveleft|shoveright|sideset|Sigma|sigma|sim|simeq|sin|sinh|skew|small|smallfrown|smallint|smallsetminus|smallsmile|smash|smile|Space|space|spadesuit|sphericalangle|sqcap|sqcup|sqrt|sqsubset|sqsubseteq|sqsupset|sqsupseteq|square|stackrel|star|strut|style|subset|Subset|subseteq|subseteqq|subsetneq|subsetneqq|substack|succ|succapprox|succcurlyeq|succeq|succnapprox|succneqq|succnsim|succsim|sum|sup|supset|Supset|supseteq|supseteqq|supsetneq|supsetneqq|surd|swarrow|tag|tan|tanh|tau|tbinom|TeX|text|textbf|textit|textrm|textstyle|tfrac|therefore|Theta|theta|thickapprox|thicksim|thinspace|tilde|times|tiny|Tiny|to|top|triangle|triangledown|triangleleft|trianglelefteq|triangleq|triangleright|trianglerighteq|tt|twoheadleftarrow|twoheadrightarrow|ulcorner|underbrace|underleftarrow|underleftrightarrow|underline|underrightarrow|underset|unicode|unlhd|unrhd|Uparrow|uparrow|Updownarrow|updownarrow|upharpoonleft|upharpoonright|uplus|uproot|Upsilon|upsilon|upuparrows|urcorner|varDelta|varepsilon|varGamma|varinjlim|varkappa|varLambda|varliminf|varlimsup|varnothing|varOmega|varphi|varPhi|varpi|varPi|varprojlim|varpropto|varPsi|varrho|varsigma|varSigma|varsubsetneq|varsubsetneqq|varsupsetneq|varsupsetneqq|vartheta|varTheta|vartriangle|vartriangleleft|vartriangleright|varUpsilon|varXi|vcenter|vdash|Vdash|vDash|vdots|vec|vee|veebar|verb|Vert|vert|vphantom|Vvdash|wedge|widehat|widetilde|wp|wr|Xi|xi|xleftarrow|xrightarrow|yen|zeta";

function TexHighlightRules () {
    this.$rules = {
        start: [ {
            token : "keyword",
            regex : "\\\\(?:" + commands + ")(?![a-zA-Z])"
        }, {
            token : "text",
            regex : "[#%&^_{}~]"
        }, {
            token : "variable",
            regex : "\\s*[a-zA-Z](?![a-zA-Z])"
        }, {
            token : "constant",
            regex : "[0-9\\.]+"
        }, {
            token : "text",
            regex : "[^#%&$^_{}~\\\\()=\\\\,+-]+"
        } ]
    }
}
oop.inherits(TexHighlightRules, TextHighlightRules);

exports.TexHighlightRules = TexHighlightRules;
});