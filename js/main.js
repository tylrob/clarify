//App
var App = Marionette.Application.extend({
	initialize: function(){
		//Assign a layout to the App, which in turn assigns the Regions upon its creation.
		this.myLayout = new MyLayout().render();

		//App.vent is native to Marionette.
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
		this.vent.on("newInputValueAdded", function(){
			app.refreshRelationships();
		});
	},
	resetSelection: function(){
		//Select the first output existing at the moment.
		var outputValue = app.outputs.at(0).get('outputValues').at(0).cid;
		app.outputs.at(0).selectOutputValueByCid(outputValue);
		var activeRelationship = app.relationships.lookupUsingOutputValue(outputValue);
		app.inputs.selectInputValuesByCid(activeRelationship.get('inputs'));

	},
	addInput: function(){
		if (this.inputs.length >= 7){
			alert("Too many inputs!");
			return;
		}
		this.inputs.create();
		this.refreshRelationships();
		this.resetSelection();

	},
	refreshRelationships: function(){
		this.setPrevOutputs(this.outputs, this.prevOutputs);
		this.setPrevRelationships(this.relationships, this.prevRelationships);
		this.computeRelationships(this.inputs, this.outputs, this.relationships);
		this.mapExistingRelationships(this.relationships, this.prevRelationships, this.outputs, this.prevOutputs);		
	},
	removeAllInputs: function(){
		//Should leave the screen with one Boolean input and one output with two options
		this.inputs.reset();
		this.outputs.reset();
		this.relationships.reset();		

		this.inputs.create();
		this.outputs.create();
		
		this.computeRelationships(this.inputs, this.outputs, this.relationships);	

		this.resetSelection();

	},
	setPrevOutputs: function(outputs, prevOutputs){
		
		prevOutputs.at(0).get('outputValues').reset();

		for (var i = 0; i < outputs.at(0).get('outputValues').length; i++){
			var outputText = outputs.at(0).get('outputValues').at(i).get('text');
			var outputPrevCid = outputs.at(0).get('outputValues').at(i).cid;

			prevOutputs.at(0).get('outputValues').create({text: outputText, prevCid: outputPrevCid});
		}

	},
	setPrevRelationships: function(relationships, prevRelationships){
		//Reset app.prevRelationships
		prevRelationships.reset();
		for (var i = 0; i < relationships.length; i++){
			var relOutput = relationships.at(i).get('output');
			var relInput = [];

			for (var j = 0; j < relationships.at(i).get('inputs').length; j++){
				relInput.push(relationships.at(i).get('inputs')[j]);
			}

			prevRelationships.create({inputs: relInput, output: relOutput});
		}
		/*I'm creating an array here, the relInput aray, and then creating 
		a prevRelationships item and setting that array inside it. But where is the 
		reference to that array once the function terminates?
		How does this work?
		*/
	},
	computeRelationships: function(inputs, outputs, relationships){
		//takes as arguments an inputs collection and a relationships collection

		//Make a deep clone of the app's relationships collection
		//Store it as app.prevRelationships


		//Reset app's outputs collection
		outputs.at(0).get('outputValues').reset();

		//Reset app's relationships collection
		relationships.reset();

		//Set up counter, maxes and an iterator to track the creation of
		//all the outputs and relationships
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
			var newestOutput = outputs.at(0).get('outputValues').create({text: "Result " + (iterator + 1)});
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
			newestOutput = outputs.at(0).get('outputValues').create({text: "Result " + (iterator + 1)});
			//console.log("created in relCalc: " + newestOutput.cid);

			inputValueCids = [];
			for (var i = 0; i < counters.length; i++){
				//console.log(JSON.stringify(inputs.at(i).get('inputValues').at(counters[i])));
				inputValueCids[i] = inputs.at(i).get('inputValues').at(counters[i]).cid;
			}			
			relationships.create({inputs: inputValueCids, output: newestOutput.cid});

		outputs.at(0).setInitialSelectedValue();
	},
	mapExistingRelationships: function(relationships, prevRelationships, outputs, prevOutputs){
		console.log("mapExistingRelationships");
		for (var i = 0; i < relationships.length; i++){
			//make a copy of the inputs array to play with in this function
			var freshInputs = relationships.at(i).get('inputs').slice();

			//1. figure out the index of the greatest valued fresh input cid
			var max = Number(freshInputs[0].slice(1));
			console.log("Default max is " + max);
			var maxIndex = 0;

			for (var j = 1; j < freshInputs.length; j++){
				if (Number(freshInputs[j].slice(1)) > max){
					max = Number(freshInputs[j].slice(1));
					maxIndex = j;
				}
			}
			console.log("maxIndex is found to be " + maxIndex);

			//2. splice freshInputs so that the greatest value is removed
			console.log("Pre-spliced freshInputs is " + freshInputs);
			freshInputs.splice(maxIndex, 1);
			console.log("Spliced freshInputs is " + freshInputs);
			
			//3. use the local copy (aka freshInputs) as the criteria for a search
			//through the 'prevRelationships' collection
			var found = prevRelationships.find(function(relationship){
				return _.isEqual(relationship.get('inputs'),freshInputs)
			});

			if (found){
				console.log(found.get('inputs'));
			} else {
				console.log("No match found");
				return;
			}

			//4. if you find a match, take relationships.at(i).get('output')
			//which is a cid and find the output value corresponding to it
			var foundCid = found.get('output');
			console.log("the cid of the prevOutput to use is " + foundCid);
			
			//5. Find the prevOutput corresponding to the cid we found
			var foundPrevOutput = prevOutputs.at(0).get('outputValues').findWhere({prevCid: foundCid});
			var foundPrevOutputText = foundPrevOutput.get('text');
			console.log("the output associated with that cid is " + foundPrevOutputText);

			//6. Save the value associated with the prevOutput to the new output.
			var loopCurrentOutput = relationships.at(i).get('output');
			outputs.at(0).get('outputValues').get(loopCurrentOutput).set({text: foundPrevOutputText});
			console.log("Set new output cid " + loopCurrentOutput + " to the value " + foundPrevOutputText);

			//7. Make the view refresh
			outputs.at(0).get('outputValues').get(loopCurrentOutput).trigger('forceRender');

			//8. Remove the prevRelationship so it isn't used again
			prevRelationships.remove(found);			
		}
	},
	convertUserDataToCsv: function(inputs, outputs, relationships){  
		console.log("converting user data to csv");

	    var result, col, row;

	    col = ',';
	    row = '\n';
	    result = '';

	    //**For the header row
	    for (var i = 0; i < inputs.length; i++){
	    	var inputName = inputs.at(i).get('name');
	    	result += inputName;
	    	result += col;
	    }
	    var outputName = outputs.at(0).get('name');
	    result += outputName;
	    result += row;

	    //**For the body 
	    //for each relationship item
	    //take each input cid one by one
	    //get the input string that it represents and concatenate it to the blob
	    //then take the output cid
	    //get the output string that it represents and concatenate it to the blob
	    //add a line end character
	    //repeat

		for(var i = 0; i < relationships.length; i++){
	    	var inputsArray = relationships.at(i).get('inputs');
	    	for (var j = 0; j < inputsArray.length; j++){
	    		var inputCid = inputsArray[j];
	    		var inputText = inputs.at(j).getInputValueTextByCid(inputCid);
	    		result += inputText;
	    		result += col;
	    	}
	    	var outputCid = relationships.at(i).get('output');
	    	var outputText = outputs.at(0).getOutputValueTextByCid(outputCid);
	    	result += outputText;
	    	result += row;
	    }
	    return result;
	},
/*Inspired by code from http://halistechnology.com/2015/05/28/use-javascript-to-export-your-data-as-csv/ */
	exportToCsv: function(){
		console.log("preparing file download");

		var csv = this.convertUserDataToCsv(this.inputs, this.outputs, this.relationships);
		
		if (csv == null) {
			console.log("exportToCsv didn't get any data")
			return;
		}

	    csv = 'data:text/csv;charset=utf-8,' + csv;
		data = encodeURI(csv);
		link = document.createElement('a');
		link.setAttribute('href', data);
		link.setAttribute('download', 'clarify-export.csv');
		link.click();
	}
});

