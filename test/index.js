var fs = require('fs'),
    performative = require('..');

var ACCESS_TOKEN = '1234';

var MESSAGE = {
        sender: 'daniel@capitolhill.ca',
        receiver: 'agent@capitolhill.ca',
        performative: 'request',
        action: 'greeting',
        gebo: 'https://agent.capitolhill.ca',
        access_token: ACCESS_TOKEN,
    };

var CONTENT = {
        resource: 'resumes',
        format: 'json'
    };
 
var FILES = {
        picture: {
            name: 'Phil_Truong_Resume.doc',
            type: 'application/msword',
            size: 37888
        }
    };

var BOUNDARY = '--SomeBoundary';

/**
 * getMultipartBoundary
 */
exports.getMultipartBoundary = {
    'Return a random string of default length prefixed with "--"': function(test) {
        test.expect(3);
        var boundary = performative.getMultipartBoundary();
        test.equal(boundary.length, 74);
        test.equal(boundary.indexOf('--'), 0);
        test.equal(boundary.indexOf('\r\n'), 72);
        test.done();
    },

    'Return a random string of the length specified prefixed with "--"': function(test) {
        test.expect(3);
        var boundary = performative.getMultipartBoundary(16);
        test.equal(boundary.length, 20);
        test.equal(boundary.indexOf('--'), 0);
        test.equal(boundary.indexOf('\r\n'), 18);
        test.done();
    },

    'Return a random string of the max length (70) prefixed with "--"': function(test) {
        test.expect(3);
        var boundary = performative.getMultipartBoundary(70);
        test.equal(boundary.length, 74);
        test.equal(boundary.indexOf('--'), 0);
        test.equal(boundary.indexOf('\r\n'), 72);
        test.done();
    },

    'Throw an expection when max length is exceeded': function(test) {
        test.expect(1);
        try {
            var boundary = performative.getMultipartBoundary(71);
        }
        catch (err) {
          test.equal(err, 'Boundary length exceeded');
        }
        test.done();
    },

    'Throw an expection when given a negative length': function(test) {
        test.expect(1);
        try {
            var boundary = performative.getMultipartBoundary(-1);
        }
        catch (err) {
          test.equal(err, 'Boundary cannot have negative length');
        }
        test.done();
    },

    'Return appropriately when zero length is specified': function(test) {
        test.expect(3);
        var boundary = performative.getMultipartBoundary(0);
        test.equal(boundary.length, 4);
        test.equal(boundary.indexOf('--'), 0);
        test.equal(boundary.indexOf('\r\n'), 2);
        test.done();
    },

};

/**
 * makeMultipartBody
 */
exports.makeMultipartBody = {
    setUp: function(callback) {
        this._performative = performative.getMultipartBoundary();
        performative.getMultipartBoundary = function() {
            return BOUNDARY;
          };

        /**
         * Write a file to /tmp to test uploads
         */
        fs.writeFile('/tmp/psalm90-12.txt', 'Teach us to number our days,\nthat we may gain a heart of wisdom.\n-- Psalm 90:12', function(err) {
            if (err) {
              console.log('Could not write to /tmp', err);
            }
            callback();
          });
    },

    tearDown: function(callback) {
        performative.getMultipartBoundary = this._performative;
        callback();
    },

    'Take a simple JSON formatted gebo message and return the body for a multipart/form-data POST': function(test) {
        test.expect(1);

        var expected = 'Content-Disposition: form-data; name="sender"\r\n\r\ndaniel@capitolhill.ca' + BOUNDARY +
                       'Content-Disposition: form-data; name="receiver"\r\n\r\nagent@capitolhill.ca' + BOUNDARY +
                       'Content-Disposition: form-data; name="performative"\r\n\r\nrequest' + BOUNDARY +
                       'Content-Disposition: form-data; name="action"\r\n\r\ngreeting' + BOUNDARY +
                       'Content-Disposition: form-data; name="gebo"\r\n\r\nhttps://gebo.capitolhill.ca' + BOUNDARY +
                       'Content-Disposition: form-data; name="access_token"\r\n\r\n' + ACCESS_TOKEN + BOUNDARY;

        var body = performative.makeMultipartBody(MESSAGE);
        test.equal(body, expected);
        test.done();
    },
};

