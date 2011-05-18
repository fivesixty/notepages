$(document).ready(function () {
  
  // Notification script
  
  var notify = $("#notify");
  notify.timer = undefined;
  notify.cancel = undefined;
  
  notify.setFade = function (delay) {
    notify.timer = setTimeout(function () {
      notify.hide("slide", {direction:"up"});
      notify.timer = undefined;
    }, delay)
  }
  
  notify.display = function (cssclass, contents, on_display) {
    notify.conceal().empty().removeClass()
      .addClass(cssclass).css({right:$("#toolpanel").width()/2 - 200});
    $.each(contents, function (i, el) {
      notify.append(el);
    });
    
    if (notify.is(":visible")) {
      notify.stop(true, true).show();
      if (notify.timer) {
        clearTimeout(notify.timer);
      }
      if (on_display) {
        on_display();
      }
    } else {
      notify.show("slide", {direction:"up"}, function () {
        if (on_display) {
          on_display();
        }
      });
    }
  }
  
  notify.conceal = function () {
    if (notify.cancel) {
      notify.cancel();
      notify.cancel = undefined;
    }
    return this;
  }

  notify.setMessage = function (text, icon) {
    notify.display(icon, $("<span class=\"message\"></span>").text(text), function () {
      notify.setFade(1500);
    });
  }
  
  notify.confirm = function (text, confirm_cb, cancel_cb) {
    var confirm = $('<input type="submit" value="continue"></input>')
        .click(function (e) {
          e.preventDefault();
          notify.hide();
          if (confirm_cb) {
            confirm_cb();
          }
        }),
      cancel = $('<input type="button" value="cancel"></input>')
        .click(function () {
          notify.setFade(0);
          if (cancel_cb) {
            cancel_cb();
          }
        }),
      form = $('<form>').append(cancel).append(confirm),
      buttons = $('<span class="buttons"></span>').append(form),
      content = $("<span class=\"confirm\"></span>")
        .text(text);
    
    notify.display("help", [content, buttons], function () {
      confirm.focus();
    });
    confirm.focus();
    
    notify.cancel = function () {
      if (cancel_cb) {
        cancel_cb();
      }
    }
  }
  
  notify.password = function (text, password_cb) {
    var passbox = $('<input type="password"></input>'),
      confirm = $('<input type="submit" value="continue"></input>')
        .click(function (e) {
          e.preventDefault();
          if (confirm) {
            password_cb(passbox.val());
            notify.setFade(0);
          }
        }),
      cancel = $('<input type="button" value="cancel"></input>')
        .click(function () {
          notify.setFade(0);
        }),
      form = $('<form>').append(passbox).append(cancel).append(confirm),
      buttons = $('<span class="buttons"></span>').append(form),
      content = $("<span class=\"confirm\"></span>")
        .text(text);
    
    notify.display("help", [content, buttons], function () {
      passbox.focus();
    });
    passbox.focus();
  }
  
  var redrawNeeded = false, preproc, renderDelay = 0, timer;
  
  // If draw latency sufficiently small, use a small delay on rendering.
  // Otherwise use a significantly larger one.
  var setRenderDelay = function (rendertime) {
    if (rendertime > 50) {
      renderDelay = 400;
    } else if (rendertime > 10) {
      renderDelay = 50;
    }
  };

  // Redraws the output using the content of the input.
  var redraw = function () {
    if (!redrawNeeded) {
      return;
    } else {
      redrawNeeded = false;
    }

    var startTime = (new Date()).getTime();
    preproc = $("<div></div>").html(markdown.makeHtml(editor.getSession().getValue()));
    var patch = $("#output > div").quickdiff("patch", preproc, ["mathSpan", "mathSpanInline"]);

    if (patch.type !== "identical" && patch.replace.length > 0) {
      $.each(patch.replace, function (i, el) {
        if (el.innerHTML) {
          MathJax.Hub.Typeset(el, function () {
            setRenderDelay((new Date()).getTime() - startTime);
          });
          size_images(el);
        } else if (el.tagName && el.tagName.toLowerCase() === 'img') {
          size_image(el);
        } else {
          setRenderDelay((new Date()).getTime() - startTime);
        }
      });
    } else {
      setRenderDelay((new Date()).getTime() - startTime);
    }
  };
  
  var MarkdownMode = require("ace/mode/markdown").Mode;
  window.editor = ace.edit("ace");
  editor.setTheme("ace/theme/twilight");
  editor.getSession().setTabSize(2);
  editor.getSession().setUseSoftTabs(true);
  editor.getSession().setMode(new MarkdownMode());
  editor.renderer.setShowGutter(false);
  editor.renderer.setHScrollBarAlwaysVisible(false);
  editor.getSession().setUseWrapMode(true);
  editor.setShowPrintMargin(false);
  
  var panels = {
    tool: 80,
    edit: 500
  };
  
  function setWidths(i) {
    $("#toolpanel, #editpanel").width(panels[i]);
    editor.resize();
  }
  
  Range = require("ace/range").Range;
  var docroot = "";
  // docroot = "../public"
  $("#acetools").append(
    $('<img src="' + docroot + '/images/fugue/edit-heading.png">')
      .click(function () {
        var session = editor.getSession(),
          linenum = editor.getCursorPosition().row,
          line = session.getLine(linenum),
          match = /^(#*)\s*(.*)$/.exec(line),
          newline;
        
        if ((match[1] === undefined) || (match[1].length === 0)) {
          newline = "# " + match[2];
        } else if (match[1].length < 6) {
          newline = match[1] + "# " + match[2];
        } else {
          newline = match[2];
        }
        
        replaceRange = new Range(linenum, 0, linenum, line.length);
        session.replace(replaceRange, newline);
        editor.selection.setSelectionRange(new Range(linenum, 0, linenum, newline.length));
        editor.focus();
      }),
    $('<img src="' + docroot + '/images/fugue/edit-bold.png">')
      .click(function () {
        var session = editor.getSession(),
          cursor = editor.getCursorPosition(),
          selection = editor.getSelectionRange(),
          selected = session.doc.getTextRange(selection),
          newtext, match;
        
        if (selection.start.row !== selection.end.row) {
          editor.focus();
          return;
        }
        
        if (selected) {
          match = /^[*]{2}(.+?)[*]{2}$/.exec(selected);
          if (match) {
            newtext = match[1];
            session.replace(selection, newtext);
            editor.selection.setSelectionRange(new Range(selection.start.row, selection.start.column, selection.end.row, selection.end.column-4));
          } else {
            newtext = "**" + selected + "**";
            session.replace(selection, newtext);
            editor.selection.setSelectionRange(new Range(selection.start.row, selection.start.column, selection.end.row, selection.end.column+4));
          }
        } else {
          editor.insert("****");
          editor.moveCursorTo(selection.start.row, selection.start.column+2);
        }
        editor.focus();
      }),
    $('<img src="' + docroot + '/images/fugue/edit-italic.png">')
      .click(function () {
        var session = editor.getSession(),
          cursor = editor.getCursorPosition(),
          selection = editor.getSelectionRange(),
          selected = session.doc.getTextRange(selection),
          newtext, match;
        
        if (selection.start.row !== selection.end.row) {
            editor.focus();
          return;
        }
        
        if (selected) {
          match = /^[*](.+?)[*]$/.exec(selected);
          if (match && !/^[*]{2}([^*].+?[^*])[*]{2}$/.test(selected)) {
            newtext = match[1];
            session.replace(selection, newtext);
            editor.selection.setSelectionRange(new Range(selection.start.row, selection.start.column, selection.end.row, selection.end.column-2));
          } else {
            newtext = "*" + selected + "*";
            session.replace(selection, newtext);
            editor.selection.setSelectionRange(new Range(selection.start.row, selection.start.column, selection.end.row, selection.end.column+2));
          }
        } else {
          editor.insert("**");
          editor.moveCursorTo(selection.start.row, selection.start.column+1);
        }
        editor.focus();
      }),
    $('<img src="' + docroot + '/images/fugue/chain.png">')
      .click(function () {
        var session = editor.getSession(),
          cursor = editor.getCursorPosition(),
          selection = editor.getSelectionRange(),
          selected = session.doc.getTextRange(selection);
          
        if (selection.start.row !== selection.end.row) {  
          editor.focus();
          return;
        }
          
        if (selected) {
          newtext = "[" + selected + "]()";
          session.replace(selection, newtext);
          editor.selection.setSelectionRange(new Range(selection.start.row, selection.end.column+3, selection.start.row, selection.end.column+3));
        } else {
          newtext = "[]()";
          session.replace(selection, newtext);
          editor.selection.setSelectionRange(new Range(selection.start.row, selection.end.column+1, selection.start.row, selection.end.column+1));
        }
        editor.focus();
      }),
    //$('<img src="' + docroot + '/images/fugue/edit-list.png">'),
    //$('<img src="' + docroot + '/images/fugue/edit-list-order.png">'),
    //$('<img src="' + docroot + '/images/fugue/edit-image.png">'),
    //$('<img src="' + docroot + '/images/fugue/edit-image-center.png">'),
    //$('<img src="' + docroot + '/images/fugue/edit-image-right.png">'),
    $('<img src="' + docroot + '/images/fugue/edit-rule.png">')
      .click(function () {
        var session = editor.getSession(),
          selection = editor.getSelectionRange();
          
        if (session.getLine(selection.start.row) !== "") {
          editor.insert("\n\n---\n");
          editor.selection.setSelectionRange(new Range(selection.start.row+2, 0, selection.start.row+2, 3));
        } else {
          editor.insert("\n---\n");
          editor.selection.setSelectionRange(new Range(selection.start.row+1, 0, selection.start.row+1, 3));
        }  
        editor.focus();
      }),
    $('<img src="' + docroot + '/images/fugue/edit-quotation.png">')
      .click(function () {
        var session = editor.getSession(),
          selection = editor.getSelectionRange(),
          line = session.getLine(selection.start.row),
          match = /^(\>?)\s*(.*)$/.exec(line),
          newline;
        
        if (/^\s*$/.test(line)) {
          newline = "> \n"
          replaceRange = new Range(selection.start.row, 0, selection.start.row, line.length);
          session.replace(replaceRange, newline);
          editor.selection.setSelectionRange(new Range(selection.start.row, 2, selection.start.row, 2));
        } else {
          if (match[1]) {
            newline = match[2];
          } else {
            newline = "> " + match[2];
          }
      
          replaceRange = new Range(selection.start.row, 0, selection.start.row, line.length);
          session.replace(replaceRange, newline);
          editor.selection.setSelectionRange(new Range(selection.start.row, 0, selection.start.row, newline.length));
        }  
        editor.focus();
      }),
    //$('<img src="' + docroot + '/images/fugue/edit-code.png">'),
    $('<img src="' + docroot + '/images/fugue/edit-mathematics.png">')
      .click(function () {
        var session = editor.getSession(),
          selection = editor.getSelectionRange(),
          selected = session.doc.getTextRange(selection),
          line = session.getLine(selection.start.row),
          match;
         
        if (selection.start.row !== selection.end.row) {
          return;
        }
        
        if (line === selected) {
          match = /^[$]{2}(.*?)[$]{2}$/.exec(selected);
          if (match) {
            newline = match[1];
          } else {
            newline = "$$" + selected + "$$";
          }
          session.replace(selection, newline);
          editor.selection.setSelectionRange(new Range(selection.start.row, 0, selection.start.row, newline.length));
        } else if (/^\s*$/.test(line)) {
          newline = "$$$$\n"
          replaceRange = new Range(selection.start.row, 0, selection.start.row, line.length);
          session.replace(replaceRange, newline);
          editor.selection.setSelectionRange(new Range(selection.start.row, 2, selection.start.row, 2));
        } else if (selected) {
          match = /^[%]{2}(.*?)[%]{2}$/.exec(selected);
          if (match) {
            newtext = match[1];
          } else {
            newtext = "%%" + selected + "%%";
          }
          session.replace(selection, newtext);
          editor.selection.setSelectionRange(new Range(selection.start.row, selection.start.column, selection.end.row, selection.start.column+newtext.length));
        } else {
          editor.insert("%%%%");
          editor.selection.setSelectionRange(new Range(selection.start.row, selection.start.column+2, selection.start.row, selection.start.column+2));
        }  
        
        editor.focus();
      }),
    $('<img src="' + docroot + '/images/fugue/edit-size-up.png">')
      .click(function () {
        $("#ace").css("font-size", parseInt($("#ace").css("font-size"),10) + 2);
        editor.focus();
      })
      .css("float", "right"),
    $('<img src="' + docroot + '/images/fugue/edit-size-down.png">')
      .click(function () {
        $("#ace").css("font-size", parseInt($("#ace").css("font-size"),10) - 2);
        editor.focus();
      })
      .css("float", "right")
  );
  
  var editpanel = $("#editpanel"),
    toolpanel = $("#toolpanel"),
    page = $("#page"),
    content = "",
    password = false,
    newdocument = editing,
    loaded = editing;
  
  editpanel.slide = function (show, preview) {
    if (!preview) {
      notify.conceal();
      notify.hide();
    }
  
    if (editpanel.slid === show) return;
    
    if (show) {
      editpanel
        .css({width: panels.edit, marginRight: -panels.edit})
        .animate({marginRight:0});
      editor.resize();
    } else {
      editpanel.animate({marginRight:-panels.edit});
    }
    editpanel.slid = show;
  };
  
  toolpanel.slide = function (show) {
    if (toolpanel.slid === show) return;
    
    if (show) {
      toolpanel
        .css({right: 20, width: panels.tool})
        .animate({width: panels.edit, right: 0}, function () {
          toolpanel.toggleClass("edit", true);
          toolpanel.toggleClass("readonly", false);
        });
    } else {
      toolpanel
        .css({right: 0, width: panels.edit})
        .animate({width: panels.tool, right: 20});
      toolpanel.toggleClass("edit", false);
      toolpanel.toggleClass("readonly", true);
    }
    toolpanel.slid = show;
  };
  
  toolpanel.setPasswordReq = function (flag) {
    $("#password").toggleClass("passdisable", !flag);
  }
  
  page.slide = function (show) {
    if (page.slid === show) return;
    
    if (show) {
      page
        .css({marginLeft: $("#page").offset().left})
        .animate({marginLeft:30});
    } else {
      page
        .animate({marginLeft: ($(window).width()-$("#page").width())/2},
          function () {
            page.css({margin:"30px auto"});
          });
    }
    page.slid = show;
  };
  
  var suppress_redraw = false;
  function refreshModified() {
    if (suppress_redraw) return;
    redrawNeeded = true;
    modified = editor.getSession().getValue() !== content;
    $("#save").css({opacity:modified ? 1 : 0.5});
    
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(redraw, renderDelay);
  }
  
  var previewing = false, modified = false, origcontent;
  
  toolpanel.setPasswordReq(passreq || newdocument);
  
  // Toggle editing. If we haven't loaded the content, then load it via AJAX.
  $("#edit-enable a").click(function () {
    if (!loaded) {
      inputarea.val("Loading..");
      $.getJSON("/" + Page.pagename() + ".json", function (data) {
        inputarea.val(data.text);
        loaded = true;
        Page.setNeedsRedraw();
      });
    }

    Page.editing(!Page.editing());
    return false;
  });
  
  var toggleEditOn = function () {
    editpanel.slide(true);
    toolpanel.slide(true);
    page.slide(true);
    if (!loaded) {
      suppress_redraw = true;
      editor.getSession().setValue("Loading..")
      $.getJSON("/" + pagename + ".json", function (data) {
        content = data.text;
        editor.getSession().setValue(data.text);
        editor.renderer.scrollToY(0);
        loaded = true;
        suppress_redraw = false;
      });
    }
    editor.focus();
    return false;
  };
  
  $("#edit").click(toggleEditOn);
  
  if (editing) {
    toggleEditOn();
  }
  
  var doCancel = function () {
    editpanel.slide(false);
    toolpanel.slide(false);
    page.slide(false);
    previewing = false;
    modified = false;
    var y = editor.renderer.getScrollTop();
    editor.getSession().setValue(content);
    editor.renderer.scrollToY(y);
    refreshModified();
  }
  
  $("#cancel").click(function () {
    if (!modified) {
      doCancel()
    } else {
      notify.confirm("Closing editor will lose unsaved changes.", doCancel);
    }
    return false;
  });
  $("#save").click(function () {
    refreshModified();
    if (!modified) return false;
    
    if (newdocument) {
      if (!password) {
        notify.confirm("Saving without password.", doSave);
      } else {
        notify.confirm("Saving with password.", doSave);
      }
    } else {
      if (passreq && !password) {
        notify.password("Please enter the page password.", function (newpassword) {
          if (newpassword !== "") {
            password = hex_sha256(newpassword);
          } else {
            password = false;
          }
          doSave();
        });
      } else {
        doSave();
      }
    }
    
    return false;
  });
    
  notify.ajaxError(function (event, xhr, settings, thrown) {
    if (xhr.responseText) {
      try {
        var response = $.parseJSON(xhr.responseText);
        if (response.message) {
          notify.setMessage(response.message, "warning");
          return;
        }
      } catch (exc) {}
    }
    if (thrown) {
      notify.setMessage(thrown, "warning");
    } else {
      notify.setMessage("Communication error.", "warning");
    }
  });
    
  var doSave = function () {
    if (newdocument && password) {
      passreq = true;
    }
    
    var cont = editor.getSession().getValue();
    var payload = {text: cont};
    if (password !== false) {
      payload.password = password;
    }
    $.post("/" + pagename + ".json", payload, function (ret) {
      if (ret && ret.status === "success") {
        content = cont;
        notify.setMessage("Saved.", "success");
        toolpanel.setPasswordReq(passreq);
        newdocument = false;
        refreshModified();
      } else {
        if (ret && ret.status === "failure") {
          notify.setMessage(ret.message, "warning");
        } else {
          notify.setMessage("Unknown response from the server.", "warning");
        }
      }
    }, "json");
    
    return false;
  };
  
  editor.getSession().on('change', refreshModified);
  
  $("#dragger").drag("start", function (ev, dd) {
    $.data(this, 'startw', editpanel.width());
  }).drag(function(ev, dd) {
    panels.edit = $.data(this, 'startw') - dd.deltaX;
    setWidths("edit");
  });
  
  $("#preview").click(function () {
    page.slide(previewing);
    editpanel.slide(previewing, true);
    previewing = !previewing;
    return false;
  });
  
  $("#password").click(function () {
    notify.password("Please enter a page password.", function (newpassword) {
      if (password !== "") {
        password = hex_sha256(newpassword);
      } else {
        password = false;
      }
    });
    return false;
  });
  return false;
});