//Input Models
var InputValue = Backbone.Model.extend({
	defaults: {
		text: 'New Option',
		selected: 'not-selected'
	}
});

var InputValues = Backbone.Collection.extend({
	model: InputValue,
	localStorage: new Backbone.LocalStorage('complexity-input-values'),
	initialize: function(){
		//console.log('InputValues collection initialized');
		this.create();
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
		name: "Untitled Input",
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
	},
	getInputValueTextByCid: function(cid){
		var inputValuesCollection = this.get('inputValues');
		var matchingInputValue = inputValuesCollection.get({cid: cid});
		if (!matchingInputValue) {
			console.log("No matching input value");
			return;			
		} else {
		var inputValueText = matchingInputValue.get('text');
			return inputValueText;
		}
	}
});

var Inputs = Backbone.Collection.extend({
	model: Input,
	localStorage: new Backbone.LocalStorage('complexity-inputs'),
	initialize: function(){
		this.create();
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
		selected: 'not-selected',
		prevCid: null
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
		name: "Results",
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
	},
	getOutputValueTextByCid: function(cid){
		var outputValuesCollection = this.get('outputValues');
		var matchingOutputValue = outputValuesCollection.get({cid: cid});
		if (!matchingOutputValue) {
			console.log("No matching output value");
			return;			
		} else {
		var outputValueText = matchingOutputValue.get('text');
			return outputValueText;
		}
	}
});

