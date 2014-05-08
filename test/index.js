var performative = require('..');

var ACCESS_TOKEN = '1234';

var MESSAGE = {
        sender: "daniel@capitolhill.ca",
        receiver: "agent@capitolhill.ca",
        performative: "request",
        action: "greeting",
        gebo: "https://agent.capitolhill.ca",
        access_token: ACCESS_TOKEN,
    };

var CONTENT = {
        resource: "resumes",
        format: "json"
    };
 
var FILES = {
        picture: {
            name: "Phil_Truong_Resume.doc",
            type: "application/msword",
            size: 37888
        }
    };

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
 */ exports.makeMultipartBody = {

    'Take a JSON formatted gebo message and return the body for a multipart/form-data POST': function(test) {
        test.expect(1);
        var body = performative.makeMultipartBody(MESSAGE);
        test.done();
    },
};

