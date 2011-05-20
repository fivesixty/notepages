var Range = require("ace/range").Range;

function EditorTools (editor, panel, docroot) {
  this.editor = editor;
  this.panel = panel;
  this.utils.editor = this.editor;
  this.docroot = docroot;
}

EditorTools.prototype = {}

EditorTools.prototype.utils = {
  editor: undefined,
  session: undefined,
  selection: undefined,
  replaceAndSelect: function(newtext) {
    this.session.replace(this.selection, newtext);
    this.editor.selection.setSelectionRange(
      new Range(this.selection.start.row, this.selection.start.column,
                this.selection.start.row, this.selection.start.column + newtext.length));
  },
  replaceAndSelectLine: function(newline) {
    this.session.replace(
      new Range(this.selection.start.row, 0,
                this.selection.start.row, this.currentLine().length),
      newline);
    this.editor.selection.setSelectionRange(
      new Range(this.selection.start.row, 0,
                this.selection.start.row, newline.length));
  },
  currentLine: function () {
    return this.session.getLine(this.selection.start.row);
  },
  offsetCursor: function (offset) {
    this.editor.moveCursorTo(this.selection.start.row, this.selection.start.column+offset);
  },
  joinReplaceAndSelect: function (arr, selectedIndex) {
    var sum_length = 0, joined = "", to_select;
    for (var i = 0, len = arr.length; i < len; i++) {
      if (i != selectedIndex) {
        sum_length += arr[i].length;
      } else {
        to_select = new Range(this.selection.start.row, this.selection.start.column + sum_length,
                              this.selection.start.row, this.selection.start.column + sum_length + arr[i].length);
      }
      joined += arr[i];
    }
    this.session.replace(this.selection, joined);
    this.editor.selection.setSelectionRange(to_select);
  },
  replaceAndOffset: function (newtext, offset) {
    this.session.replace(this.selection, newtext);
    if (offset >= 0) {
      this.editor.selection.setSelectionRange(
        new Range(this.selection.start.row, this.selection.start.column + offset,
                  this.selection.start.row, this.selection.start.column + offset));
    } else {
      this.editor.selection.setSelectionRange(
        new Range(this.selection.start.row, this.selection.start.column + newtext.length + offset,
                  this.selection.start.row, this.selection.start.column + newtext.length + offset));
    }
  },
  forSelectedLines: function (callback) {
    var lines = this.session.getLines(this.selection.start.row, this.selection.end.row);
    var start_row = this.selection.start.row;
    $.each(lines, function (i, line) {
      callback(start_row + i, line);
    });
  },
  selectedLineRange: function () {
    return new Range(this.selection.start.row, 0, this.selection.end.row, this.session.getLine(this.selection.end.row).length);
  },
  selectRange: function (range) {
    this.editor.selection.setSelectionRange(range);
  },
  repeatString: function (str, n) {
    return new Array(n + 1).join(str);
  }
}

EditorTools.prototype.callback = function (callback) {
  var tools = this;
  return function () {
    tools.utils.session = tools.editor.getSession();
    tools.utils.selection = tools.editor.getSelectionRange();
    tools.utils.selected = tools.utils.session.doc.getTextRange(tools.utils.selection);
    tools.utils.multiline = tools.utils.selection.start.row !== tools.utils.selection.end.row;
    callback(tools.utils);
    tools.editor.focus();
  }
}

EditorTools.prototype.addButton = function (path, callback, float) {
  var element = $('<img src="' + this.docroot + path + '">').click(this.callback(callback));
  if (float) {
    element.css({float:"right"});
  }
  this.panel.append(element);
}

// Markdown

