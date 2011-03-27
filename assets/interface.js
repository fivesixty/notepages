// In a given context, make sure all images (skipping MathJax related images)
// Are no wider than the page width.
function size_images(context) {
  $("img", context).not(".MathJax_strut").each(function (i, obj) {
    obj = $(obj);
    if (obj.width() > 640) {
      var scale = 640 / obj.width();
      obj.width(obj.width() * scale);
    }
  });
}

// Check all output images once the page has loaded.
$(window).load(function () {
  size_images($("#output")[0]);
});

// Setup a filter for comparing mathInline spans.
$.fn.quickdiff("filter", "mathSpanInline",
  function (node) { return (node.nodeName === "SPAN"
                            && $(node).hasClass("mathInline")); },
  function (a, b) {
    var aHTML = $.trim($("script", a).html()), bHTML = $.trim($(b).html());
    return ("%%" + aHTML + "%%") !== bHTML;
  });

// Setup a filter for comparing math spans.
$.fn.quickdiff("filter", "mathSpan",
  function (node) { return (node.nodeName === "SPAN"
                            && $(node).hasClass("math")); },
  function (a, b) {
    var aHTML = $.trim($("script", a).html()), bHTML = $.trim($(b).html());
    return ("$$" + aHTML + "$$") !== bHTML;
  });
  
$.fn.quickdiff("attributes", {
  "td" : ["align"],
  "th" : ["align"]
});

// Define the page and functions
var Page = (function () {
  var previewing = false,
    editor_scrolltop = 0,
    editor_position = {start: 0, end: 0},
    preview_scrolltop = 0,
    markdown = new Showdown.converter(),
    narrowscreen = undefined,  // undefined so setNarrowscreen runs at page load
    inputarea,
    preproc = $("<div></div>"),
    outputel,
    renderDelay = 50,
    redrawNeeded = false;
  
  $.extend(markdown.config, {
    stripHTML: true,
    tables: true,
    math: true,
    figures: true
  });
  
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

  // Helper functions to save/restore page position.
  var savePagePosition = function () {
    preview_scrolltop = $("body").scrollTop();
  };
  var restorePagePosition = function () {
    $("body").scrollTop(preview_scrolltop);
  };

  // Helper functions to save/restore editor position and selection.
  var saveEditorState = function () {
    editor_scrolltop = inputarea.scrollTop();
    editor_position = inputarea.getSelection();
  };
  var restoreEditorState = function () {
    inputarea.setSelection(editor_position.start, editor_position.end);
    inputarea.scrollTop(editor_scrolltop);
  };

  // Set whether we are previewing or not.
  var setPreviewing = function (toggle) {
    if (previewing) {
      savePagePosition();
    } else {
      saveEditorState();
    }
    
    previewing = toggle;
    $("body").toggleClass("preview", previewing);
    
    if (previewing) {
      restorePagePosition();
      redraw();
      $("#preview-enable a").text("EDITOR");
    } else {
      restoreEditorState();
      $("#preview-enable a").text("PREVIEW");
    }
  };
  
  var setNarrowscreen = function (toggle) {
    if (narrowscreen !== toggle) {
      // If we're going into narrowscreen mode, save where the page is
      // and disable the preview.
      if (toggle) {
        savePagePosition();
        setPreviewing(false);
      }
      
      // Make the class/variable changes.
      narrowscreen = toggle;
      $("body").toggleClass("widescreen", !narrowscreen);
      $("body").toggleClass("narrowscreen", narrowscreen);
      
      // If we're now in widescreen, restore the page based on preview state.
      if (!narrowscreen) {
        if (previewing) {
          restoreEditorState();
        } else {
          redraw();
          restorePagePosition();
        }
      }
    }
  }

  var editorResize = function () {
    inputarea.height($(window).height() - 90);
  }

  // Reconstrain the page based upon current window size.
  // Will resize the editor when editing, and toggle on/off narrowscreen mode.
  var reconstrain = function () {
    if (editing) {
      editorResize();
    }
    setNarrowscreen($(window).width() < 1260);
  };

  // Set whether we are editing or not.
  var setEditing = function (edit) {
    if (editing) {
      if (previewing || !narrowscreen) {
        savePagePosition();
      }
    } else {
      savePagePosition();
    }
    
    editing = edit;
    $("body").toggleClass("readonly", !editing);
    $("body").toggleClass("editing", editing);
    
    if (editing) {
      setPreviewing(false);
      editorResize();
      restoreEditorState();
      $("#edit-enable a").text("CANCEL");
    } else {
      $("#page").css({height: "auto"});
      restorePagePosition();
      redraw();
      $("#edit-enable a").text("EDIT");
    }
  };
  
  var setNeedsRedraw = function () {
    redrawNeeded = true;
    if (!narrowscreen || previewing || !editing) {
      redraw();
    }
  }
  
  // Return functions for getting/setting parameters of the page.
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
    init : function (name, input, output) {
      pagename = name;
      inputarea = input;
      outputel = output;
      reconstrain();
    },
    reconstrain: reconstrain,
    pagename: function () {
      return pagename;
    },
    renderDelay: function () {
      return renderDelay;
    },
    setNeedsRedraw: setNeedsRedraw
  };
}());

$(document).ready(function () {
  var loaded = editing,
    inputarea = $("textarea"),
    outputel = $("#output > div");
  
  Page.init(pagename, inputarea, outputel);
  Page.editing(editing);
  
  $(window).resize(Page.reconstrain);
  
  $('.slide-out-div').tabSlideOut({
      tabHandle: '.handle',                              //class of the element that will be your tab
      pathToTabImage: 'assets/sidehelp.png',          //path to the image for the tab *required*
      imageHeight: '122px',                               //height of tab image *required*
      imageWidth: '40px',                               //width of tab image *required*    
      tabLocation: 'left',                               //side of screen where tab lives, top, right, bottom, or left
      speed: 300,                                        //speed of animation
      action: 'click',                                   //options: 'click' or 'hover', action to trigger animation
      topPos: '100px',                                   //position from the top
      fixedPosition: false                               //options: true makes it stick(fixed position) on scroll
  });
  
  // On keyup, clear any timer and instate a new one using the current
  // render relay.
  $("textarea").keyup(function () {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(Page.setNeedsRedraw, Page.renderDelay());
  });
  
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
  
  // Toggle preview on/off
  $("#preview-enable a").click(function () {
    Page.preview(!Page.preview());
    return false;
  });
  
  // Save the page, displaying a notification of the result status.
  $("#editform").submit(function () {
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
    return false;
  });
  
});