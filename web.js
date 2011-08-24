// Horrible web server from
// http://thecodinghumanist.com/blog/archives/2011/5/6/serving-static-files-from-node-js
var http = require('http');
var fs = require('fs');
var path = require('path');

var port = process.env.PORT || 3000;

http.createServer(function (request, response) {
                    
  var filePath = '.' + request.url;
  if (filePath == './')
    filePath = './index.html';
  
  var extname = path.extname(filePath);
  var contentType = 'text/html';
  switch (extname) {
  case '.js':
    contentType = 'text/javascript';
    break;
  case '.css':
    contentType = 'text/css';
    break;
  }
  
  path.exists(filePath, function(exists) {
    
    if (exists) {
      fs.readFile(filePath, function(error, content) {
        if (error) {
          response.writeHead(500);
          response.end('500 Server error');
        }
        else {
          response.writeHead(200, { 'Content-Type': contentType });
          response.end(content, 'utf-8');
        }
      });
    }
    else {
      response.writeHead(404);
      response.end('404 File not found');
    }
  });
  
}).listen(port, function() {
  console.log("Listening on " + port);
});
