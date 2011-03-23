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

$(document).ready(function () {
  var wHeight = $(window).height();
  var wWidth = $(window).width();
  var loaded = editting;
  if (editting) {
    $("#options-inner").css({marginTop: 0});
  } else {
    $("#savebutton").attr("disabled", true);
  }
  var previewing = false;
  editor_scrolltop = 0;
  editor_position = {start: 0, end: 0};
  preview_scrolltop = 0;
  
  markdown = new Showdown.converter();
  
  var narrowscreen = false;
  
  var inputarea = $("textarea");
  var preproc = $("<div></div>");
  var outputel = $("#output > div");
  
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
  
  var lastrendertime = 0;
  var renderDelay = 0;
  var markdownTime = 0;
  var diffTime = 0;
  
  function setRenderDelay() {
    if (lastrendertime > 200) {
      renderDelay = 400;
    } else if (lastrendertime > 10) {
      renderDelay = 50;
    }
    $("#delay").html((lastrendertime) + "ms : " + (diffTime) + "ms : " + markdownTime +  "ms : " + renderDelay + "ms");
  }
  
  function redraw() {
    var startTime = (new Date()).getTime();
    
    var genHTML = markdown.makeHtml(inputarea.val());
    preproc.html(genHTML);
    
    markdownTime = ((new Date()).getTime() - startTime);
    
    var patch = outputel.quickdiff("patch", preproc, ["mathSpan", "mathSpanInline"]);
    
    diffTime = ((new Date()).getTime() - startTime) - markdownTime;
    setRenderDelay();
    
    if (patch.type !== "identical") {
      if (patch.replace.length > 0) {
        $.each(patch.replace, function (i, el) {
          if (el.innerHTML) {
            size_images(el);
            MathJax.Hub.Typeset(el, function() {
              lastrendertime = ((new Date()).getTime() - startTime) - diffTime - markdownTime;
              setRenderDelay();
            });
          } else {
            lastrendertime = ((new Date()).getTime() - startTime) - diffTime - markdownTime;
            setRenderDelay();
          }
        });
      }
    } else {
      lastrendertime = ((new Date()).getTime() - startTime) - diffTime - markdownTime;
    }
  }
  
  $("textarea").keyup(function () {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(redraw,renderDelay);
  });
  
  
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
    if (editting) {
      $("textarea").height(height - 90);
    }
    
    switched = false
    if (width < 1260 && !narrowscreen) {
      if (editting) {
        savePagePosition();
      }
      narrowscreen = true;
      setPreviewing(false);
      switched = true;
    } else if (width >= 1260 && narrowscreen) {
      if (editting) {
        saveEditorState();
      }
      narrowscreen = false;
      setPreviewing(true);
      switched = true;
    }
    
    $("body").toggleClass("widescreen", !narrowscreen);
    $("body").toggleClass("narrowscreen", narrowscreen);
    
    if (editting && switched && width >= 1260) {
      restorePagePosition();
      restoreEditorState();
    }
  }
  
  reconstrain();
  
  // $('pre code').each(function(i, e) {hljs.highlightBlock(e, '    ')});
  
  function editprocessing() {
    $("body").toggleClass("readonly", !editting);
    $("body").toggleClass("editting", editting);
    if (editting) {
      reconstrain(wHeight, wWidth);
      restoreEditorState();
      $("#edit-enable a").text("CANCEL");
    } else {
      $("#page").css({height:"auto"});
      restorePagePosition();
      $("#edit-enable a").text("EDIT");
    }
  }
  
  editprocessing();
  
  $("#edit-enable").click(function () {
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
    if (editting) {
      saveEditorState();
    }
    editting = !editting;
    
    setPreviewing(false);
    editprocessing();
    return false;
  });
  
  $("#preview-enable").click(function () {
    if (wWidth < 1260 && editting) {
      if (previewing) {
        savePagePosition();
      } else {
        saveEditorState();
      }
      
      setPreviewing(!previewing);
      $("body").toggleClass("preview", previewing);
      
      if (previewing) {
        restorePagePosition();
      } else {
        restoreEditorState();
      }
    }
    return false;
  });
  
  $(window).resize(function () {
    wHeight = $(window).height();
    wWidth = $(window).width();
    reconstrain(wHeight, wWidth);
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
  
});