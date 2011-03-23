var Grumble = function($){

    var options;

    var defaults = {
        dismissMessage: '<br />(Click to dismiss)', 
        duration: 3000,
        fadeInSpeed: 300,
        fadeOutSpeed: 300,
        icon: 'error',
        iconClass: 'grumbleIcon',
        message: 'Your message here',
        messageClass: 'grumbleMessage',
        noteClass: 'grumbleNote',
        right: 10,
        spacing: 5,
        sticky: false,
        title: 'Your title here',
        titleClass: 'grumbleTitle',
        top: 10
    }
    // Private functions
    function removeNote(note) {
        if (note.data('mouseOver')) {
            setTimeout(removeNote, 1000, note); // User is hovering; try again in a bit
        } else {
            $(note).fadeOut(options.fadeOutSpeed, function(){
                $(note).remove();
            });
        }
    }
    
    // $(window).scroll(function(){
    //     console.log(window.scrollY);
    //     $('.grumbleNote').each(function(){
    //         var currNote = $(this);
    //         var currPosition = currNote.offset();
    //         var currTop = currPosition.top;
    //         var currHeight = currNote.height();
    //         var currBorderWidth = parseInt(currNote.css('border-top-width')) + parseInt(currNote.css('border-bottom-width'));
    //         var currPadding = parseInt(currNote.css('padding-top')) + parseInt(currNote.css('padding-bottom'));
    //         var currBottom = currTop + currHeight + currBorderWidth + currPadding;
    //         currNote.find('.grumbleTitle').text('top:'+currTop+', bottom:'+currBottom);
    //     });
    // });
    
    // Public functions
    function show(customOptions) {
        options = $.extend({}, defaults, customOptions);
        var thisNote, thisNoteTop, tops = [], bottoms = [window.scrollY + options.top], firstNoteTop, lastNoteBottom;
        thisNote = $('<div><div class="'+options.iconClass+' '+options.icon+'"></div><div class="'+options.titleClass+'">'+options.title+'</div><div class="'+options.messageClass+'">'+options.message+'</div></div>');
        if (options.sticky) {
            thisNote.find('.'+options.messageClass).append(options.dismissMessage);
        }
        thisNote.css({right: options.right, display:'none', position: 'fixed'});
        thisNote.appendTo('body');
        thisNote.addClass(options.noteClass); // Add class so we can calc height
        var thisNoteHeight = thisNote.height();
        var thisNoteBorderWidth = parseInt(thisNote.css('border-top-width')) + parseInt(thisNote.css('border-bottom-width'));
        var thisNotePadding = parseInt(thisNote.css('padding-top')) + parseInt(thisNote.css('padding-bottom'));
        spaceNeeded = thisNoteHeight + thisNoteBorderWidth + thisNotePadding + options.spacing;
        // thisNote.find('.grumbleTitle').text('spaceNeeded:'+spaceNeeded);
        thisNote.removeClass(options.noteClass); // Remove class so we can find space
        if ($('.'+options.noteClass).length == 0) {

            // This is first note
            thisNoteTop = options.top;

        } else {

            // There are pre-existing notes; get tops and bottoms
            $('.'+options.noteClass).each(function(){
                var currNote = $(this);
                var currPosition = currNote.offset();
                var currTop = currPosition.top;
                var currHeight = currNote.height();
                var currBorderWidth = parseInt(currNote.css('border-top-width')) + parseInt(currNote.css('border-bottom-width'));
                var currPadding = parseInt(currNote.css('padding-top')) + parseInt(currNote.css('padding-bottom'));
                var currBottom = currTop + currHeight + currBorderWidth + currPadding;
                // currNote.find('.grumbleTitle').text('top:'+currTop+', bottom:'+currBottom);
                tops.push(currTop);
                bottoms.push(currBottom);
            });
            
            // Sort tops and bottoms numerically (otherwise, they'll be in DOM order)
            tops.sort(function(a, b){return a-b});
            bottoms.sort(function(a, b){return a-b});
            
            // Loop through tops and bottoms looking for a space big enough for the new note
            for (var i=0; i < tops.length; i++) {
                var space = tops[i] - bottoms[i];
                if (space > spaceNeeded) {
                    thisNoteTop = bottoms[i];
                    if (i == 0) {
                        // thisNoteTop += options.top;
                    } else {
                        thisNoteTop += options.spacing;
                    }
                    break;
                }
            }
            
            // If we didn't find a space, tack this note on after the bottom of the last one
            if (thisNoteTop == undefined) {
                lastBottom = bottoms.pop();
                thisNoteTop = lastBottom + options.spacing;
            }
            
        }

        // Add the css class
        thisNote.addClass(options.noteClass);
        
        // Remove any scroll value ands set the top postion
        thisNoteTop = thisNoteTop - window.scrollY;
        thisNote.css({top: thisNoteTop});
        
        // Set the hover functions
        thisNote.data('mouseOver', false);
        thisNote.hover(
            function(){
                thisNote.data('mouseOver', true);
            }, 
            function(){
                thisNote.data('mouseOver', false);
            }
        );

        // Add onclick handler
        thisNote.click(function(){
            thisNote.data('mouseOver', false);
            removeNote(thisNote);
        });
        
        // Fade the note in
        thisNote.fadeIn(options.fadeInSpeed, function(){
            if (!options.sticky) {
                setTimeout(removeNote, options.duration, thisNote);
            }
        });
        
    }
    
    // Return public items
    return {
        defaults:defaults,
        show:show
    }
    
}(jQuery);