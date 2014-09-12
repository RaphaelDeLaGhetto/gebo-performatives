var assert = require('assert'),
    extend = require('extend'),
    fs = require('fs'),
    https = require('https'),
    performative = require('..');


var ACCESS_TOKEN = '1234';

var BOUNDARY = '--SomeBoundary';

var CONTENT = {
        resource: 'greetings',
        mood: 'friendly'
    };
 
var FILES = {
        scripture: {
            path: '/tmp/psalm90-12.txt',
            type: 'text/plain',
            size: 79,
        }
    };

var MESSAGE = {
        sender: 'daniel@capitolhill.ca',
        receiver: 'agent@capitolhill.ca',
        performative: 'request',
        action: 'greeting',
        gebo: 'https://agent.capitolhill.ca',
        access_token: ACCESS_TOKEN,
    };

// Note the path
var SAMPLE_POST = fs.readFileSync('./test/sample/post.txt', { encoding: 'utf8' }),
    SAMPLE_POST_2 = fs.readFileSync('./test/sample/post2.txt', { encoding: 'utf8' });

/**
 * getMultipartBoundary
 */
exports.getMultipartBoundary = {
    'Return a random string of default length prefixed with "--"': function(test) {
        test.expect(2);
        var boundary = performative.getMultipartBoundary();
        test.equal(boundary.length, 47);
        test.equal(boundary.indexOf('--Peace'), 0);
        test.done();
    },

    'Return a random string of the length specified prefixed with "--"': function(test) {
        test.expect(2);
        var boundary = performative.getMultipartBoundary(16);
        test.equal(boundary.length, 23);
        test.equal(boundary.indexOf('--Peace'), 0);
        test.done();
    },

    'Return a random string of the max length (40) prefixed with "--"': function(test) {
        test.expect(2);
        var boundary = performative.getMultipartBoundary(40);
        test.equal(boundary.length, 47);
        test.equal(boundary.indexOf('--Peace'), 0);
        test.done();
    },

    'Throw an expection when max length is exceeded': function(test) {
        test.expect(1);
        try {
          var boundary = performative.getMultipartBoundary(41);
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
        test.expect(2);
        var boundary = performative.getMultipartBoundary(0);
        test.equal(boundary.length, 7);
        test.equal(boundary.indexOf('--Peace'), 0);
        test.done();
    },

};

/**
 * makeMultipartBody
 */
exports.makeMultipartBody = {

    setUp: function(callback) {
        this._realFunc = performative.getMultipartBoundary;
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
        performative.getMultipartBoundary = this._realFunc;
        callback();
    },

    'Take a simple JSON formatted gebo message and return the body for a multipart/form-data POST': function(test) {
        test.expect(1);

        var expected = '\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="sender"\r\n\r\ndaniel@capitolhill.ca\r\n--' + BOUNDARY + '\r\n' + 
                       'Content-Disposition: form-data; name="receiver"\r\n\r\nagent@capitolhill.ca\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="performative"\r\n\r\nrequest\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="action"\r\n\r\ngreeting\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="gebo"\r\n\r\nhttps://agent.capitolhill.ca\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="access_token"\r\n\r\n' + ACCESS_TOKEN + '\r\n--' + BOUNDARY.trim() + '--';

        console.log(performative.getMultipartBoundary());
        performative.makeMultipartBody(MESSAGE, function(err, body) {
            test.equal(body.toString(), expected);
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

        var expected = '\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="sender"\r\n\r\ndaniel@capitolhill.ca\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="receiver"\r\n\r\nagent@capitolhill.ca\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="performative"\r\n\r\nrequest\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="action"\r\n\r\ngreeting\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="gebo"\r\n\r\nhttps://agent.capitolhill.ca\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="access_token"\r\n\r\n' + ACCESS_TOKEN + '\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="content"\r\n\r\n' + JSON.stringify(CONTENT) + '\r\n--' + BOUNDARY.trim() + '--';

        performative.makeMultipartBody(message, function(err, body) {
            test.equal(body.toString(), expected);
            test.done();               
          });
    },

    'Take a gebo message with a file and return the body for a multipart/form-data POST': function(test) { test.expect(1);
        test.expect(1);

        var message = {};
        extend(true, message, MESSAGE);
        message.files = {};
        extend(true, message.files, FILES);

        var data = fs.readFileSync('/tmp/psalm90-12.txt');

        var expected = '\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="sender"\r\n\r\ndaniel@capitolhill.ca\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="receiver"\r\n\r\nagent@capitolhill.ca\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="performative"\r\n\r\nrequest\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="action"\r\n\r\ngreeting\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="gebo"\r\n\r\nhttps://agent.capitolhill.ca\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="access_token"\r\n\r\n' + ACCESS_TOKEN + '\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="scripture"; filename="psalm90-12.txt"\r\n' + 
                       'Content-Type: application/octet-stream\r\n\r\n' + data + '\r\n--' +  BOUNDARY.trim() + '--';

        performative.makeMultipartBody(message, function(err, body) {
            test.equal(body.toString(), expected);
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

        var expected = '\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="sender"\r\n\r\ndaniel@capitolhill.ca\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="receiver"\r\n\r\nagent@capitolhill.ca\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="performative"\r\n\r\nrequest\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="action"\r\n\r\ngreeting\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="gebo"\r\n\r\nhttps://agent.capitolhill.ca\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="access_token"\r\n\r\n' + ACCESS_TOKEN + '\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="content"\r\n\r\n' + JSON.stringify(CONTENT) + '\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="scripture"; filename="psalm90-12.txt"\r\n' + 
                       'Content-Type: application/octet-stream\r\n\r\n' + data + '\r\n--' +  BOUNDARY.trim() + '--';

        performative.makeMultipartBody(message, function(err, body) {
            test.equal(body.toString(), expected);
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
            path: '/tmp/psalm90-12.txt',
        };

        var data = fs.readFileSync('/tmp/psalm90-12.txt');

        var expected = '\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="sender"\r\n\r\ndaniel@capitolhill.ca\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="receiver"\r\n\r\nagent@capitolhill.ca\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="performative"\r\n\r\nrequest\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="action"\r\n\r\ngreeting\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="gebo"\r\n\r\nhttps://agent.capitolhill.ca\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="access_token"\r\n\r\n' + ACCESS_TOKEN + '\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="scripture"; filename="psalm90-12.txt"\r\n' + 
                       'Content-Type: application/octet-stream\r\n\r\n' + data + '\r\n--' + BOUNDARY + '\r\n' +
                       'Content-Disposition: form-data; name="samePassage"; filename="psalm90-12.txt"\r\n' + 
                       'Content-Type: application/octet-stream\r\n\r\n' + data + '\r\n--' +  BOUNDARY.trim() + '--';

        performative.makeMultipartBody(message, function(err, body) {
            test.equal(body.toString(), expected);
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

    'Generate a POST identical to post.txt in the sample directory': function(test) {
        test.expect(1);

        var message = {};
        extend(true, message, MESSAGE);
        message.content = {};
        extend(true, message.content, CONTENT);
        message.files = {};
        extend(true, message.files,
                        { 
                            myFile: {
                                path: 'test/sample/text.txt',
                            }
                        });

        performative.makeMultipartBody(message, function(err, body) {
            if (err) {
              test.ok(false, err);
            }
            // Not sure if the \n is in the actual post.
            // It is in the sample file, however
            test.equal(body.toString() + '\n', SAMPLE_POST);
            test.done();
          });
    },

    'Generate a POST identical to post2.txt in the sample directory': function(test) {
        test.expect(1);

        performative.getMultipartBoundary = function() {
            return '-----------------------------10102754414578508781458777923';
          };

        var message = {
                sender: 'bob@example.com',    
                receiver: 'resner-agent@hiregroundsoftware.com',
                performative: 'request',      
                action: 'recognize',
                content: {
                    resource: 'resumes',          
                    format: 'json'
                },
                gebo: 'https://192.168.1.241',
                access_token: 'kh69HPPKdyetpfvNPM9MWykEeSRsFDqQhY5uMvBWDibKSfJoVj4U7CaQSwNTN11ac2libeMo2WiQ37Kp2D3epF3aPt1ZY1STHLYv2UEBGCfkrxpcc82WYRw3Rp0nZoXyvlyBcUreppTq1EZge3VaTFjbstK4addNauNc9uaXSeQ43mSWiNcxBNlE34HRDeUbCNKyf0ndCvaH0BBfUUOTZyvul78QhhM8pQRagvpcrhdP2XregEVi2s1TwaaqjFey',
//                access_token: ACCESS_TOKEN,
                files: {
                    resume: {
                        path: 'test/sample/text.txt',
                    },
                },
            };

        performative.makeMultipartBody(message, function(err, body) {
            if (err) {
              test.ok(false, err);
            }
            // Not sure if the \n is in the actual post.
            // It is in the sample file, however
            test.equal(body.toString() + '\n', SAMPLE_POST_2);
            test.done();
          });
    },
};

/**
 * request
 */
exports.request = {

    setUp: function(callback) {

        this._realGetMultipartBoundary = performative.getMultipartBoundary;
        performative.getMultipartBoundary = function() {
            return BOUNDARY;
          };

        this._realRequest = https.request;
        https.request = function(options, done) {

            assert.equal(options.hostname, 'agent.capitolhill.ca');
            assert.equal(options.port, 443);
            assert.equal(options.path, '/perform');
            assert.equal(options.method, 'POST');
            assert.equal(options.headers['Content-Type'], 'multipart/form-data; boundary=--SomeBoundary');
            assert.equal(options.headers['Content-Length'], 534);
             
            done({ on: function(evt, done) {
                            switch(evt) {
                                case 'data':
                                    done(new Buffer('Hello, friendo'));
                                    break;
                                case 'end':
                                    done(null);
                                    break;
                            }
                        },
                   setEncoding: function() {},
                });

            return { end: function() {},
                     on: function(evt, done) {},
                     write: function(body) {
                                assert.ok(body instanceof Buffer);
                              },
                   };
          };
        callback();
    },

    tearDown: function(callback) {
        https.request = this._realRequest;
        performative.getMultipartBoundary = this._realGetMultipartBoundary;
        callback();
    },

    'POST a request performative to the given gebo': function(test) {
        test.expect(2);
        performative.request(MESSAGE, function(err, msg) {
            test.equal(typeof msg, 'string');
            test.equal(msg, 'Hello, friendo');
            test.done();
          });
    },

    'Return a returnBuffer parameter is true': function(test) {
        test.expect(2);
        performative.request(MESSAGE, true, function(err, msg) {
            test.ok(Buffer.isBuffer(msg));
            test.equal(msg, 'Hello, friendo');
            test.done();
          });
    },
    
};

