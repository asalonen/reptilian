require('chai').should();
const _ = require("lodash");
const expressrunner = require("express-runner");
const reptilian = require("../reptilian");

describe("reptilian", function () {

    var ex;

    beforeEach(function (done) {
        ex = expressrunner.start({
            port: 3000,
            onStart: function (ex) {
                ex.app.use(ex.express.static(__dirname + '/public'));
                done();
            }
        });
    });

    afterEach(function (done) {
        ex.stop(done);
    });

    it("crawls site successfully, doesn't go outside, and returns result", function (done) {
        reptilian.crawl({
            rateLimits: 0,
            rootUrl: ex.url + "/testsite1/index.html",
            acceptUrl: function (url) {
                return url.match(new RegExp("^" + ex.url));
            }
        }, function (err, res) {
            if (err) throw err;
            _.size(res.visited).should.eql(4);
            done();
        });
    });

});

