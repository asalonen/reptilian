var _ = require("lodash");
var nodeurl = require('url');
var Crawler = require("crawler");

module.exports = {

    crawl: function (opts, globalCallback) {

        var onDrainCounter = 0;

        if (opts.site) {
            if (!opts.acceptUrl) {
                opts.acceptHostRegex = new RegExp(opts.site+"$");
                opts.acceptUrl = function (url) {
                    var currentHost = nodeurl.parse(url).hostname;
                    return currentHost.match(opts.acceptHostRegex);
                }
            }
            if (!opts.rootUrl) opts.rootUrl = "http://"+opts.site;
        }

        console.log("reptilian: crawl! opts: ",opts);

        var visited = {};

        function dontContinue(uri) {
            if (visited[uri]) {
                console.log("WARN skipDuplicates not working? uri already visited: "+uri);
                return true;
            }
            if (!opts.acceptUrl(uri)) {
                console.log("reptilian: url not accepted for continuing: "+uri);
                return true;
            }
        }

        var c = new Crawler({
            // cache: Boolean, if true stores requests in memory (Default false)
            rateLimits: _.isUndefined(opts.rateLimits) ? 1000 : opts.rateLimits, // Number of milliseconds to delay between each requests (Default 0) Note that this option will force crawler to use only one connection (for now)
            skipDuplicates: true,
            maxConnections : 1, // 10,
            onDrain: function (err, res) {
                if (err) throw err; // TODO:
                console.log("reptilian: onDrain, visited: "+_.size(visited));
                if (onDrainCounter > 0) {
                    console.error("reptilian: onDrain already called "+onDrainCounter+" times! error somewhere? skipping global callback");
                    return;
                }
                globalCallback(undefined, {visited: visited})
            },
            // This will be called for each crawled page
            callback : function (error, result, $) {
                if (error) throw error;
                if (dontContinue(result.uri)) return;
                //console.log(result);
                console.log("reptilian: crawl "+result.uri+" => "+result.statusCode);
                visited[result.uri] = {error: error, result: result};
                //console.log(result.body);
                // $ is Cheerio by default
                //a lean implementation of core jQuery designed specifically for the server
                if ($) {
                    $('a').each(function(index, a) {
                        var toQueueUrl = $(a).attr('href');
                        if (!toQueueUrl.match(/^\w+:\/\//)) toQueueUrl = nodeurl.resolve(result.uri, toQueueUrl);
                        if (dontContinue(toQueueUrl)) return;
                        //console.log("  --> "+toQueueUrl);
                        c.queue(toQueueUrl);
                    });
                }
            }
        });

        c.queue(opts.rootUrl);

    }

};
