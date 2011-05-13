// In a given context, make sure all images (skipping MathJax related images)
// Are no wider than the page width.
function size_image(obj) {
  setTimeout(function () {
    obj = $(obj);
    if (obj.width() > 640) {
      var scale = 640 / obj.width();
      obj.width(obj.width() * scale);
    }
  }, 0);
}

function size_images(context) {
  $("img", context).not(".MathJax_strut").each(function (i, obj) {
    size_image(obj);
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

var markdown = new Showdown.converter();

$.extend(markdown.config, {
  stripHTML: true,
  tables: true,
  math: true,
  figures: true
});