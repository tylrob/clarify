//App
var App = Marionette.Application.extend({
	initialize: function(){
		this.myLayout = new MyLayout().render();
		this.vent.on("inputItemViewSelected", function(someData){
			console.log("Hello from " + someData);

			var inputValues = app.inputs.getSelectedInputValues();
			console.log(inputValues);

			var activeRelationship = app.relationships.lookupUsingInputValues(inputValues);
			console.log(activeRelationship.get('output'));

			app.outputs.at(0).selectOutputValueByCid(activeRelationship.get('output'));
		});
		this.vent.on("outputItemViewSelected", function(someData){
			console.log("Hello from " + someData);

			var outputValue = someData;
			console.log(someData);

			var activeRelationship = app.relationships.lookupUsingOutputValue(outputValue);
			console.log(activeRelationship.get('inputs'));

			app.inputs.selectInputValuesByCid(activeRelationship.get('inputs'));
		});
	},
	addInput: function(){
		if (this.inputs.length >= 5){
			alert("Too many inputs!");
			return;
		}
		this.inputs.create();
		this.computeRelationships(this.inputs, this.outputs, this.relationships);
	},
	removeAllInputs: function(){
		//Should leave the screen with one Boolean input and one output with two options
		app.inputs.reset();
		app.outputs.reset();
		app.relationships.reset();		

		app.inputs.create();
		app.outputs.create();
		
		this.computeRelationships(this.inputs, this.outputs, this.relationships);	

	},
	computeRelationships: function(inputs, outputs, relationships){
		//takes as arguments an inputs collection and a relationships collection

		//Start by resetting output and relationships
		outputs.at(0).get('outputValues').reset();
		relationships.reset();

		var counters = [], maxes = [], iterator = 0;

		//Figure out what values to give counters and maxes.
		for (var i = 0; i < inputs.length; i++){
			counters.push(0);
			maxes.push(inputs.at(i).get('inputValues').length - 1);
		}

		while (!_.isEqual(counters, maxes)) {
			for (var i = 0; i < counters.length; i++){
				if (counters[i] > maxes[i]){
					counters[i] = 0;
					counters[i+1]++;
				}
			}
			//console.log(counters);
			var newestOutput = outputs.at(0).get('outputValues').create({text: iterator});
			//console.log("created in relCalc: " + newestOutput.cid);

			var inputValueCids = [];
			for (var i = 0; i < counters.length; i++){
				//console.log(JSON.stringify(inputs.at(i).get('inputValues').at(counters[i])));
				inputValueCids[i] = inputs.at(i).get('inputValues').at(counters[i]).cid;
			}
			relationships.create({inputs: inputValueCids, output: newestOutput.cid});

			counters[0]++;
			iterator++;
		}
		//This last push() is for the final value after the while loop
			//console.log(counters);
			newestOutput = outputs.at(0).get('outputValues').create({text: iterator});
			//console.log("created in relCalc: " + newestOutput.cid);

			inputValueCids = [];
			for (var i = 0; i < counters.length; i++){
				//console.log(JSON.stringify(inputs.at(i).get('inputValues').at(counters[i])));
				inputValueCids[i] = inputs.at(i).get('inputValues').at(counters[i]).cid;
			}			
			relationships.create({inputs: inputValueCids, output: newestOutput.cid});

		outputs.at(0).setInitialSelectedValue();
	}
});

//Input Models
var InputValue = Backbone.Model.extend({
	defaults: {
		text: 'Bool',
		selected: 'not-selected'
	},
	initialize: function(){
		//console.log("InputValue model initialized " + this.cid);
	}
});

var InputValues = Backbone.Collection.extend({
	model: InputValue,
	localStorage: new Backbone.LocalStorage('complexity-input-values'),
	initialize: function(){
		//console.log('InputValues collection initialized');
		this.create({
			text: 'False',
			selected: 'selected'
		});
		this.create({
			text: 'True',
			selected: 'not-selected'
		});
	},
	getSelectedInputValue: function(){
		var selectedInputValue = this.find(function(inputValue){
			return inputValue.get('selected') === 'selected';
		});
		return selectedInputValue.cid;
	}
});

