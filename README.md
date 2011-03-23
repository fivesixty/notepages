# Notepages

This is the source code behind [notepag.es][0], a page site designed to allow quick, technical documents to be written online, without access to a LaTeX distribution or editor such as LyX. The main formatting of the documents is done in Markdown, and maths can be embedded using LaTeX format.

  [0]: http://notepag.es/introduction

##Dependencies

Notepages is built upon [Node.js][1]/[MongoDB][2], and uses the [Grasshopper][3] and [Mongoose][4] libraries. Both libraries are available through `npm`. Bundled libraries are [quickdiff][5] (created for notepages) and [grumble][6].

The server is expected to be run behind a webserver proxy (such as nginx), and for requests into the assets directory are served by the front end.

The database configuration is trivial and at the top of the `server.js` file. Running `node server.js` will start the server listening on port 8080.

  [1]: http://nodejs.org
  [2]: http://www.mongodb.org/
  [3]: https://github.com/tuxychandru/grasshopper
  [4]: https://github.com/LearnBoost/mongoose
  [5]: https://github.com/c-spencer/quickdiff
  [6]: http://plugins.jquery.com/project/grumble

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

### CDN Content

Notepages serves the MathJax, Google Font API, and jQuery through their respective CDNs.

## Browser Support

Reading and editing has been tested across all major browsers (IE7/8, Safari, Chrome, Firefox). Reading has been tested on mobile Safari and works, but page editing is not currently friendly to a mobile browser.

## Printing

A print stylesheet is served which formats the document in a print friendly manner. Exporting of pages is not self-supported, but Print-to-PDF functionality of most browsers works as expected.

## Syntax

Notepag.es supports Markdown, but does not allow arbitrary HTML. HTML markup can still be used, but only insofar as elements that can naturally be created with markdown syntax. Future work is planned to provide syntax for common additional elements such as tables, footnotes, and captioned figures.