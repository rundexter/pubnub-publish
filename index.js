var q = require('q')
  , _ = require('lodash')
  , pubnub = require('pubnub')
  , assert = require('assert')
;

module.exports = {
    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
        var self          = this
          , publish_key   = step.input('publish_key').first()
          , subscribe_key = step.input('subscribe_key').first()
          , messages      = step.inputObject(['channel', 'message'])
          , agent         = pubnub.init({
              publish_key     : publish_key
              , subscribe_key : subscribe_key
              , error         : function (error) {
                  console.log('Error: ', error);
              }
            })
        ;

        //validate
        assert(publish_key, 'publish_key required.');
        assert(subscribe_key, 'subscribe_key required.');

        q.all(_.map(messages, function(message) {
            var deferred=q.defer();

            agent.publish(_.extend({
                callback     : deferred.resolve.bind(deferred)
                , error      : deferred.reject.bind(deferred)
            }, message));

            return deferred
                     .promise
                     .then(function(result) {
                        return { result: result };
                     })
            ;
        }))
        .then(
            function(results) {
                agent.shutdown();
                self.complete(results);
            }
        )
        .catch(this.fail.bind(this))
        ;
    }
};
