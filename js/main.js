require.config({
	baseUrl: "js",
	paths: {
		"domReady":			"../vendor/domReady/domReady",
		"eventEmitter":		"../vendor/eventEmitter/EventEmitter",
		"jquery":			"../vendor/jquery/dist/jquery",
		"knockout":			"../vendor/knockout/dist/knockout.debug",
		"ko-widget":		"../vendor/ko-widget/src/ko-widget",
		"text":				"../vendor/requirejs-text/text",
		"underscore":		"../vendor/underscore/underscore"
	},
	packages: [
		{name: "ko-widget", location: "../vendor/ko-widget/src", main: "ko-widget"}
	]
});

require(["domReady!","eventEmitter","knockout","ko-widget"],function(doc,EventEmitter,ko) {
	var App = function() {
		this.eventEmitter = new EventEmitter;
	}
	ko.applyBindings(new App);
});