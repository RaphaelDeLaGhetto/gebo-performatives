var extend = require('extend'),
    fs = require('fs'),
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
        resource: 'greetings',
        mood: 'friendly'
    };
 
var FILES = {
        scripture: {
            name: 'psalm90-12.txt',
            path: '/tmp/psalm90-12.txt',
            type: 'text/plain',
            size: 79,
        }
    };

var BOUNDARY = '--SomeBoundary\r\n';

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
          test.ok(false);
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
          test.ok(false);
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
        this._oldFunc = performative.getMultipartBoundary;
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
        performative.getMultipartBoundary = this._oldFunc;
        callback();
    },

    'Take a simple JSON formatted gebo message and return the body for a multipart/form-data POST': function(test) {
        test.expect(1);

        var expected = BOUNDARY +
                       'Content-Disposition: form-data; name="sender"\r\n\r\ndaniel@capitolhill.ca\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="receiver"\r\n\r\nagent@capitolhill.ca\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="performative"\r\n\r\nrequest\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="action"\r\n\r\ngreeting\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="gebo"\r\n\r\nhttps://agent.capitolhill.ca\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="access_token"\r\n\r\n' + ACCESS_TOKEN + '\r\n' + BOUNDARY.trim() + '--';

        performative.makeMultipartBody(MESSAGE, function(err, body) {
            test.equal(body, expected);
            test.done();               
          });
    },

    'Take a gebo message with content and return the body for a multipart/form-data POST': function(test) {
        test.expect(3);

        var message = {};
        extend(true, message, MESSAGE);
        message.content = {};
        extend(true, message.content, CONTENT);

        test.equal(message.content.resource, 'greetings');
        test.equal(message.content.mood, 'friendly');

        var expected = BOUNDARY +
                       'Content-Disposition: form-data; name="sender"\r\n\r\ndaniel@capitolhill.ca\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="receiver"\r\n\r\nagent@capitolhill.ca\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="performative"\r\n\r\nrequest\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="action"\r\n\r\ngreeting\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="gebo"\r\n\r\nhttps://agent.capitolhill.ca\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="access_token"\r\n\r\n' + ACCESS_TOKEN + '\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="content"\r\n\r\n' + JSON.stringify(CONTENT) + '\r\n' + BOUNDARY.trim() + '--';

        performative.makeMultipartBody(message, function(err, body) {
            test.equal(body, expected);
            test.done();               
          });
    },

    'Take a gebo message with a file and return the body for a multipart/form-data POST': function(test) { test.expect(1);

        var message = MESSAGE;
        message.files = FILES;

        var message = {};
        extend(true, message, MESSAGE);
        message.files = {};
        extend(true, message.files, FILES);

        var data = fs.readFileSync('/tmp/psalm90-12.txt');

        var expected = BOUNDARY +
                       'Content-Disposition: form-data; name="sender"\r\n\r\ndaniel@capitolhill.ca\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="receiver"\r\n\r\nagent@capitolhill.ca\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="performative"\r\n\r\nrequest\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="action"\r\n\r\ngreeting\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="gebo"\r\n\r\nhttps://agent.capitolhill.ca\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="access_token"\r\n\r\n' + ACCESS_TOKEN + '\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="scripture"; filename="psalm90-12.txt"\r\n' + 
                       'Content-Type: text/plain\r\n\r\n' + data + '\r\n' +  BOUNDARY.trim() + '--';

        performative.makeMultipartBody(message, function(err, body) {
            test.equal(body, expected);
            test.done();               
          });
    },

    'Take a gebo message with a file and content and return the body for a multipart/form-data POST': function(test) {
        test.expect(1);

        var message = {};
        extend(true, message, MESSAGE);
        message.content = {};
        extend(true, message.content, CONTENT);
        message.files = {};
        extend(true, message.files, FILES);

        var data = fs.readFileSync('/tmp/psalm90-12.txt');

        var expected = BOUNDARY +
                       'Content-Disposition: form-data; name="sender"\r\n\r\ndaniel@capitolhill.ca\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="receiver"\r\n\r\nagent@capitolhill.ca\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="performative"\r\n\r\nrequest\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="action"\r\n\r\ngreeting\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="gebo"\r\n\r\nhttps://agent.capitolhill.ca\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="access_token"\r\n\r\n' + ACCESS_TOKEN + '\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="scripture"; filename="psalm90-12.txt"\r\n' + 
                       'Content-Type: text/plain\r\n\r\n' + data + '\r\n' +  BOUNDARY +
                       'Content-Disposition: form-data; name="content"\r\n\r\n' + JSON.stringify(CONTENT) + '\r\n' + BOUNDARY.trim() + '--';

        performative.makeMultipartBody(message, function(err, body) {
            test.equal(body, expected);
            test.done();               
          });
    },

    'Take a gebo message with multiple files and return the body for a multipart/form-data POST': function(test) {
        test.expect(1);

        var message = {};
        extend(true, message, MESSAGE);
        message.files = {};
        extend(true, message.files, FILES);
        message.files.samePassage = {
            name: 'psalm90-12.txt',
            path: '/tmp/psalm90-12.txt',
            type: 'text/plain',
            size: 79,
        };

        var data = fs.readFileSync('/tmp/psalm90-12.txt');

        var expected = BOUNDARY +
                       'Content-Disposition: form-data; name="sender"\r\n\r\ndaniel@capitolhill.ca\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="receiver"\r\n\r\nagent@capitolhill.ca\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="performative"\r\n\r\nrequest\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="action"\r\n\r\ngreeting\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="gebo"\r\n\r\nhttps://agent.capitolhill.ca\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="access_token"\r\n\r\n' + ACCESS_TOKEN + '\r\n' + BOUNDARY +
                       'Content-Disposition: form-data; name="scripture"; filename="psalm90-12.txt"\r\n' + 
                       'Content-Type: text/plain\r\n\r\n' + data + '\r\n' +  BOUNDARY +
                       'Content-Disposition: form-data; name="samePassage"; filename="psalm90-12.txt"\r\n' + 
                       'Content-Type: text/plain\r\n\r\n' + data + '\r\n' +  BOUNDARY.trim() + '--';

        performative.makeMultipartBody(message, function(err, body) {
            test.equal(body, expected);
            test.done();               
          });
    },

    'Return error if file provided does not exist': function(test) {
        test.expect(2);

        var message = {};
        extend(true, message, MESSAGE);
        message.files = {};
        extend(true, message.files, FILES);
        message.files.scripture.path = '/no/such/path/toThisFile.txt';
    
        performative.makeMultipartBody(message, function(err, body) {
            test.equal(body, null);
            test.equal(err, '/no/such/path/toThisFile.txt does not exist');
            test.done();               
          });
    },

};

