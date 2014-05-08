
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
 * @return string
 */
function _makeMultipartBody(message) {

  };
exports.makeMultipartBody = _makeMultipartBody;

