'use strict';
/**
 * gebo-performatives
 *
 * Daniel Bidulock
 * MIT
 */

module.exports = function() {
    var fs = require('fs'),
        https = require('https'),
        mime = require('mime'),
        path = require('path');
    
    /**
     * Form data lines terminate with this for some reason
     */
    var CRLF = '\r\n';
    
    /**
     * Maximum multipart boundary length.
     * This says you can push it to 70 in total
     * http://www.ietf.org/rfc/rfc2046.txt
     */
    var MAX_LENGTH = 40;
    
    /**
     * Alphanumerics
     */
    var POSSIBLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    
    /**
     * Get the boundary marker for multipart/form-data of the
     * specified length
     *
     * @param int
     *
     * @return string
     */
    function _getMultipartBoundary(length) {
        var boundary = '--Peace';
    
        if (typeof length === undefined || length == null) {
          length = MAX_LENGTH;
        }
        else if (length < 0) {
          throw 'Boundary cannot have negative length';
        }
        else if (length > MAX_LENGTH) {
          throw 'Boundary length exceeded';
        }
    
        for (var i = 0; i < length; i++) {
          boundary += POSSIBLE.charAt(Math.floor(Math.random() * POSSIBLE.length));
        }
    
        return boundary;
      };
    exports.getMultipartBoundary = _getMultipartBoundary;
    
    
    /**
     * Take a standard gebo message and present it as 
     * multipart/form-data.
     *
     * @param Object
     * @param callback
     */
    function _makeMultipartBody(message, done) {
        var error = false;

        // Called from exports for testing purposes 
        var boundary = exports.getMultipartBoundary();
        var delimiter = CRLF + "--" + boundary;
        var closeDelimiter = delimiter + "--";

        var body = new Buffer(delimiter + CRLF);

        var keys = Object.keys(message);
        keys.forEach(function(key) {
            if (key.toLowerCase() === 'content') {
              body = Buffer.concat([body,
                                    new Buffer('Content-Disposition: form-data; name="content"' +
                                                CRLF + CRLF + JSON.stringify(message.content))]);
              body = Buffer.concat([body, new Buffer(delimiter + CRLF)]);
            }
            else if (key.toLowerCase() === 'files') {
              var files = Object.keys(message.files);
              files.forEach(function(file) {
                    try {
                      var data = fs.readFileSync(message.files[file].path);
                      var filename = message.files[file].path.split(path.sep).pop();
                      body = Buffer.concat([body,
                                  new Buffer('Content-Disposition: form-data; name="' +
                                              file + '"; filename="' + filename + '"' + CRLF),
                                  new Buffer('Content-Type: ' + mime.lookup(filename) + CRLF + CRLF),
                                  data,
                            ]);
                      body = Buffer.concat([body, new Buffer(delimiter + CRLF)]);
                    }
                    catch (err) {
                      error = true;
                      done(message.files[file].path + ' does not exist', null);
                    }
                });          
            }
            else {
              body = Buffer.concat([body,
                                    new Buffer('Content-Disposition: form-data; name="'+
                                                key +'"' + CRLF + CRLF + message[key])]);
              body = Buffer.concat([body, new Buffer(delimiter + CRLF)]);
            }
          });


        // Add the closing boundary
        body = Buffer.concat([ 
                        body.slice(0, body.length - new Buffer(delimiter + CRLF).length),
                        new Buffer(closeDelimiter)
                    ]);

        if (!error) {
          done(null, body);
        }
      };
    exports.makeMultipartBody = _makeMultipartBody;
 
    /**
     * POST a request performative to the gebo provided
     * in the message
     *
     * @param Object
     * @param boolean
     * @param function
     */
    function _request(message, returnBuffer, done) {
        if (typeof returnBuffer === 'function') {
          done = returnBuffer;
          returnBuffer = false;
        }
        _makeMultipartBody(message, function(err, multipartBody) {
            if (err) {
              done(err, null);
            }
            else {
              // Is this too hacky? I just need the boundary,
              // which is prefixed with a CRLF
              var boundary = multipartBody.slice(2, MAX_LENGTH*2).toString();
              boundary = boundary.slice(0, boundary.indexOf(CRLF));
    
              var options = {
                        hostname: message.gebo.replace(/^http[s]:\/\//i, ''),
                        port: 443,
                        path: '/perform',
                        method: 'POST',
                        rejectUnauthorized: false,
                        headers: { 'Content-Type': 'multipart/form-data; boundary=' + boundary.replace(/^--/, ''),
                                   'Content-Length': multipartBody.length },
                  };
    
              var req = https.request(options, function(res) {
                    if (returnBuffer) {
                      var data = [];
                    }
                    else {
                      var data = '';
                      res.setEncoding('utf8');
                    }
    
                    res.on('data', function(chunk) {
                        if (returnBuffer) {
                          data.push(chunk);
                        }
                        else {
                          data += chunk;
                        }
                      });
    
                    res.on('end', function(err) {
                          if (err) {
                            done(err);
                          }
                          else {
                            if (returnBuffer) {
                              var buffer = new Buffer(data.reduce(function(prev, current) {
                                    return prev.concat(Array.prototype.slice.call(current));
                                }, []));
                              done(null, buffer);
                            }
                            else {
                              done(null, data);
                            }
                          }
                      });
                });
    
              req.on('error', function(err) {
                    done(err);
                });
    
              req.write(multipartBody);
              req.end();
            }
          });
      };
    exports.request = _request;

    return exports;
}();
