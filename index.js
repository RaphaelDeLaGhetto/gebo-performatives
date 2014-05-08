
var fs = require('fs'),
    mime = require('mime');

/**
 * gebo-performatives
 *
 * 2014 Daniel Bidulock
 * MIT
 */

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

    return boundary + CRLF;
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
    // This is called from exports so that the tests
    // can spoof the function call
    var boundary = exports.getMultipartBoundary();
    var formData = boundary;
    var error = false;

    var keys = Object.keys(message);
    keys.forEach(function(key) {
        if (key.toLowerCase() === 'content') {
          formData += 'Content-Disposition: form-data; name="' + key + '"' + CRLF + CRLF + JSON.stringify(message[key]) + CRLF + boundary;
        }
        else if (key.toLowerCase() === 'files') {
          var files = Object.keys(message.files);
          files.forEach(function(file) {
                try {
                  var data = fs.readFileSync(message.files[file].path);
                  formData += 'Content-Disposition: form-data; name="' + file + '"; filename="' + message.files[file].name + '"' + CRLF;
                  formData += 'Content-Type: ' + mime.lookup(message.files[file].path) + CRLF + CRLF;
                  formData += data + CRLF + boundary;
                }
                catch (err) {
                  error = true;
                  done(message.files[file].path + ' does not exist', null);
                }
            });          
        }
        else {
          formData += 'Content-Disposition: form-data; name="' + key + '"' + CRLF + CRLF + message[key] + CRLF + boundary;
       }
      });

    if (!error) {
      done(null, formData);
    }
  };
exports.makeMultipartBody = _makeMultipartBody;

