function size_images(context) {
  $("img", context).not(".MathJax_strut").each(function (i, obj) {
    obj = $(obj);
    if (obj.width() > 625) {
      var scale = 625 / obj.width();
      obj.width(obj.width() * scale);
    }
  });
}

$(window).load(function () {
  size_images($("#output")[0]);
});

$.fn.quickdiff("filter", "mathSpanInline",
  function (node) { return (node.nodeName === "SPAN"
                            && $(node).hasClass("mathInline")); },
  function (a, b) {
    var aHTML = $.trim($("script", a).html()), bHTML = $.trim($(b).html());
    return ("%%" + aHTML + "%%") !== bHTML;
  });

$.fn.quickdiff("filter", "mathSpan",
  function (node) { return (node.nodeName === "SPAN"
                            && $(node).hasClass("math")); },
  function (a, b) {
    var aHTML = $.trim($("script", a).html()), bHTML = $.trim($(b).html());
    return ("$$" + aHTML + "$$") !== bHTML;
  });
  
var Page = (function () {
  var previewing = false,
    editor_scrolltop = 0,
    editor_position = {start: 0, end: 0},
    preview_scrolltop = 0,
    markdown = new Showdown.converter(),
    narrowscreen = false,
    inputarea,
    preproc = $("<div></div>"),
    outputel,
    renderDelay = 50;
  
  var setRenderDelay = function (rendertime) {
    if (rendertime > 200) {
      renderDelay = 400;
    } else if (rendertime > 10) {
      renderDelay = 50;
    }
  };

  var redraw = function () {
    var startTime = (new Date()).getTime();
    preproc.html(markdown.makeHtml(inputarea.val()));
    var patch = outputel.quickdiff("patch", preproc, ["mathSpan", "mathSpanInline"]);

    if (patch.type !== "identical" && patch.replace.length > 0) {
      $.each(patch.replace, function (i, el) {
        if (el.innerHTML) {
          size_images(el);
          MathJax.Hub.Typeset(el, function () {
            setRenderDelay((new Date()).getTime() - startTime);
          });
        } else {  
          setRenderDelay((new Date()).getTime() - startTime);
        }
      });
    } else {
      setRenderDelay((new Date()).getTime() - startTime);
    }
  };

  var savePagePosition = function () {
    preview_scrolltop = $("body").scrollTop();
  };
  var restorePagePosition = function () {
    $("body").scrollTop(preview_scrolltop);
  };

  var saveEditorState = function () {
    editor_scrolltop = inputarea.scrollTop();
    editor_position = inputarea.getSelection();
  };
  var restoreEditorState = function () {
    inputarea.setSelection(editor_position.start, editor_position.end);
    inputarea.scrollTop(editor_scrolltop);
  };

  var setPreviewing = function (toggle) {
    previewing = toggle;
    $("body").toggleClass("preview", previewing);
    if (previewing) {
      $("#preview-enable a").text("EDITOR");
    } else {
      $("#preview-enable a").text("PREVIEW");
    }
  };

  var reconstrain = function () {
    var height = $(window).height(), width = $(window).width();

    if (editing) {
      inputarea.height(height - 90);
    }

    var switched = false;
    if (width < 1260 && !narrowscreen) {
      if (editing) {
        savePagePosition();
      }
      narrowscreen = true;
      setPreviewing(false);
      switched = true;
    } else if (width >= 1260 && narrowscreen) {
      if (editing) {
        saveEditorState();
      }
      narrowscreen = false;
      setPreviewing(true);
      switched = true;
    }

    $("body").toggleClass("widescreen", !narrowscreen);
    $("body").toggleClass("narrowscreen", narrowscreen);

    if (editing && switched && !narrowscreen) {
      restorePagePosition();
      restoreEditorState();
    }
  };

  var setEditing = function (edit) {
    editing = edit;
    $("body").toggleClass("readonly", !editing);
    $("body").toggleClass("editing", editing);
    if (editing) {
      reconstrain();
      restoreEditorState();
      $("#edit-enable a").text("CANCEL");
    } else {
      $("#page").css({height: "auto"});
      restorePagePosition();
      $("#edit-enable a").text("EDIT");
    }
  };
  
  return {
    editing: function () {
      if (arguments.length === 0) {
        return editing;
      } else {
        setEditing(arguments[0]);
      }
    },
    preview: function () {
      if (arguments.length === 0) {
        return previewing;
      } else {
        setPreviewing(arguments[0]);
      }
    },
    savePagePosition: savePagePosition,
    restorePagePosition: restorePagePosition,
    saveEditorState: saveEditorState,
    restoreEditorState: restoreEditorState,
    init : function (name, input, output) {
      pagename = name;
      inputarea = input;
      outputel = output;
    },
    reconstrain: reconstrain,
    pagename: function () {
      return pagename;
    },
    narrowscreen: function () {
      return narrowscreen;
    },
    redraw: redraw
  };
}());

$(document).ready(function () {
  var loaded = editing,
    inputarea = $("textarea"),
    outputel = $("#output > div");
  
  Page.init(pagename, inputarea, outputel);
  Page.reconstrain();
  Page.editing(editing);
  
  $(window).resize(Page.reconstrain);
  
  $("textarea").keyup(function () {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(Page.redraw, Page.renderDelay);
  });
  
  $("#edit-enable a").click(function () {
    if (!loaded) {
      inputarea.val("Loading..");
      $.getJSON("/" + Page.pagename() + ".json", function (data) {
        inputarea.val(data.text);
        loaded = true;
        Page.redraw();
      });
    }
    
    if (Page.preview() || !Page.narrowscreen()) {
      Page.savePagePosition();
    }
    if (Page.editing()) {
      Page.saveEditorState();
    }
    
    Page.preview(false);
    Page.editing(!Page.editing());
    return false;
  });
  
  $("#preview-enable a").click(function () {
    if (Page.preview()) {
      Page.savePagePosition();
      Page.preview(false);
      Page.restoreEditorState();
    } else {
      Page.saveEditorState();
      Page.preview(true);
      Page.restorePagePosition();
    }
    return false;
  });
  
  $("#savebutton").click(function () {
    $.post("/" + Page.pagename() + ".json", {text: inputarea.val(), password: $("#password").val()}, function (ret) {
      if (ret && ret.status === "success") {
        Grumble.show({message: "Saved successfully.", title: "Saved", icon: "success"});
      } else {
        if (ret && ret.status === "failure") {
          Grumble.show({message: ret.message, title: "Error", icon: "error"});
        } else {
          Grumble.show({message: "Unknown response from the server.", title: "Error", icon: "error"});
        }
      }
    }, "json");
  });
  
});