var Outputs = Backbone.Collection.extend({
	model: Output,
	localStorage: new Backbone.LocalStorage('complexity-outputs'),
	initialize: function(){
		this.create({
			name: "Results"
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
		inputs: "#inputs",
		outputs: "#outputs"
	}
});

//Input Views
var InputItemView = Marionette.ItemView.extend({
	template: "#input-item-view",
	initialize: function(){
		this.listenTo(this.model, 'change:selected', this.syncHighlightToModel);
		this.syncHighlightToModel();
	},
	events: {
		//'click': function(){this.select('clickedView')},
		'focusin input': function(){this.select('focusInput')},
		'keypress': 'updateOnEnter',
		'blur input': 'close'
	},
	onRender: function(){
		var prepopulatedValue = this.model.get('text');
		this.$('input').val(prepopulatedValue);

	},
	syncHighlightToModel: function(){
		console.log("I'm syncing highlight to model");
		if (this.model.get('selected') === 'selected') {
			this.$('input').addClass('selected');		
		} else {
			this.$('input').removeClass('selected');
		}	
	},
	select: function(source){
		/*if (this.model.get('selected') === 'selected'){	
			console.log("don't reselect; it's already selected (input not hidden)");
			return;
		} else {*/
			this.trigger('childSelected', this.model.cid);
			app.vent.trigger('inputItemViewSelected', this.model.cid);
		/*}*/
		if (source === 'clickedView') {
			this.$('input').focus();	
		}
	},
	close: function(){
		console.log("close running");		
		var value = this.$('input').val();
		var trimmedValue = value.trim();

		if (trimmedValue){
			this.model.save({text: trimmedValue});
		}
	},
	updateOnEnter: function(e){
		if (e.which === 13) { //ENTER_KEY is 13
			this.close();
		}
	}
});

var InputView = Marionette.CompositeView.extend({
	childView: InputItemView,
	events: {
		'keypress': 'updateOnEnter',
		'blur .composite-input': 'close',
		'click .add-new-input-value': 'addNewInputValue'
	},
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
	},
	onRender: function(){
		var prepopulatedValue = this.model.get('name');
		this.$('.composite-input').val(prepopulatedValue);
	},
	close: function(){
		console.log("composite view close running");		
		var value = this.$('.composite-input').val();
		var trimmedValue = value.trim();

		if (trimmedValue){
			this.model.save({name: trimmedValue});
		}
		console.log("saved composite view name: " + this.model.get('name'));
	},
	updateOnEnter: function(e){
		if (e.which === 13) { //ENTER_KEY is 13
			this.close();
		}
	},
	addNewInputValue: function(){
		console.log("Add new input value button clicked");
		this.collection.create();
		app.vent.trigger('newInputValueAdded');
		app.resetSelection();
	}
});

var InputsView = Marionette.CollectionView.extend({
	childView: InputView
});

//Output Views
var OutputItemView = Marionette.ItemView.extend({
	template: "#output-item-view",
	initialize: function(){
		this.listenTo(this.model, 'change:selected', this.syncHighlightToModel);
		this.listenTo(this.model, 'forceRender', this.render);
		this.syncHighlightToModel();
	},
	events: {
		'click': function(){this.select('clickedView')},
		'focusin input': function(){this.select('focusInput')},
		'keypress': 'updateOnEnter',
		'blur input': 'close'
	},
	onRender: function(){
		var prepopulatedValue = this.model.get('text');
		this.$('input').val(prepopulatedValue);
	},
	syncHighlightToModel: function(){
		console.log("I'm syncing highlight to model");
		if (this.model.get('selected') === 'selected') {
			this.$('input').addClass('selected');		
		} else {
			this.$('input').removeClass('selected');
		}	
	},
	select: function(source){
		/*if (this.model.get('selected') === 'selected'){	
			console.log("don't reselect; it's already selected (input not hidden)");
			return;
		} else {*/
			this.trigger('childSelected', this.model.cid);
			app.vent.trigger('outputItemViewSelected', this.model.cid);
		/*}*/
		if (source === 'clickedView') {
			this.$('input').focus();	
		}
	},
	close: function(){
		console.log("close running");		
		var value = this.$('input').val();
		var trimmedValue = value.trim();

		if (trimmedValue){
			this.model.save({text: trimmedValue});
		}
	},
	updateOnEnter: function(e){
		if (e.which === 13) { // ENTER_KEY is 13
			this.close();
		}
	}
});

var OutputView = Marionette.CompositeView.extend({
	events: {
		'keypress': 'updateOnEnter',
		'blur .composite-input': 'close'
	},
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
	},
	onRender: function(){
		var prepopulatedValue = this.model.get('name');
		this.$('.composite-input').val(prepopulatedValue);
	},
	close: function(){
		console.log("composite view close running");		
		var value = this.$('.composite-input').val();
		var trimmedValue = value.trim();

		if (trimmedValue){
			this.model.save({name: trimmedValue});
		}
		console.log("saved composite view name: " + this.model.get('name'));
	},
	updateOnEnter: function(e){
		if (e.which === 13) { //ENTER_KEY is 13
			this.close();
		}
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
		"removeAll": "#remove-all-inputs-btn",
		"exportToCsv": "#export-btn"
	},
	events: {
		"click @ui.addInput": "addInput",
		"click @ui.removeAll": "removeAllInputs",
		"click @ui.exportToCsv": "exportToCsv"
	},
	addInput: function(){
		this.trigger('nav.addInput');
	},
	removeAllInputs: function(){
		this.trigger('nav.removeAllInputs');
	},
	exportToCsv: function(){
		this.trigger('nav.exportToCsv');
	}
});

//Start App
var app = new App();

//Begin app initialization

app.relationships = new Relationships();
app.inputs = new Inputs();
app.outputs = new Outputs();
app.prevOutputs = new Outputs();
app.prevRelationships = new Relationships();

app.inputsView = new InputsView({collection: app.inputs});
app.outputsView = new OutputsView({collection: app.outputs});
app.navView = new NavView();

app.listenTo(app.navView, 'nav.addInput', app.addInput);
app.listenTo(app.navView, 'nav.removeAllInputs', app.removeAllInputs);
app.listenTo(app.navView, 'nav.exportToCsv', app.exportToCsv);

app.computeRelationships(app.inputs, app.outputs, app.relationships);

app.myLayout.getRegion('header').show(app.navView);
app.myLayout.getRegion('inputs').show(app.inputsView);
app.myLayout.getRegion('outputs').show(app.outputsView);

app.resetSelection();