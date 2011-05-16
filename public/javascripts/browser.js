$(document).ready(function () {
  
  var redrawNeeded = false, preproc = $("<div></div>"), renderDelay = 0, timer;
  
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
    preproc.html(markdown.makeHtml(editor.getSession().getValue()));
    var patch = $("#output > div").quickdiff("patch", preproc, ["mathSpan", "mathSpanInline"]);

    if (patch.type !== "identical" && patch.replace.length > 0) {
      $.each(patch.replace, function (i, el) {
        if (el.innerHTML) {
          size_images(el);
          MathJax.Hub.Typeset(el, function () {
            setRenderDelay((new Date()).getTime() - startTime);
          });
        } else if (el instanceof HTMLImageElement) {
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
  var editor = ace.edit("ace");
  editor.setTheme("ace/theme/twilight");
  editor.getSession().setTabSize(2);
  editor.getSession().setUseSoftTabs(true);
  editor.getSession().setMode(new MarkdownMode());
  editor.renderer.setShowGutter(false);
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
  
  var editpanel = $("#editpanel"),
    toolpanel = $("#toolpanel"),
    page = $("#page"),
    content = "",
    password = "",
    newdocument = editing,
    loaded = editing;
  
  editpanel.slide = function (show) {
    if (editpanel.slid === show) return;
    
    if (show) {
      editpanel.show()
        .css({width: panels.edit, marginRight: -panels.edit})
        .animate({marginRight:0});
      editor.resize();
    } else {
      editpanel
        .animate({marginRight:-panels.edit}, function () {
          editpanel.hide();
        });
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
  
  function refreshModified() {
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
      editor.getSession().setValue("Loading..")
      $.getJSON("/" + pagename + ".json", function (data) {
        content = data.text;
        editor.getSession().setValue(data.text);
        editor.renderer.scrollToY(0);
        loaded = true;
        refreshModified();
      });
    }
    editor.focus();
    return false;
  };
  
  $("#edit").click(toggleEditOn);
  
  if (editing) {
    toggleEditOn();
  }
  
  $("#cancel").click(function () {
    if (!modified || confirm("Are you sure you want to cancel? Edits will be lost.")) {
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
    return false;
  });
  $("#save").click(function () {
    refreshModified();
    if (!modified) return false;
    
    if (newdocument) {
      if (!password && !confirm("Saving without password will let this page be globally edited, and cannot be changed later. Continue?")) {
        return false;
      } else if (password && !confirm("Saving with password. This cannot be removed later, continue?")) {
        return false;
      }
    }
    
    if (passreq && !password) {
      var newpassword = prompt("Please enter page password.");
      if (newpassword !== null) {
        password = newpassword;
      } else {
        return false;
      }
    }
    
    if (newdocument && password) {
      passreq = true;
    }
    
    var cont = editor.getSession().getValue();
    $.post("/" + pagename + ".json", {text: cont, password: password}, function (ret) {
      if (ret && ret.status === "success") {
        content = cont;
        Grumble.show({message: "Saved successfully.", title: "Saved", icon: "success"});
        toolpanel.setPasswordReq(passreq);
        newdocument = false;
        refreshModified();
      } else {
        if (ret && ret.status === "failure") {
          Grumble.show({message: ret.message, title: "Error", icon: "error"});
        } else {
          Grumble.show({message: "Unknown response from the server.", title: "Error", icon: "error"});
        }
      }
    }, "json");
    
    return false;
  });
  
  $("#inner").keyup(refreshModified);
  
  $("#dragger").drag("start", function (ev, dd) {
    $.data(this, 'startw', editpanel.width());
  }).drag(function(ev, dd) {
    panels.edit = $.data(this, 'startw') - dd.deltaX;
    setWidths("edit");
  });
  
  $("#preview").click(function () {
    page.slide(previewing);
    editpanel.slide(previewing);
    previewing = !previewing;
    return false;
  });
  
  $("#password").click(function () {
    var newpassword = prompt("Please enter page password.");
    if (newpassword !== null) {
      password = newpassword;
    }
    return false;
  });
  return false;
});