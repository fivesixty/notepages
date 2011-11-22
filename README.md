# Notepages

This is the source code behind [notepag.es][0], a page site designed to allow quick, technical documents to be written online, without access to a LaTeX distribution or editor such as LyX. The main formatting of the documents is done in Markdown, and maths can be embedded using LaTeX format.

This repository contains the development version, which is available at [dev.notepag.es][dev] and runs on the same database. The development version is deployed to live when it has been shown sufficiently stable.

  [0]: http://notepag.es/introduction
  [dev]: http://dev.notepag.es/introduction

## Dependencies

The Notepages server is built upon [Node.js][1]/[MongoDB][2], and uses the [Express][3] and [Mongoose][4] libraries. Both libraries are available through `npm`. Bundled libraries are [quickdiff][5] (created for notepages), and [mdext][7] (a showdown fork).

    npm install express mongoose jade sass underscore redis
    
The client editor uses the [Ace][8] editor by Mozilla/Ajax.org with a custom MarkdownMode. Some icons used are from the [Retina Display Icon Set](http://blog.twg.ca/2010/11/retina-display-icon-set/). Editor icons are from the Fugue set, Copyright © [Yusuke Kamiyamane](http://p.yusukekamiyamane.com/).

To clone the repo and all its submodules:

    git clone --recursive https://github.com/fivesixty/notepages.git
    
The database configuration is trivial and at the top of the `server.js` file. Running `node server.js` will start the server listening on port 8080 or 8888 depending on what I pushed last.

  [1]: http://nodejs.org
  [2]: http://www.mongodb.org/
  [3]: https://github.com/visionmedia/express
  [4]: https://github.com/LearnBoost/mongoose
  [5]: https://github.com/c-spencer/quickdiff
  [7]: https://github.com/fivesixty/mdext
  [8]: https://github.com/ajaxorg/ace

### CDN Content

Notepages serves the MathJax, Google Font API, and jQuery through their respective CDNs.

## Browser Support

Reading and editing has been tested across all modern browsers (IE9, Safari 5, Chrome, Firefox 3.6/4). IE6 is not supported. IE7/8 should be able to read, though will not have code highlighting, and the edit experience will be haphazard. Chrome Frame is set to be enabled for users of IE8 or lower, but does not currently prompt for install.

## Mobile support

A mobile version is served to detected browsers, using jQuery Mobile Alpha 3. It has been tested on iPad/iPhone browsers. Reading experience is good on the iPad, somewhat constrained on the iPhone due to width. Editing is buggy due to alpha status of jQuery mobile., but functional.

#### Mobile support is currently not supported in development, and will be moving to a read-only state pending finding suitable input arrangements.

## Printing

A print stylesheet is served which formats the document in a print friendly manner. Exporting of pages is not self-supported, but Print-to-PDF functionality of most browsers works as expected.

## Syntax

Notepag.es supports Markdown, but does not allow arbitrary HTML. HTML markup can still be used, but only insofar as elements that can naturally be created with markdown syntax.

Some extensions to markdown syntax have been provided, at this time: tables and figures. Tables are a port of the [PHP Markdown Extra syntax][mdextra]. Figures allow an optional `>` or `<` after the `!` when defining an image. `<` indicates a left floated figure, and `>` indicates right floated. The caption used will be the title of the image, which can be defined in two ways (standard markdown):

    !>[right alt](http://image.url "right caption")
    !<[left alt][lefturl]
    
      [lefturl]: http://image.url "left caption"
      
  [mdextra]: http://michelf.com/projects/php-markdown/extra/#table