var AutoCompleteItemView = Backbone.View.extend({
    tagName: "li",
    template: _.template('<a href="#"><%= label %></a>'),

    events: {
        "click": "select"
    },

    render: function () {
        this.$el.html(this.template({
            "label": this.model.label()
        }));
        return this;
    },

    select: function () {
        this.options.parent.hide().select(this.model);
        return false;
    }

});

var AutoCompleteView = Backbone.View.extend({
    tagName: "ul",
    className: "autocomplete",
    wait: 200,

    queryParameter: "query",
    minKeywordLength: 2,
	
	excludedPrefices: ['The', 'A'],
	
	currentText: "",
	
    itemView: AutoCompleteItemView,

    initialize: function (options) {
        _.extend(this, options);
        this.filter = _.debounce(this.filter, this.wait);
    },


	//draw the AutoCompleteView
    render: function () {
        // disable the native auto complete functionality
        this.input.attr("autocomplete", "off");

        this.$el.width(this.input.outerWidth());
		
		this.excludedPrefices = _.map(this.excludedPrefices, function(pre){	return pre.toLowerCase()});
		
        this.input
            .keyup(_.bind(this.keyup, this))
            .keydown(_.bind(this.keydown, this))
            .after(this.$el);

        return this;
    },

	//navigation keys for search results
    keydown: function (event) {
        if (event.keyCode == 38) return this.move(-1);
        if (event.keyCode == 40) return this.move(+1);
        if (event.keyCode == 13) return this.onEnter();
        if (event.keyCode == 27) return this.hide();
    },

	//user enters a key
    keyup: function () {
        var keyword = this.input.val();
        if (this.isChanged(keyword)) {
            if (this.isValid(keyword)) {
                this.filter(keyword);
            } else {
                this.hide()
            }
			this.currentText = keyword;//update currentText
        }
    },

	//search function
    filter: function (keyword) {
    	var keyword = keyword.toLowerCase();
        //for fetching over server
		if (this.model.url) {
			
            var parameters = {};
            parameters[this.queryParameter] = keyword;

            this.model.fetch({
                success: function () {
                    this.loadResult(this.model.models, keyword);
                }.bind(this),
                data: parameters
            });

        } else {
            this.loadResult(this.model.filter(function (model) {
                return model.label().toLowerCase().indexOf(keyword) !== -1
            }), keyword);
        }
    },

    isValid: function (keyword) {
		var prefixCheck = _.find(this.excludedPrefices, function(pre) {
			return keyword.indexOf(pre) === 0
		});
		
		if (prefixCheck) {
			return false
		} else {
			//satisfies prefix check
			return keyword.length > this.minKeywordLength
		}
        
    },

    isChanged: function (keyword) {
        return this.currentText != keyword;
    },

    move: function (position) {
        var current = this.$el.children(".active"),
            siblings = this.$el.children(),
            index = current.index() + position;
        if (siblings.eq(index).length) {
            current.removeClass("active");
            siblings.eq(index).addClass("active");
        }
        return false;
    },

    onEnter: function () {
        this.$el.children(".active").click();
        return false;
    },

    loadResult: function (model, keyword) {
        this.show().reset();
        if (model.length) {
            _.forEach(model, this.addItem, this);
            this.show();
        } else {
            this.hide();
        }
    },

    addItem: function (model) {
        this.$el.append(new this.itemView({
            model: model,
            parent: this
        }).render().$el);
    },

    select: function (model) {
        var label = model.label();
        this.input.val(label);
        this.currentText = label;
        this.onSelect(model);
    },

    reset: function () {
        this.$el.empty();
        return this;
    },

    hide: function () {
        this.$el.hide();
        return this;
    },

    show: function () {
        this.$el.show();
        return this;
    },

    // callback definitions
    onSelect: function () {}

});
