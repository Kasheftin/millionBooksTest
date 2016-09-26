define(["jquery","underscore","knockout","config"],function($,_,ko,config) {

	var M = function(o) {
		var self = this;
		this.eventEmitter = o.core.eventEmitter;

		this.genres = config.genres;
		this.sort = ko.observable(config.sort);
		this.genreFilter = ko.observable(config.genreFilter);
		this.genderFilter = ko.observable(config.genderFilter);
		this.count = ko.observable(config.count);
		this.authors = this.getRandomAuthors(1000);

		this.books = [];
		this.visibleBooks = ko.observableArray([]);

		this.eventEmitter.on("setCount",function(n) {
			self.updateBooksCount(n);
		});
		this.eventEmitter.on("setSort",function(sort) {
			self.updateBooksSort(sort);
		});
		this.eventEmitter.on("setGenre",function(genre) {
			self.filterBooksByGenre(genre);
		});
		this.eventEmitter.on("setGender",function(gender) {
			self.filterBooksByAuthorGender(gender);
		});
	}

	M.prototype.resetList = function() {
		console.log("reset");
		this.visibleBooks([]);
		this._visibleFirst = 0;
		this._px0 = 0;
		this._px1 = 0;
		this._prevScroll = 0;
		this._virtualScroll = 0;
		this._repeatRecalc = false;
		this._recalcDisabled = false;
	}




	// The core function that defines books to show depending on scroll position.
	M.prototype.recalc = function(type) {
		var self = this;

		/*
			The number of screens to load around the current screen (up and down) = 2m, so that usually 2m+1+2m screens are loaded;
			We start to load next portion of screens when it reaches m.
		*/

		var m = 2;

		var s = this.$container.scrollTop();
		var h = this.$container.height();

		this._virtualScroll += s-this._prevScroll;
		this._prevScroll = s;

		var sh = this._virtualScroll/h;

		var x0 = Math.max(0,Math.floor(sh/m)-2);
		var x1 = Math.floor(sh/m)+3;

		if (this._px0==x0 && this._px1==x1) return;
		if (this._recalcDisabled) {
			this._repeatRecalc = true;
			return;
		}
		this._recalcDisabled = true;

		var removeFromTop = function(callback) {
			if (self._px0>=x0) return callback();
			var screensToRemove = (x0-self._px0)*m;
			var hRemoved = 0;
			var removeCnt = 0;
			var $domBooks = self.$holder.children();
			for (var i=0;i<$domBooks.length;i++) {
				hRemoved += $domBooks.eq(i).outerHeight(true);
				removeCnt++;
				if (hRemoved>=screensToRemove*h || removeCnt>=self.visibleBooks().length) break;
			}
			if (removeCnt>=self.visibleBooks().length) self.visibleBooks([]);
			else self.visibleBooks.splice(0,removeCnt);
			self._virtualScroll+=hRemoved;
			self.$container.scrollTop(self.$container.scrollTop()-hRemoved);
			return _.defer(callback);
		}

		var removeFromBottom = function(callback) {
			if (self._px1<=x1) return callback();
			var screensToRemove = (self._px1-x1)*m;
			var hRemoved = 0;
			var removeCnt = 0;
			var $domBooks = self.$holder.children();
			for (var i=$domBooks.length-1;i>=0;i--) {
				hRemoved += $domBooks.eq(i).outerHeight(true);
				removeCnt++;
				if (hRemoved>=screensToRemove*h || removeCnt>=self.visibleBooks().length) break;
			}
			if (removeCnt>=self.visibleBooks().length) self.visibleBooks([]);
			else self.visibleBooks.splice(self.visibleBooks().length-removeCnt,removeCnt);
			_.defer(callback);
		}

		var addToTop = function(callback) {
			if (self._px0<=x0) return callback();
			var screensToAdd = (self._px0-x0)*m;
			var hAdded = 0;
			// Freezing the holder so that adding books at the begining of the list will not move below elements.
			self.$wrapper.height(self.$wrapper.height()).css("overflow","hidden");
			self.$holder.css({"position":"absolute","left":0,"right":0,"bottom":0});
			var run = function(i) {
				if (hAdded>=screensToAdd*h || i<0) {
					// Releasing the holder back and moving the scroll.
					self.$holder.css({"position":"static","left":"auto","right":"auto","bottom":"auto"});
					self.$wrapper.height("auto").css("overflow","visible");
					self._virtualScroll -= hAdded;
					self.$container.scrollTop(self.$container.scrollTop()+hAdded);
					return callback();
				}
				self.visibleBooks.unshift(self.books[i]);
				_.defer(function() {
					var firstDomBookHeight = self.getBookDomNodeOuterHeight(self.holder.firstElementChild);
					hAdded += firstDomBookHeight;
 					run(i-1);
				});
			}
			var firstIndex = (self.visibleBooks().length>0?_.first(self.visibleBooks()).i:-1);
			run(firstIndex-1);
		}

		var addToBottom = function(callback) {
			if (self._px1>=x1) return callback();
			var screensToAdd = (x1-self._px1)*m;
			var hAdded = 0;
			var run = function(i) {
				if (hAdded>=screensToAdd*h || i>=self.books.length) return callback();
				self.visibleBooks.push(self.books[i]);
				_.defer(function() {
					hAdded += self.getBookDomNodeOuterHeight(self.holder.lastElementChild);
					run(i+1);
				});
			}
			var lastIndex = (self.visibleBooks().length>0?_.last(self.visibleBooks()).i:-1);
			run(lastIndex+1);
		}

		removeFromTop(function() {
			removeFromBottom(function() {
				addToTop(function() {
					addToBottom(function() {
						self._px0 = x0;
						self._px1 = x1;
						var firstBookIndex = (self.visibleBooks().length>0?_.first(self.visibleBooks()).i:-1);
						var lastBookIndex = (self.visibleBooks().length>0?_.last(self.visibleBooks()).i:-1);
//						console.log("recalc result","x0="+x0,"x1="+x1,"visibleBooksCount="+self.visibleBooks().length,"firstBookIndex="+firstBookIndex,"lastBookIndex="+lastBookIndex);
						self._recalcDisabled = false;
						if (self._repeatRecalc) self.recalc();
					});
				});
			});
		});
	}

	// Due to perfomance lag (when scrolling up with PageUp too fast) try to replace $(domNode).getOuterHeight(true) with this.
	// Apply this function only for book dom node elements that have the same style, so get the style only once.
	M.prototype.getBookDomNodeOuterHeight = function(domNode) {
		if (domNode) {
			if (!this.hasOwnProperty("_cachedBookDomNodeMargins")) {
				var styles = domNode.currentStyle || window.getComputedStyle(domNode);
				this._cachedBookDomNodeMargins = parseFloat(styles.marginTop)+parseFloat(styles.marginBottom);
			}
			return Math.ceil(domNode.offsetHeight+this._cachedBookDomNodeMargins);
		}
		return 0;
	}




	M.prototype.updateBooksCount = function(n) {
		console.time("updateBooksCount");
		if (n<this.books.length) {
			console.log("Removing "+(this.books.length-n)+" books from the list...");
			this.books.splice(n);
		}
		else if (n>this.books.length) {
			console.log("Adding "+(n-this.books.length)+" books to the list...");
			var dt = (new Date).getTime();
			while (this.books.length<n) {
				this.books.push({
					i: this.books.length,
					id: this.books.length,
					author: Math.floor(Math.random()*this.authors.length),
					genre: Math.floor(Math.random()*this.genres.length),
					dt: Math.floor(Math.random()*dt),
					title: this.getRandomBookTitle()
				});
			}
		}
		console.timeEnd("updateBooksCount");
		this.count(this.books.length);
		this.recalc("count");
	}

	M.prototype.updateBooksSort = function(sort) {
		console.time("updateBooksSort");
		this.reset();

	}

	M.prototype.reset = function() {
		this.visibleBooks([]);
		this._
	}

	M.prototype.getRandomAuthors = function(n) {
		var firstNames = "Noah Liam Mason Jacob William Ethan James Alexander Michael Benjamin Elijah Daniel Aiden Logan Matthew Lucas Jackson David Oliver Jayden Joseph Gabriel Samuel Carter Anthony John Dylan Luke Henry Andrew".split(/ /);
		var lastNames = "Smith Johnson Williams Brown Jones Miller Davis Garcia Rodriguez Wilson Martinez Anderson Taylor Thomas Hernandez Moore Martin Jackson Thompson White Lopez Lee Gonzalez Harris Clark Lewis Robinson Walker Perez Hall".split(/ /);
		var genders = ["male","female"];
		var data = [];
		while (data.length<n) {
			data.push({
				name: _.sample(firstNames)+" "+_.sample(lastNames),
				gender: _.sample(genders)
			});
		}
		return data;
	}

	M.prototype.getRandomBookTitle = function() {
		var w = ["Aliens","Agents","Creators","Honor","Sword","Officer","Butterfly","Bear","God","Desire","Night","Wings","Glory","Reality","Fires"];
		var c = ["Of","And","With","At"];
		return _.sample(w)+" "+_.sample(c)+" "+_.sample(w);
	}

	M.prototype.formatDate = function(dt) {
		var t = new Date(dt);
		return t.getFullYear()+"-"+(t.getMonth()<9?"0":"")+(t.getMonth()+1)+"-"+(t.getDate()<10?"0":"")+t.getDate();
	}

	M.prototype.domInit = function(o) {
		var self = this;
		this.container = o.firstDomChild;
		this.$container = $(this.container);
		this.$wrapper = this.$container.find(".books-wrapper").eq(0);
		this.wrapper = this.$wrapper[0];
		this.$holder = this.$container.find(".books-holder").eq(0);
		this.holder = this.$holder[0];
		this.$container.scroll(function() {
			self.recalc("scroll");
		});
		$(window).on("resize",function() {
			self.recalc("resize");
		});
		this.resetList();
	}

	return M;
});