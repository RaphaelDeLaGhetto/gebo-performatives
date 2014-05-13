'use strict';
/**
 * gebo-performatives
 *
 * 2014 Daniel Bidulock
 * MIT
 */

module.exports = function() {
    var fs = require('fs'),
        https = require('https'),
        mime = require('mime');
    
    /**
     * Form data lines terminate with this for some reason
     */
    var CRLF = '\r\n';
    
    /**
     * Is a maximum length necessary?
     */
    var MAX_LENGTH = 70;
    
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
        var boundary = '--';
    
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
    
        //return '---------------------------10102754414578508781458777923';
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
                      body = Buffer.concat([body,
                                  new Buffer('Content-Disposition: form-data; name="' +
                                              file + '"; filename="' + message.files[file].name + '"' + CRLF),
                                  new Buffer('Content-Type: application/octet-stream' + CRLF + CRLF),
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
 
//    function _makeMultipartBody(message, done) {
//        var boundary = exports.getMultipartBoundary();
//        var formData = boundary;
//        var error = false;
//    
//        var keys = Object.keys(message);
//        keys.forEach(function(key) {
//            if (key.toLowerCase() === 'content') {
//              formData += 'Content-Disposition: form-data; name="' + key + '"' + CRLF + CRLF + JSON.stringify(message[key]) + CRLF + boundary;
//            }
//            else if (key.toLowerCase() === 'files') {
//              var files = Object.keys(message.files);
//              files.forEach(function(file) {
//                    try {
//                      var data = fs.readFileSync(message.files[file].path);
//                      formData += 'Content-Disposition: form-data; name="' + file + '"; filename="' + message.files[file].name + '"' + CRLF;
//                      //formData += 'Content-Type: ' + mime.lookup(message.files[file].path) + CRLF + CRLF;
//                      formData += 'Content-Type: application/octet-stream' + CRLF + CRLF;
//
//                      formData += data + CRLF + boundary;
//                    }
//                    catch (err) {
//                      error = true;
//                      done(message.files[file].path + ' does not exist', null);
//                    }
//                });          
//            }
//            else {
//              formData += 'Content-Disposition: form-data; name="' + key + '"' + CRLF + CRLF + message[key] + CRLF + boundary;
//           }
//          });
//    
//        if (!error) {
//          // Add the closing boundary
//          formData = formData.trim() + '--';
//          // Add the opening CRLF
//          formData = CRLF + formData + '\n';
//          done(null, formData);
//        }
//      };
//    exports.makeMultipartBody = _makeMultipartBody;
    
    
    /**
     * POST a request performative to the gebo provided
     * in the message
     *
     * @param Object
     * @param function
     */
    function _request(message, done) {
        _makeMultipartBody(message, function(err, multipartBody) {
            if (err) {
              done(err, null);
            }
            else {
//              var multipartBody = new Buffer(str);
              // Is this too hacky? I just need the boundary,
              // which is prefixed with a CRLF
              var boundary = multipartBody.slice(2, MAX_LENGTH).toString();
              boundary = boundary.slice(0, boundary.indexOf(CRLF));
              //var boundary = multipartBody.slice(0, str.indexOf(CRLF, 2)).trim();
    
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
                    var data = '';
                    res.setEncoding('utf8');
    
                    res.on('data', function(chunk) {
                        data += chunk;
                      });
    
                    res.on('end', function(err) {
                          if (err) {
                            done(err);
                          }
                          else {
                            done(null, data);
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
