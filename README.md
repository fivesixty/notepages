# Notepages

This is the source code behind [notepag.es][0], a page site designed to allow quick, technical documents to be written online, without access to a LaTeX distribution or editor such as LyX. The main formatting of the documents is done in Markdown, and maths can be embedded using LaTeX format.

  [0]: http://notepag.es/introduction

##Dependencies

Notepages is built upon [Node.js][1]/[MongoDB][2], and uses the [Grasshopper][3] and [Mongoose][4] libraries. Both libraries are available through `npm`. The server is expected to be run behind a webserver proxy (such as nginx), and for requests into the assets directory are served by the front end.

The database configuration is trivial and at the top of the `server.js` file. Running `node server.js` will start the server listening on port 8080.

  [1]: http://nodejs.org
  [2]: http://www.mongodb.org/
  [3]: https://github.com/tuxychandru/grasshopper
  [4]: https://github.com/LearnBoost/mongoose

### Sample nginx configuration

    server {
      server_name notepag.es;
      location /assets {
        root /home/www/notepages/;
      }
      location / {
        proxy_pass http://127.0.0.1:8080/;
      }
    }