var Input = Backbone.AssociatedModel.extend({
	relations: [
		{
			type: Backbone.Many,
			key: 'inputValues',
			collectionType: InputValues
		}
	],

	defaults: {
		name: "untitled",
		selectedInput: null,
		previouslySelectedInput: null,
		inputValues: null
	},

	initialize: function(){
		console.log('Input AssociatedModel initialized ' + this.cid);
		this.set({inputValues: new InputValues()});
		//Make sure there is a default selectedInput attribute.
		this.set({selectedInput: this.get('inputValues').at(0).cid});
	},

	selectInputValueByCid: function(cid){
		this.set({'previouslySelectedInput': this.get('selectedInput')});
		this.set({'selectedInput':cid});
		var temp = this.get('previouslySelectedInput');
		this.get('inputValues').get({cid: temp}).set('selected','not-selected');
		this.get('inputValues').get({cid: cid}).set('selected','selected');
	}
});

var Inputs = Backbone.Collection.extend({
	model: Input,
	localStorage: new Backbone.LocalStorage('complexity-inputs'),
	initialize: function(){
		this.create({
			name: "untitled input"
		});
	},
	getSelectedInputValues: function(){
		//For each Input, ask its InputValues collection which one of its InputValues is selected
		var selectedInputValues = this.map(function(input){
			return input.get('inputValues').getSelectedInputValue();
		});
		return selectedInputValues;
	},
	selectInputValuesByCid: function(cids){
		//Takes an array of cids. Even if one cid is passed, must be in an array.
		this.each(function(input, index){
			input.selectInputValueByCid(cids[index]);
		});
	}
});

//Output Models
var OutputValue = Backbone.Model.extend({
	defaults: {
		text: 'Untitled Output',
		selected: 'not-selected'
	},
	initialize: function(){
		//console.log("OutputValue model initialized " + this.cid);
	}
});

var OutputValues = Backbone.Collection.extend({
	model: OutputValue,
	localStorage: new Backbone.LocalStorage('complexity-output-values'),
	initialize: function(){
		this.create();
	}
});

var Output = Backbone.AssociatedModel.extend({
	relations: [
		{
			type: Backbone.Many,
			key: 'outputValues',
			collectionType: OutputValues
		}
	],

	defaults: {
		name: "untitled",
		selectedOutputValue: null,
		previouslySelectedOutputValue: null,
		outputValues: null
	},

	initialize: function(){
		console.log('Output AssociatedModel initialized ' + this.cid);
		this.set({outputValues: new OutputValues()});
	},

	setInitialSelectedValue: function(){
		console.log("default selected will be " + this.get('outputValues').at(0).cid);
		this.get('outputValues').at(0).set('selected','selected');
		this.set({selectedOutputValue: this.get('outputValues').at(0).cid});
	},

	selectOutputValueByCid: function(cid){
		this.set({'previouslySelectedOutputValue': this.get('selectedOutputValue')});
		this.set({'selectedOutputValue':cid});
		var temp = this.get('previouslySelectedOutputValue');
		this.get('outputValues').get({cid: temp}).set('selected','not-selected');
		this.get('outputValues').get({cid: cid}).set('selected','selected');
	}

});

var Outputs = Backbone.Collection.extend({
	model: Output,
	localStorage: new Backbone.LocalStorage('complexity-outputs'),
	initialize: function(){
		this.create({
			name: "untitled output"
		});
	}
});

//Relationship Models
var Relationship = Backbone.Model.extend({
	//Inputs is an array of Input cids, and output is a single Output's cid
	defaults: {
		inputs: null,
		output: null
	}
});

var Relationships = Backbone.Collection.extend({
	model: Relationship,
	localStorage: new Backbone.LocalStorage('complexity-relationships'),

	lookupUsingInputValues: function(inputValues){
		var activeRelationship = this.find(function(relationship){
			return _.isEqual(relationship.get('inputs'),inputValues);
		});
		return activeRelationship;
	},

	lookupUsingOutputValue: function(outputValue){
		var activeRelationship = this.find(function(relationship){
			return relationship.get('output') === outputValue;
		});
		return activeRelationship;
	}

});

//Layout Views
var MyLayout = Marionette.LayoutView.extend({
	el: '#hook',
	template: "#layout-template",
	regions: {
		header: "#header",
		main: "#main",
		footer: "#footer"
	}
});