function MarkdownTools (editor, panel, docroot) {
  var tools = new EditorTools(editor, panel, docroot);
  
  tools.addButton("edit-heading.png",
    function (u) {
      var line = u.currentLine(),
        match = /^(#*)\s*(.*)$/.exec(line),
        newline;
      
      if ((match[1] === undefined) || (match[1].length === 0)) {
        newline = "# " + match[2];
      } else if (match[1].length < 6) {
        newline = match[1] + "# " + match[2];
      } else {
        newline = match[2];
      }
      
      u.replaceAndSelectLine(newline);
    });
    
  tools.addButton('edit-bold.png',
    function (u) {
      if (u.multiline) return;
      
      var newtext, match;

      if (u.selected) {
        match = /^[*]{2}(.+?)[*]{2}$/.exec(u.selected);
        if (match) {
          u.replaceAndSelect(match[1]);
        } else {
          u.replaceAndSelect("**" + u.selected + "**");
        }
      } else {
        u.editor.insert("****");
        u.offsetCursor(2);
      }
    });
    
  tools.addButton('edit-italic.png',
    function (u) {
      if (u.multiline) return;

      var newtext, match;
      if (u.selected) {
        match = /^[*](.+?)[*]$/.exec(u.selected);
        if (match && (!/^[*]{2}([^*].*?)[*]{2}$/.test(u.selected) ||
                      !/^[*]{2}(.*?[^*])[*]{2}$/.test(u.selected))) {
          u.replaceAndSelect(match[1]);
        } else {
          u.replaceAndSelect("*" + u.selected + "*");
        }
      } else {
        u.editor.insert("**");
        u.offsetCursor(1);
      }
    });
    
  tools.addButton('chain.png',
    function (u) {
      if (u.multiline) return;

      if (u.selected) {
        u.replaceAndOffset("[" + u.selected + "]()", -1);
      } else {
        u.editor.insert("[]()");
        u.offsetCursor(1);
      }
    });
    
  tools.addButton('edit-list.png',
    function (u) {
      u.forSelectedLines(function (row, line) {
        replaceRange = new Range(row, 0, row, line.length);
        u.session.replace(replaceRange, "*   " + line);
      });
      u.selectRange(u.selectedLineRange());
    });
  
  tools.addButton('edit-list-order.png',
    function (u) {
      marker = 1;
      u.forSelectedLines(function (row, line) {
        replaceRange = new Range(row, 0, row, line.length);
        var markerText = marker + ".";
        u.session.replace(replaceRange, markerText + u.repeatString(" ", 4-markerText.length) + line);
        marker++;
      });
      u.selectRange(u.selectedLineRange());
    });
    
  tools.addButton('edit-indent.png',
    function (u) {
      
    });
      
  tools.addButton('edit-outdent.png',
    function (u) {
      
    });
  
  tools.addButton('edit-image.png',
    function (u) {
      if (u.multiline) return;

      if (u.selected) {
        u.joinReplaceAndSelect(["!<[alt](", u.selected, " \"", "title", "\")"], 3);
      } else {
        u.joinReplaceAndSelect(["!<[alt](", "url", " \"title\")"], 1);
      }
    });
    
  tools.addButton('edit-image-center.png',
    function (u) {
      if (u.multiline) return;

      if (u.selected) {
        u.joinReplaceAndSelect(["![alt](", u.selected, " \"", "title", "\")"], 3);
      } else {
        u.joinReplaceAndSelect(["![alt](", "url", " \"title\")"], 1);
      }
    });
    
  tools.addButton('edit-image-right.png',
    function (u) {
      if (u.multiline) return;

      if (u.selected) {
        u.joinReplaceAndSelect(["!>[alt](", u.selected, " \"", "title", "\")"], 3);
      } else {
        u.joinReplaceAndSelect(["!>[alt](", "url", " \"title\")"], 1);
      }
    });
    
  tools.addButton('edit-rule.png',
    function (u) {
      u.replaceAndSelect("\n---\n");
    });
    
  tools.addButton('edit-quotation.png',
    function (u) {
      if (u.multiline) return;
      
      var line = u.currentLine(),
        match = /^(\>?)\s*(.*)$/.exec(line),
        newline;

      if (/^\s*$/.test(line)) {
        newline = "> \n"
        u.session.replace(u.selectedLineRange(), newline);
        u.selectRange(new Range(u.selection.start.row, 2, u.selection.start.row, 2));
      } else {
        if (match[1]) {
          newline = match[2];
        } else {
          newline = "> " + match[2];
        }

        u.replaceAndSelectLine(newline);
      }
    });
    
  tools.addButton('edit-code.png',
    function (u) {
      var selected, match, newtext, longest, line, replaceRange;

      if (u.multiline) {
        var min_indent = 40000;
        u.forSelectedLines(function (i, row) {
          match = /^[ ]*/.exec(row);
          if (match[0].length < min_indent) {
            min_indent = match[0].length;
          }
        });
        
        u.forSelectedLines(function (i, row) {
          if (min_indent > 3) {
            replaceRange = new Range(i, 0, i, min_indent);
            u.session.replace(replaceRange, "");
          } else {
            replaceRange = new Range(i, 0, i, 0);
            u.session.replace(replaceRange, new Array(5 - min_indent).join(" "));
          }
        });

        u.selectRange(u.selectedLineRange());

      } else {
        selected = u.selected;
        line = u.currentLine();
        if (selected === "") {
          if (/^\s*$/.test(line)) {
            newtext = "    ";
            u.session.replace(u.selectedLineRange(), newtext);
            u.selectRange(new Range(u.selection.start.row, 4, u.selection.start.row, 4));
          } else {
            u.editor.insert("``");
            u.offsetCursor(1);
          }
        } else {
          match = /^(`+)(.+?)\1$/.exec(selected);
          if (match) {
            newtext = match[2];
          } else {
            match = selected.match(/`+/g);
            longest = "";
            if (match) {
              $.each(match, function (i, match) {
                if (match.length > longest.length) {
                  longest = match;
                }
              });
            }
            newtext = "`" + longest + selected + longest + "`";
          }
          u.replaceAndSelect(newtext);
        }
      }
    });
    
  tools.addButton('edit-mathematics.png',
    function (u) {
      if (u.selection.start.row !== u.selection.end.row) {
        return;
      }
      var line = u.currentLine(), match;

      if (line === u.selected) {
        match = /^[$]{2}(.*?)[$]{2}$/.exec(u.selected);
        if (match) {
          newline = match[1];
        } else {
          newline = "$$" + u.selected + "$$";
        }
        u.replaceAndSelectLine(newline);
      } else if (/^\s*$/.test(line)) {
        newline = "$$$$\n"
        u.session.replace(u.selectedLineRange(), newline);
        u.selectRange(new Range(u.selection.start.row, 2, u.selection.start.row, 2));
      } else if (u.selected) {
        match = /^[%]{2}(.*?)[%]{2}$/.exec(u.selected);
        if (match) {
          newtext = match[1];
        } else {
          newtext = "%%" + u.selected + "%%";
        }
        u.replaceAndSelect(newtext);
      } else {
        u.editor.insert("%%%%");
        u.offsetCursor(2);
      }
    });
    
  tools.addButton('edit-size-up.png',
    function (u) {
      $("#ace").css("font-size", parseInt($("#ace").css("font-size"),10) + 2);
    }, true);
    
  tools.addButton('edit-size-down.png',
    function (u) {
      $("#ace").css("font-size", parseInt($("#ace").css("font-size"),10) - 2);
    }, true);
    
  return tools;
}