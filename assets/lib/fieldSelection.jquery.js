/*
 * Modified from version retrieved at
 * http://plugins.jquery.com/project/field_selection
 * 
 * jQuery plugin: fieldSelection - v0.1.0 - last change: 2006-12-16
 * (c) 2006 Alex Brem <alex@0xab.cd> - http://blog.0xab.cd
 */

(function() {
  var fieldSelection = {
    getSelection: function() {
      var e = this.jquery ? this[0] : this;
      
      var errCase = {
        start: 0,
        end: e.value.length,
        length: 0
      };
      
      /* mozilla / dom 3.0 */
      if ('selectionStart' in e) {
        try {
          var l = e.selectionEnd - e.selectionStart;
          return {
            start: e.selectionStart,
            end: e.selectionEnd,
            length: l,
            text: e.value.substr(e.selectionStart, l)
          };
        } catch (e) {
          return errCase;
        }
      }

      /* exploder */
      if (document.selection) {
        e.focus();

        var r = document.selection.createRange();
        if (r == null) {
          return errCase;
        }

        var re = e.createTextRange();
        var rc = re.duplicate();
        re.moveToBookmark(r.getBookmark());
        rc.setEndPoint('EndToStart', re);

        // IE bug - it counts newline as 2 symbols when getting selection coordinates,
        //  but counts it as one symbol when setting selection
        var rcLen = rc.text.length, i, rcLenOut = rcLen;
        for (i = 0; i < rcLen; i++) {
          if (rc.text.charCodeAt(i) == 13) rcLenOut--;
        }
        var rLen = r.text.length, rLenOut = rLen;
        for (i = 0; i < rLen; i++) {
          if (r.text.charCodeAt(i) == 13) rLenOut--;
        }

        return {
          start: rcLenOut,
          end: rcLenOut + rLenOut,
          length: rLenOut,
          text: r.text
        };
      }

      /* browser not supported */
      return errCase;

    },

    setSelection: function(start, end) {
      var e = $(this).get(0);
      if (!e) {
        return $(this);
      } else if (e.setSelectionRange) { /* WebKit */ 
        try {
          e.focus(); e.setSelectionRange(start, end);
        } catch (e) {
          return $(this);
        }
      } else if (e.createTextRange) { /* IE */
        var range = e.createTextRange();
        range.collapse(true);
        range.moveEnd('character', end);
        range.moveStart('character', start);
        range.select();
      } else if (e.selectionStart) { /* Others */
        e.selectionStart = start;
        e.selectionEnd = end;
      }

      return $(this);
    }
  };

  jQuery.each(fieldSelection, function(i) { jQuery.fn[i] = this; });

})();