define(["knockout","config"],function(ko,config) {

	var M = function(o) {
		var self = this;
		this.eventEmitter = o.core.eventEmitter;

		this.genres = config.genres;
		this.sort = ko.observable(config.sort);
		this.genreFilter = ko.observable(config.genreFilter);
		this.genderFilter = ko.observable(config.genderFilter);
		this.count = ko.observable(config.count);

		this.sort.subscribe(function(v) {
			self.eventEmitter.emit("setSort",v);
		});

		this.genreFilter.subscribe(function(v) {
			self.eventEmitter.emit("setGenre",v);
		});

		this.genderFilter.subscribe(function(v) {
			self.eventEmitter.emit("setGender",v);
		});

		this.count.subscribe(function(v) {
			self.eventEmitter.emit("setCount",Math.floor(v));
		});
	}

	M.prototype.updateCountBy = function(n) {
		(!isNaN(n)) && this.count(Math.max(0,Math.floor(this.count())+Math.floor(n)));
	}

	return M;
});