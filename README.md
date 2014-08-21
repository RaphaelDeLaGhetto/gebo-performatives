gebo-performatives
==================

A speech act module for the gebo agent

# Install

```
npm install gebo-performatives
```

# Sample script

```
/**
 * This package takes care of all the tricky details
 * that come with POSTing a file
 */
var performatives = require('gebo-performatives');

/**
 * The message object defines the request you are making
 * of the gebo agent.
 *
 * All of the fields shown are required.
 */
var message = {

    // The client's unique ID (always an email address)
    sender: 'someguy@example.com',

    // You are _requesting_ that the gebo agent perform an action
    performative: 'request',

    // Some action the gebo agent is able to perform
    action: 'someAction',

    // The content field is where all the details secondary to
    // issuing the performative itself are passed to the gebo agent
    content: {

        // For example, maybe the gebo agent monitors the health of your cat
        status: 'Breath smells like cat food'
    },

    // The address where the agent resides 
    gebo: 'https://example.com',

    // The unique token that determines whether access
    // can be granted to the agent making the request
    access_token: 'SomeRandomlyAssignedAccessToken123',

    // Maybe you want to send a file... (only one at a time, I'm afraid)
    files: {

        // This is the single file you may pass to the gebo agent
        picture: {

            // File name
            name: 'mittens.jpg',

            // File path
            path: '/full/path/to/mittens.jpg',
          }
      },
  };
 
console.log('Requesting agent action:', message);

/**
 * The request function sends the message to the address 
 * specified in the gebo property
 */
performatives.request(message, function(err, results) {
      if (err) {
        console.log(err);
      }
      else {
        console.log(JSON.stringify(JSON.parse(results), null, 4));
      }
  });
```
