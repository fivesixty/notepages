define('notepages/notify', function(require, exports, module) {

function Notify(element) {
  this.element = element;
  this.timer = null;
  this.cancel = null;
  this.ondisplay = null;
}

(function () {
  
  this.setFade = function (delay) {
    var self = this;
    this.timer = setTimeout(function () {
      self.element.hide("slide", {direction:"up"});
      self.timer = null;
    }, delay);
  }
  
  this.onDisplay = function (callback) {
    this.ondisplay = callback;
  }
  
  this.display = function (cssclass, contents, on_display) {
    var self = this;
    
    this.conceal();
    this.element.empty().removeClass().addClass(cssclass);
    
    this.ondisplay.call(this.element);
      
    $.each(contents, function (i, el) {
      self.element.append(el);
    });
    
    if (this.element.is(":visible")) {
      this.element.stop(true, true).show();
      if (this.timer) {
        clearTimeout(this.timer);
      }
      if (on_display) {
        on_display();
      }
    } else {
      this.element.show("slide", {direction: "up"}, function () {
        if (on_display) {
          on_display();
        }
      });
    }
  }
  
  this.conceal = function () {
    if (this.cancel) {
      this.cancel();
      this.cancel = null;
    }
    this.element.hide();
    return this;
  }
  
  this.showMessage = function (text, icon) {
    var self = this;
    this.display(icon, $("<span class=\"message\"></span>").text(text), function () {
      self.setFade(1500);
    });
  }
  
  this.showConfirm = function (text, confirm_cb, cancel_cb) {
    var self = this;
    var confirm = $('<input type="submit" value="continue"></input>')
        .click(function (e) {
          e.preventDefault();
          
          self.setFade(0);
          if (confirm_cb) {
            confirm_cb();
          }
        }),
      cancel = $('<input type="button" value="cancel"></input>')
        .click(function (e) {
          e.preventDefault();
          
          self.setFade(0);
          if (cancel_cb) {
            cancel_cb();
          }
        }),
      form = $('<form>').append(cancel).append(confirm),
      buttons = $('<span class="buttons"></span>').append(form),
      content = $("<span class=\"confirm\"></span>")
        .text(text);
        
    this.display("help", [content, buttons], function () {
      confirm.focus();
    });
    confirm.focus();
    
    this.cancel = function () {
      if (cancel_cb) {
        cancel_cb();
      }
    }
  }
  
  this.showPassword = function (text, password_cb) {
    var self = this;
    
    var passbox = $('<input type="password"></input>'),
      confirm = $('<input type="submit" value="continue"></input>')
        .click(function (e) {
          e.preventDefault();
          if (confirm) {
            password_cb(passbox.val());
            self.setFade(0);
          }
        }),
      cancel = $('<input type="button" value="cancel"></input>')
        .click(function (e) {
          e.preventDefault();
          self.setFade(0);
        }),
      form = $('<form>').append(passbox).append(cancel).append(confirm),
      buttons = $('<span class="buttons"></span>').append(form),
      content = $("<span class=\"confirm\"></span>")
        .text(text);

    this.display("help", [content, buttons], function () {
      passbox.focus();
    });
    passbox.focus();
  }
  
}).call(Notify.prototype);

exports.Notify = Notify;
});