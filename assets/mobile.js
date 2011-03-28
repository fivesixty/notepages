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
  "th" : ["align"],
  "img" : ["src", "alt", "title"],
  "a" : ["href", "title"]
});

$("document").ready(function () {

  var markdown = new Showdown.converter(),
    preproc = $("<div>"),
    inputarea = $("#textarea"),
    outputel = $("#content > div");

  $.extend(markdown.config, {
    stripHTML: true,
    tables: true,
    math: true,
    figures: true
  });

  var redraw = function () {
    preproc.html(markdown.makeHtml(inputarea.val()));
    var patch = outputel.quickdiff("patch", preproc, ["mathSpan", "mathSpanInline"]);

    if (patch.type !== "identical" && patch.replace.length > 0) {
      $.each(patch.replace, function (i, el) {
        if (el.innerHTML) {
          MathJax.Hub.Typeset(el);
        }
      });
    }
  };

  var loaded = editing;
  $("#editor").live("pageshow", function (event, ui) {
    if (!loaded) {
      $("#textarea").val("Loading..");
      $.getJSON("/"+pagename+".json", function (data) {
        $("#textarea").val(data.text);
        loaded = true;
      });
    }
  });
  
  if (loaded) {
    $.mobile.changePage("#editor", null, false, true);
  }
  
  $("#reader").live("pageshow", function (event, ui) {
    if (loaded) {
      redraw();
    }
  });
  
  $("#content a").attr("rel", "external");
  
  $("#saveform").live("click", function () {
    $.post("/"+pagename+".json", {text: inputarea.val(), password: $("#password").val()}, function (ret) {
      if (ret && ret.status === "success") {
        $('.ui-dialog').dialog('close');
      } else {
        if (ret && ret.status === "failure") {
          $("#formerror").text(ret.message);
        } else {
          $("#formerror").text("Unknown response from the server.");
        }
      }
    }, "json");
    return false;
  });
});