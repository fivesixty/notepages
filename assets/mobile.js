$("document").ready(function () {

  var preproc = $("<div>"),
    inputarea = $("#textarea"),
    outputel = $("#content > div");

  var redraw = function () {
    preproc.html(markdown.makeHtml(inputarea.val()));
    var patch = outputel.quickdiff("patch", preproc, ["mathSpan", "mathSpanInline"]);

    if (patch.type !== "identical" && patch.replace.length > 0) {
      $.each(patch.replace, function (i, el) {
        if (el.innerHTML) {
          size_images(el);
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