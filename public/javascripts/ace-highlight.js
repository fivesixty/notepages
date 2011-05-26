define('ace/highlight', function(require, exports, module) {

var EditSession = require("ace/edit_session").EditSession;
var TextLayer = require("ace/layer/text").Text;
var TextMode = require("ace/mode/text").Mode;
var JavaScriptMode = require("ace/mode/javascript").Mode;

function Highlight(element) {
  this.element = $(element);
  this.session = new EditSession("");
  this.session.setUseWorker(false);
  this.session.setValue(this.element.text());
  this.session.setUseWrapMode(true);
  
  this.width = this.element.width();
  
  this.highlightDiv = $("<div>")
    .addClass("acecode ace_editor " + this.twilightTheme.cssClass)
    .css({ position: "static" });
    
  this.element.append(this.highlightDiv);
  $("code", this.element).hide();
  
  this.textlayer = new TextLayer(this.highlightDiv.get(0));
  this.textlayer.setSession(this.session);
  $(this.textlayer.element).addClass("ace_scroller").css({
    width: this.width
  });
  
  this.setMode($("code", this.element).attr("class"));
  this.session.adjustWrapLimit(Math.floor(this.width / this.textlayer.getCharacterWidth()));
  
  this.update();
  
  this.element.data("highlighter", this);
}

(function () {
  
  this.textMode = new TextMode();
  this.jsMode = new JavaScriptMode();
  this.twilightTheme = require("ace/theme/twilight");
  
  this.setMode = function(mode_string) {
    if (mode_string == this.mode_string) return;
    
    this.mode_string = mode_string;
    switch (mode_string) {
      case "javascript":
        this.mode = this.jsMode;
        break;
      default:
        this.mode = this.textMode;
    }
    this.session.setMode(this.mode);
    this.update();
  }
  
  this.setValue = function(newcontent) {
    this.session.setValue(newcontent);
    this.update();
  }
  
  this.getValue = function () {
    return this.session.getValue();
  }
  
  this.rowCount = function() {
    var total = 0;
    for (var i = 0; i < this.session.getLength(); i++) {
      total += this.session.getRowLength(i);
    }
    return total;
  }
  
  this.update = function() {
    var lineHeight = this.textlayer.getLineHeight();
    var numRows = this.rowCount();
    var height = (numRows-1) * lineHeight;
    
    this.textlayer.update({
      firstRow: 0,
      lastRow: this.session.getLength(),
      lineHeight: lineHeight,
      width: this.width
    });
    
    this.highlightDiv.css({height: height});
    $(this.textlayer.element).css({height: height});
  }
  
}).call(Highlight.prototype);

exports.Highlight = Highlight;
});