//Input Views
var InputItemView = Marionette.ItemView.extend({
	template: "#input-item-view",
	initialize: function(){
		this.listenTo(this.model, 'change', this.render);
	},
	events: {
		'click': 'select',
		'dblclick': 'edit',
		'keypress': 'updateOnEnter',
		'blur input': 'close'
	},
	onBeforeRender: function(){
		if (this.model.get('selected') === 'selected') {
			$(this.el).addClass('selected');		
		} else {
			$(this.el).removeClass('selected');
		}
	},
	select: function(){
		if (!this.$('input').hasClass('hidden')) {
			console.log("don't reselect; it's already selected");
			return;
		} else {
			this.trigger('childSelected', this.model.cid);
			app.vent.trigger('inputItemViewSelected', this.model.cid);
			this.edit();	
		}
	},
	edit: function(){
		var prepopulatedValue = this.model.get('text');
		this.$('input').val(prepopulatedValue);
		this.$('input').removeClass('hidden');
		this.$('span').addClass('hidden');
		this.$('input').focus();
	},
	close: function(){

		console.log("close running");		
		var value = this.$('input').val();
		var trimmedValue = value.trim();

		if (trimmedValue){
			this.model.save({text: trimmedValue});
		}
		
		this.$('input').addClass('hidden');
		this.$('span').removeClass('hidden');
	},
	updateOnEnter: function(e){
		if (e.which === 13) { //ENTER_KEY is 13
			this.close();
		}
	}
});

var InputView = Marionette.CompositeView.extend({
	childView: InputItemView,
	childEvents: {
		'childSelected': 'childSelected'
	},
	childSelected: function(childView, cid){
		//Ultimately, the App OR the view will need to be able to change which item is selected.
		//The view can change what's selected when a view is directly clicked.
		//But the App can change what's selected if something else programmatically changes what's selected.
		this.model.selectInputValueByCid(cid);
	},
	childViewContainer: ".composite-attach",
	template: "#composite-view",
	initialize: function(){
		this.collection = this.model.get('inputValues');
	}
});

var InputsView = Marionette.CollectionView.extend({
	childView: InputView
});

//Output Views
var OutputItemView = Marionette.ItemView.extend({
	template: "#output-item-view",
	initialize: function(){
		this.listenTo(this.model, 'change', this.render);
	},
	events: {
		"click": "select"
	},
	onBeforeRender: function(){
		if (this.model.get('selected') === 'selected') {
			$(this.el).addClass('selected');		
		} else {
			$(this.el).removeClass('selected');
		}
	},
	select: function(){
		this.trigger('childSelected', this.model.cid);
		app.vent.trigger('outputItemViewSelected', this.model.cid);
	}
});

var OutputView = Marionette.CompositeView.extend({
	childView: OutputItemView,
	childEvents: {
		'childSelected': 'childSelected'
	},
	childSelected: function(childView, cid){
		this.model.selectOutputValueByCid(cid);
	},
	childViewContainer: ".output-composite-attach",
	template: "#output-composite-view",
	initialize: function(){
		this.collection = this.model.get('outputValues');
	}
});

var OutputsView = Marionette.CollectionView.extend({
	childView: OutputView
});

//Navigation Views
var NavView = Marionette.ItemView.extend({
	template: "#nav-view",
	ui: {
		"addInput": "#add-input-btn",
		"removeAll": "#remove-all-inputs-btn"
	},
	events: {
		"click @ui.addInput": "addInput",
		"click @ui.removeAll": "removeAllInputs"
	},
	addInput: function(){
		this.trigger('nav.addInput');
	},
	removeAllInputs: function(){
		this.trigger('nav.removeAllInputs');
	}
});

//Start App
var app = new App();




//Begin app initialization
app.inputs = new Inputs();
app.outputs = new Outputs();
app.relationships = new Relationships();

app.inputsView = new InputsView({collection: app.inputs});
app.outputsView = new OutputsView({collection: app.outputs});
app.navView = new NavView();

app.listenTo(app.navView, 'nav.addInput', app.addInput);
app.listenTo(app.navView, 'nav.removeAllInputs', app.removeAllInputs);

app.computeRelationships(app.inputs, app.outputs, app.relationships);

app.myLayout.getRegion('header').show(app.navView);
app.myLayout.getRegion('main').show(app.inputsView);
app.myLayout.getRegion('footer').show(app.outputsView);