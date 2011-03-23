function size_images(context) {
  $("img", context).not(".MathJax_strut").each(function (i, obj) {
    obj = $(obj);
    if (obj.width() > 625) {
      scale = 625 / obj.width();
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
  } );

$.fn.quickdiff("filter", "mathSpan",
  function (node) { return (node.nodeName === "SPAN"
                            && $(node).hasClass("math")); },
  function (a, b) {
    var aHTML = $.trim($("script", a).html()), bHTML = $.trim($(b).html());
    return ("$$" + aHTML + "$$") !== bHTML;
  } );

$(document).ready(function () {
  var loaded = editing,
    previewing = false,
    editor_scrolltop = 0,
    editor_position = {start: 0, end: 0},
    preview_scrolltop = 0,
    markdown = new Showdown.converter(),
    narrowscreen = false,
    inputarea = $("textarea"),
    preproc = $("<div></div>"),
    outputel = $("#output > div"),
    renderDelay = 50;
    
  reconstrain();
  setEditing(editing);
  
  var wHeight = $(window).height();
  var wWidth = $(window).width();
  $(window).resize(function () {
    wHeight = $(window).height();
    wWidth = $(window).width();
    reconstrain(wHeight, wWidth);
  });
  
  $("textarea").keyup(function () {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(redraw,renderDelay);
  });
  
  $("#edit-enable a").click(function () {
    if (!loaded) {
      $("textarea").val("Loading..");
      $.getJSON("/" + pagename + ".json", function (data) {
        $("textarea").val(data.text);
        $("#savebutton").attr("disabled", false);
        loaded = true;
        redraw();
      });
    }
    
    if (previewing || !narrowscreen) {
      savePagePosition();
    }
    if (editing) {
      saveEditorState();
    }
    
    setPreviewing(false);
    setEditing(!editing);
    return false;
  });
  
  $("#preview-enable a").click(function () {
    if (narrowscreen && editing) {
      if (previewing) {
        savePagePosition();
        setPreviewing(false);
        $("body").toggleClass("preview", false);
        restoreEditorState();
      } else {
        saveEditorState();
        setPreviewing(true);
        $("body").toggleClass("preview", true);
        restorePagePosition();
      }
    }
    return false;
  });
  
  $("#savebutton").click(function () {
    $.post("/" + pagename + ".json", {text:$("textarea").val(), password: $("#password").val()}, function (ret) {
      if (ret && ret.status == "success") {
        Grumble.show({message:"Saved successfully.", title:"Saved", icon:"success"});
      } else {
        if (ret && ret.status == "failure") {
          Grumble.show({message:ret.message, title:"Error", icon:"error"});
        } else {
          Grumble.show({message:"Unknown response from the server.", title:"Error", icon:"error"});
        }
      }
    }, "json");
  });
  
  function setRenderDelay(rendertime) {
    if (rendertime > 200) {
      renderDelay = 400;
    } else if (rendertime > 10) {
      renderDelay = 50;
    }
  }
  
  function redraw() {
    var startTime = (new Date()).getTime();
    preproc.html(markdown.makeHtml(inputarea.val()));
    var patch = outputel.quickdiff("patch", preproc, ["mathSpan", "mathSpanInline"]);
    
    if (patch.type !== "identical" && patch.replace.length > 0) {
      $.each(patch.replace, function (i, el) {
        if (el.innerHTML) {
          size_images(el);
          MathJax.Hub.Typeset(el, function() {
            setRenderDelay((new Date()).getTime() - startTime);
          });
        } else {  
          setRenderDelay((new Date()).getTime() - startTime);
        }
      });
    } else {
      setRenderDelay((new Date()).getTime() - startTime);
    }
  }
  
  function savePagePosition() {
    preview_scrolltop = $("body").scrollTop();
  }
  function restorePagePosition() {
    $("body").scrollTop(preview_scrolltop);
  }
  
  function saveEditorState() {
    editor_scrolltop = $("textarea").scrollTop();
    editor_position = $("textarea").getSelection();
  }
  function restoreEditorState() {
    $("textarea").setSelection(editor_position.start, editor_position.end);
    $("textarea").scrollTop(editor_scrolltop);
  }
  
  function setPreviewing(toggle) {
    previewing = toggle;
    $("body").toggleClass("preview", previewing);
    if (previewing) {
      $("#preview-enable a").text("EDITOR");
    } else {
      $("#preview-enable a").text("PREVIEW");
    }
  }
  
  function reconstrain(height, width) {
    if (editing) {
      inputarea.height(height - 90);
    }
    
    switched = false
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
  }
  
  function setEditing(edit) {
    editing = edit;
    $("body").toggleClass("readonly", !editing);
    $("body").toggleClass("editing", editing);
    if (editing) {
      reconstrain(wHeight, wWidth);
      restoreEditorState();
      $("#edit-enable a").text("CANCEL");
    } else {
      $("#page").css({height:"auto"});
      restorePagePosition();
      $("#edit-enable a").text("EDIT");
    }
  }
  
});