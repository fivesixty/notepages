var express = require('express')
  , markdown = new (require('./public/lib/mdext/src/showdown').Showdown.converter)()
  , mongoose = require('mongoose')
  , _ = require('underscore')
  , app = module.exports = express.createServer();

// By default Jade will kill itself inside a MathJax configuration script
// So we need this filter

require('jade').filters.protect = function (text) { return text; }

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  //app.use(express.methodOverride());
  //app.use(express.cookieParser());
  //app.use(express.session({ secret: 'your secret here' }));
  //app.use(express.compiler({ src: __dirname + '/public', enable: ['sass'] }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public', { maxAge: 7*24*60*60*1000 })); // 1 week cache
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Configure the markdown parser

_.extend(markdown.config, {
  stripHTML: true,
  tables: true,
  math: true,
  figures: true,
  refprint: true,
  github_flavouring: true
});

// Mongoose connection and Model

mongoose.connect('mongodb://localhost/techpages');

var PageSchema = new mongoose.Schema({
  iden : { type: String, index: { unique: true } },
  text : String,
  hash : String
});
mongoose.model('Page', PageSchema);

var PageModel = mongoose.model('Page');

// Utility functions for generating random URL and mobile detection

function rstring(len) {
  var text = "", possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for( var i=0; i < 6; i++ ) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function isMobileBrowser(useragent) {
  return (/android|avantgo|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od|ad)|iris|kindle|lge |maemo|midp|mmp|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(useragent)
  ||
  /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|e\-|e\/|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(di|rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|xda(\-|2|g)|yas\-|your|zeto|zte\-/i.test(useragent.substr(0,4)));
}

// Middleware for processing page id and extension

function prePage(req, res, next) {
  req.params.id = req.params[0];
  if (req.params[1] !== undefined) {
    req.params.extn = req.params[1];
  } else {
    req.params.extn = "html";
  }
  next();
}

// Routes

app.get('/', function(req, res) {  
  res.render("front", {randid: rstring(6)});
});

app.post(/^\/([a-zA-Z0-9_-]{2,})\.?(json)?$/, prePage, express.bodyParser(), function(req, res, next) {
  PageModel.findOne({iden: req.params.id}, function (err, post) {
    if (err) {
      res.send({status:"failure", message:"Internal error."}, 500);
      return;
    } else if (post) {  
      if ((req.body.password || (post.hash !== "false")) && (post.hash !== req.body.password)) {
        res.send({status:"failure",message:"Invalid password."}, 403);
      } else {
        post.text = req.body.text;
        post.save(function(err) {
          if (!err) res.send({status:"success",message:"Page updated."}, 200);
          console.log("Updated " + post.iden + ".");
        });
      }
    } else {
      post = new PageModel();
      post.iden = req.params.id;
      post.text = req.body.text;
      if (req.body.password) {
        post.hash = req.body.password;
      } else {
        post.hash = false;
      }
      post.save(function (err) {
        if (!err) res.send({status:"success",message:"Page created."}, 200);
        console.log("Created " + post.iden + ".");
      });
    }
  });
});

app.get(/^\/([a-zA-Z0-9_-]{2,})\.?(json)?$/, prePage, function(req, res, next) {
  var page = {
    pagename: req.params.id
  }
  
  PageModel.findOne({iden: req.params.id}, function (err, post) {
    if (err) {
      res.send("Something went wrong.", 500);
      return;
    }
    
    if (post && post.hash !== "false") {
      page.passreq = "true";
    } else {
      page.passreq = "false";
    }
    
    if (!err && post) {
      if (req.params.extn === "json") {
        console.log("Returned " + page.pagename + " as json.");
        res.send({text:post.text});
        return;
      } else {
        page.editing = "false";
        page.content = markdown.makeHtml(post.text);
      }
    } else {
      page.editing = "true";
      page.content = "";
    }
    
    if (req.headers["user-agent"] && isMobileBrowser(req.headers["user-agent"])) {
      console.log("Rendered " + page.pagename + " for mobile. (new: " + page.editing + ")");
      res.render('mobile', { page: page });
    } else {
      console.log("Rendered " + page.pagename + " for browser. (new: " + page.editing + ")");
      res.render('page', { page: page });
    }
  });
});

// Start the server

if (!module.parent) {
  app.listen(8888);
  console.log("Express server listening on port %d", app.address().port);
}