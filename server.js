var gh = require('grasshopper')
  , sd = new (require('./assets/showdown').Showdown.converter)()
  , mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/techpages');

var PageSchema = new mongoose.Schema({
  iden : { type: String, index: { unique: true } },
  text : String,
  pass : String
});
mongoose.model('Page', PageSchema);

var PageModel = mongoose.model('Page');

function rstring(len) {
  var text = "", possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for( var i=0; i < 6; i++ ) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function block_invalid(conn, id, protocols) {
  if (protocols.indexOf(conn.extn) < 0) {
    conn.renderError(404);
    return true;
  } else if (!/^[a-zA-Z0-9_-]*$/.test(id)) {
    conn.renderText(JSON.stringify({status:"failure",message:"Invalid page name (only alphanumeric_- allowed)."}));
    return true;
  }
  return false;
}

gh.get('/', function() {  
  this.redirect(rstring(6));
});

gh.post('/{id}', function(args) {
  if (block_invalid(this, args.id, ["json"])) return;
  
  var conn = this;
  PageModel.findOne({iden: args.id}, function (err, post) {
    if (err) {
      conn.renderError(403);
      return;
    } else if (post) {
      if ((conn.params.password || post.pass) && (post.pass != conn.params.password)) {
        conn.renderText(JSON.stringify({status:"failure",message:"Invalid password."}));
        return;
      }
      post.text = conn.params.text;
      post.save(function(err) {
        if (!err) conn.renderText(JSON.stringify({status:"success",message:"Page updated."}));
      });
    } else {
      post = new PageModel();
      post.iden = args.id;
      post.text = conn.params.text;
      post.pass = conn.params.password;
      post.save(function (err) {
        if (!err) conn.renderText(JSON.stringify({status:"success",message:"Page created."}));
      });
    }
  });
});

gh.get('/mobile', function () {
  var conn = this;
  PageModel.findOne({iden: "csm2"}, function (err, post) {
    conn.model.editting = "false";
    conn.model.content = sd.makeHtml(post.text);
    conn.model.pagename = "csm2";
    conn.render('mobile');
  });
});

gh.get('/{id}', function(args) {
  if (block_invalid(this, args.id, ["json", "html"])) return;
  
  var conn = this;
  PageModel.findOne({iden: args.id}, function (err, post) {
    if (!err && post) {
      if (conn.extn === "json") {
        conn.renderText(JSON.stringify({text:post.text}));
        return;
      } else {
        conn.model.editting = "false";
        conn.model.content = sd.makeHtml(post.text);
      }
    } else {
      conn.model.editting = "true";
      conn.model.content = "";
    }  
    conn.model.pagename = args.id;
    conn.render('page');
  });
});

gh.serve(8080);