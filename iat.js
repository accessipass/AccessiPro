
define(['pipAPI','pipScorer'], function(APIConstructor,Scorer) {
// This wrapper is neccesary in order to activate the API

	var API = new APIConstructor();
	var scorer = new Scorer();

	// lets set the attibutes/concepts in one place so we can change them when we want
	var attribute1 = 'Mots positifs';
	var attribute2 = 'Mots négatifs';
	var concept1 = 'Handicap';
	var concept2 = 'Valide';


	// ### Settings
	/*
		Settings
		***********************************************************
	*/

	// set the canvas size
	API.addSettings('canvas',{
		maxWidth: 800,
		proportions : 0.8
	});

	// setting the base urls for images and templates
	API.addSettings('base_url',{
        image : window.location.origin+window.location.pathname + '/js/resources/images/',
		template : 'resources/IAT/'
	});

	// setting the way the logger works (how often we send data to the server and the url for the data)
	/*API.addSettings('logger',{
		pulse: 20,
		url : '/PiPlayerCned'
	});*/


	// ### Trials
	/*
		Trials
		***********************************************************
	*/

	// #### Default trial
	// This trial serves as the default for all IAT trials (excluding instructions)
	API.addTrialSets('Default',{
		// By default each trial is correct, this is modified in case of an error
		data: {score:0},

		// Set the interface for trials.
		// In this case **e** and **i** are used for left and right.
		// And in case this is a touch scenario we present appropriate touch elements.
		input: [
			{handle:'enter',on:'enter'},
			{handle:'left',on:'keypressed',key:'e'},
			{handle:'right',on:'keypressed',key:'i'},
			{handle:'left',on:'leftTouch',touch:true},
			{handle:'right',on:'rightTouch',touch:true}
		],

		// Constant elements in the display, in this case: the user instructions: left / right.
		// Here we inherit the layout stimuli from the layout set.
		layout: [
			{inherit:{type:'byData',set:'layout',data:'left'}},
			{inherit:{type:'byData',set:'layout',data:'right'}}
		],

		// User interactions.
		// This is where we set the rules for the player behaviour (cases and responses).
		interactions: [
			// ##### At the begining of a trial
			// Display the stimulus imidiately.
			{
				conditions: [{type:'begin'}],
				actions: [
					{type:'showStim',handle:'target'}
				]
			},

			// ##### Correct
			// The input handle (either left or right) should be equal to the stimulus.data.side attribute.
			{
				// If the input handle is equal to the "side" attribute of stimulus.data
				conditions: [{type:'inputEqualsStim',property:'side'}],
				// * Don't allow any further interactions.
				// * Hide all stimuli.
				// * Log this trial.
				// * Trigger the `trialEnd` action after the ITI.
				actions: [
					{type:'removeInput',handle:['left','right']},
					{type:'hideStim', handle: 'All'},
					{type:'log'},
					{type:'setInput',input:{handle:'end', on:'timeout',duration:250}}
				]
			},

			// ##### error
			{
				// If this is a click interaction.
				// But input handle is unequal to the "side" attribute of stimulus.data.
				conditions: [
					{type:'inputEquals',value:['right','left']},
					{type:'inputEqualsStim',property:'side',negate:true}
				],
				// * Display error stimulus
				// * Set the score to 1 (error).
				actions: [
					{type:'showStim',handle:'error'},
					{type:'setTrialAttr', setter:{score:1}}
				]
			},

			// ##### end after ITI
			// This interaction is triggered by a timout after a correct response.
			// It allows us to pad each trial with an interval.
			{
				// Trigger when input handle is "end".
				conditions: [{type:'inputEquals',value:'end'}],
				actions: [
					{type:'endTrial'}
				]
			},

			// ##### Skip block
			// This interaction has more to do with debugging than with the actual task.
			// It allows the user to skip a whole block all the way to the begining of the next block.
			// Note that every instruction block is marked with `blockStart:true` so that `nextWhere` knows were to go.
			{
				conditions: [{type:'inputEquals',value:'enter'}],
				actions: [
					{type:'goto', destination: 'nextWhere', properties: {blockStart:true}},
					{type:'endTrial'}
				]
			}
		]
	});

	// #### Introduction Trial
	// Here, we create a generic introduction trial, to be inherited by all other introduction trials.
	API.addTrialSets("introduction", {

		// Set `block` as "generic" so we can inherit it later.
		data: {block: 'generic'},

		// Create user interface (just click space to move on...)
		input: [
			{handle:'space',on:'space'},
			{handle:'space',on:'bottomTouch',touch:true},
			{handle:'enter',on:'enter'}
		],

		// Display fixed layout (this is the same layout we use for the trials themselves)
		layout:[
			{inherit:{type:'byData',set:'layout',data:'left'}},
			{inherit:{type:'byData',set:'layout',data:'right'}}
		],

		interactions: [
			// ##### At the begining of a trial
			// Display the instructions imidiately.
			{
				conditions: [{type:'begin'}],
				actions: [
					{type:'showStim',handle:'All'}
				]
			},

			// ##### End trial
			// End the instructions as soon as space is clicked
			{
				conditions: [{type:'inputEquals',value:'space'}],
				actions: [{type:'endTrial'}]
			},

			// ##### Skip block
			// This interaction has more to do with debugging than with the actual task.
			// It allows the user to skip a whole block all the way to the begining of the next block.
			// Note that every instruction block is marked with `blockStart:true` so that `nextWhere` knows were to go.
			{
				conditions: [{type:'inputEquals',value:'enter'}],
				actions: [
					{type:'goto', destination: 'nextWhere', properties: {blockStart:true}},
					{type:'endTrial'}
				]
			}
		]
	});

	// #### Blocks
	// Now that we have created the generic trials for our task we can go on and create a specific variation for each individual block.
	// They will be fully incorporated into the player in the sequence section </br>
	// The IAT has seven blocks. The first and the fifth are concept blocks and the second is an attribute block.
	// The rest of the blocks are composed of concepts and attributes where the third and forth have the same combination, and the sixth and seventh have the opposing combination.
	API.addTrialSets("IAT", [

		// ##### block1
		// This is a concept block with concept 1 on the left.
		{
			data: {
				// In each block we mark the block number (for logging and so we can pick this trial for inheritance).
				block:1,
				// We also insert the concept name (so that the layout templates know what to show).
				left2:concept1, right2:concept2,
				// Finaly, we set the condition for the scorer.
				condition: concept1 + '/' + concept2
			},
			// We inherit the default trial.
			inherit: 'Default',
			// Here we set the stimuli:
			// The first with the target stimulus, and the second for error feedback if we need it.
			stimuli: [
				{inherit:{type:'exRandom',set:'concept1_left'}},
				{inherit:{type:'random',set:'feedback'}}
			]
		},

		// ##### block2
		// This is an attribute block with attribute 1 on the left.
		{
			data: {block:2, left1 : attribute1, right1:attribute2, condition: attribute1 + '/' + attribute2},
			inherit: 'Default',
			stimuli: [
				{inherit:{type:'exRandom',set:'attribute1_left'}},
				{inherit:{type:'random',set:'feedback'}}
			]
		},

		// ##### block3
		// This is a combined block with both concept 1 and attribute 1 on the left.
		// It is composed of two types of trials one that displays a concept and one that displays an attribute.
		{
			data: {
				// For combined trials we add the row property so we can distinguish between the trials when inheriting
				block:3,row:1,
				left1:attribute1, right1:attribute2, left2:concept1, right2:concept2,
				condition: attribute1 + ',' + concept1 + '/' + attribute2 + ',' + concept2,
				// This block is also marked as part of a for the scorer
				parcel:'first'
			},
			inherit: 'Default',
			stimuli: [
				{inherit:{type:'exRandom',set:'concept1_left'}},
				{inherit:{type:'random',set:'feedback'}}
			]
		},

		{
			data: {block:3, row:2, left1:attribute1, right1:attribute2, left2:concept1, right2:concept2, 
			       condition: attribute1 + ',' + concept1 + '/' + attribute2 + ',' + concept2,parcel:'first'},
			inherit: 'Default',
			stimuli: [
				{inherit:{type:'exRandom',set:'attribute1_left'}},
				{inherit:{type:'random',set:'feedback'}}
			]
		},

		// ##### block4
		// This is a combined block - the same as block 3.
		{
			data: {block:4, row:1, left1:attribute1, right1:attribute2, left2:concept1, right2:concept2, 
			       condition: attribute1 + ',' + concept1 + '/' + attribute2 + ',' + concept2,parcel:'first'},
			inherit: 'Default',
			stimuli: [
				{inherit:{type:'exRandom',set:'concept1_left'}},
				{inherit:{type:'random',set:'feedback'}}
			]
		},

		{
			data: {block:4, row:2, left1:attribute1, right1:attribute2, left2:concept1, right2:concept2, 
			       condition: attribute1 + ',' + concept1 + '/' + attribute2 + ',' + concept2,parcel:'first'},
			inherit: 'Default',
			stimuli: [
				{inherit:{type:'exRandom',set:'attribute1_left'}},
				{inherit:{type:'random',set:'feedback'}}
			]
		},

		// ##### block5
		// This is a concept block, this time with concept 1 on the right instead of the left.
		{
			data: {block:5, left2:concept2, right2:concept1, condition: concept2 + '/' + concept1},
			inherit: 'Default',
			stimuli: [
				{inherit:{type:'exRandom',set:'concept1_right'}},
				{inherit:{type:'random',set:'feedback'}}
			]
		},

		// ##### block6
		// This is a combined block; attribute1 stayed on the left but now concept1 is on the right.
		{
			data: {block:6, row:1, left1:attribute1, right1:attribute2, left2:concept2, right2:concept1, 
			       condition: attribute1 + ',' + concept2 + '/' + attribute2 + ',' + concept1,parcel:'first'},
			inherit: 'Default',
			stimuli: [
				{inherit:{type:'exRandom',set:'concept1_right'}},
				{inherit:{type:'random',set:'feedback'}}
			]
		},

		{
			data: {block:6, row:2, left1:attribute1, right1:attribute2, left2:concept2, right2:concept1, 
			       condition: attribute1 + ',' + concept2 + '/' + attribute2 + ',' + concept1,parcel:'first'},
			inherit: 'Default',
			stimuli: [
				{inherit:{type:'exRandom',set:'attribute1_left'}},
				{inherit:{type:'random',set:'feedback'}}
			]
		},

		// ##### block7
		// This is a combined block - the same as block 6.
		{
			data: {block:7, row:1, left1:attribute1, right1:attribute2, left2:concept2, right2:concept1, 
			       condition: attribute1 + ',' + concept2 + '/' + attribute2 + ',' + concept1,parcel:'first'},
			inherit: 'Default',
			stimuli: [
				{inherit:{type:'exRandom',set:'concept1_right'}},
				{inherit:{type:'random',set:'feedback'}}
			]
		},

		{
			data: {block:7, row:2, left1:attribute1, right1:attribute2, left2:concept2, right2:concept1, 
			       condition: attribute1 + ',' + concept2 + '/' + attribute2 + ',' + concept1,parcel:'first'},
			inherit: 'Default',
			stimuli: [
				{inherit:{type:'exRandom',set:'attribute1_left'}},
				{inherit:{type:'random',set:'feedback'}}
			]
		}
	]);

	// ### Stimuli
	/*
		Stimuli
		***********************************************************
	*/

	API.addStimulusSets({
		// This Default stimulus is inherited by the other stimuli so that we can have a consistent appearance and change it from one place.
		Default: [
			{css:{color:'#56C2ED','font-size':'1.7em'}}
		],

		// This sets the appearance for the instructions.
		Instructions: [
			{css:{'font-size':'1.3em',color:'white', lineHeight:1.2},handle:'instructions'}
		],

		// #### The trial stimuli
		// Each of the following stimulus set holds the stimuli for a specific trial state (is the attribute1/category1 on the left or on the right?). </br>
		// Each set hold stimuli both stimuli that display attribute1/category1 and stimuli that display attribute2/category2.
		// The reason that the attribute/category sets repeat themselves 5 times each, is so that when we call them using exRandom, they will be balanced accross each ten trials.
		attribute1_left : [
			{data:{side:'left', handle:'target', alias:attribute1}, inherit:'Default', media: {inherit:{type:'exRandom',set:'attribute1'}}},
			{data:{side:'right', handle:'target', alias:attribute2}, inherit:'Default', media: {inherit:{type:'exRandom',set:'attribute2'}}},
			{data:{side:'left', handle:'target', alias:attribute1}, inherit:'Default', media: {inherit:{type:'exRandom',set:'attribute1'}}},
			{data:{side:'right', handle:'target', alias:attribute2}, inherit:'Default', media: {inherit:{type:'exRandom',set:'attribute2'}}},
			{data:{side:'left', handle:'target', alias:attribute1}, inherit:'Default', media: {inherit:{type:'exRandom',set:'attribute1'}}},
			{data:{side:'right', handle:'target', alias:attribute2}, inherit:'Default', media: {inherit:{type:'exRandom',set:'attribute2'}}},
			{data:{side:'left', handle:'target', alias:attribute1}, inherit:'Default', media: {inherit:{type:'exRandom',set:'attribute1'}}},
			{data:{side:'right', handle:'target', alias:attribute2}, inherit:'Default', media: {inherit:{type:'exRandom',set:'attribute2'}}},
			{data:{side:'left', handle:'target', alias:attribute1}, inherit:'Default', media: {inherit:{type:'exRandom',set:'attribute1'}}},
			{data:{side:'right', handle:'target', alias:attribute2}, inherit:'Default', media: {inherit:{type:'exRandom',set:'attribute2'}}}
		],
		attribute1_right : [
			{data:{side:'left', handle:'target', alias:attribute2}, inherit:'Default', media: {inherit:{type:'exRandom',set:'attribute2'}}},
			{data:{side:'right', handle:'target', alias:attribute1}, inherit:'Default', media: {inherit:{type:'exRandom',set:'attribute1'}}},
			{data:{side:'left', handle:'target', alias:attribute2}, inherit:'Default', media: {inherit:{type:'exRandom',set:'attribute2'}}},
			{data:{side:'right', handle:'target', alias:attribute1}, inherit:'Default', media: {inherit:{type:'exRandom',set:'attribute1'}}},
			{data:{side:'left', handle:'target', alias:attribute2}, inherit:'Default', media: {inherit:{type:'exRandom',set:'attribute2'}}},
			{data:{side:'right', handle:'target', alias:attribute1}, inherit:'Default', media: {inherit:{type:'exRandom',set:'attribute1'}}},
			{data:{side:'left', handle:'target', alias:attribute2}, inherit:'Default', media: {inherit:{type:'exRandom',set:'attribute2'}}},
			{data:{side:'right', handle:'target', alias:attribute1}, inherit:'Default', media: {inherit:{type:'exRandom',set:'attribute1'}}},
			{data:{side:'left', handle:'target', alias:attribute2}, inherit:'Default', media: {inherit:{type:'exRandom',set:'attribute2'}}},
			{data:{side:'right', handle:'target', alias:attribute1}, inherit:'Default', media: {inherit:{type:'exRandom',set:'attribute1'}}}
		],
		concept1_left: [
			{data:{side:'left', handle:'target', alias:concept1}, inherit:'Default', media: {inherit:{type:'exRandom',set:'concept1'}}},
			{data:{side:'right', handle:'target', alias:concept2}, inherit:'Default', media: {inherit:{type:'exRandom',set:'concept2'}}},
			{data:{side:'left', handle:'target', alias:concept1}, inherit:'Default', media: {inherit:{type:'exRandom',set:'concept1'}}},
			{data:{side:'right', handle:'target', alias:concept2}, inherit:'Default', media: {inherit:{type:'exRandom',set:'concept2'}}},
			{data:{side:'left', handle:'target', alias:concept1}, inherit:'Default', media: {inherit:{type:'exRandom',set:'concept1'}}},
			{data:{side:'right', handle:'target', alias:concept2}, inherit:'Default', media: {inherit:{type:'exRandom',set:'concept2'}}},
			{data:{side:'left', handle:'target', alias:concept1}, inherit:'Default', media: {inherit:{type:'exRandom',set:'concept1'}}},
			{data:{side:'right', handle:'target', alias:concept2}, inherit:'Default', media: {inherit:{type:'exRandom',set:'concept2'}}},
			{data:{side:'left', handle:'target', alias:concept1}, inherit:'Default', media: {inherit:{type:'exRandom',set:'concept1'}}},
			{data:{side:'right', handle:'target', alias:concept2}, inherit:'Default', media: {inherit:{type:'exRandom',set:'concept2'}}}
		],
		concept1_right : [
			{data:{side:'left', handle:'target', alias:concept2}, inherit:'Default', media: {inherit:{type:'exRandom',set:'concept2'}}},
			{data:{side:'right', handle:'target', alias:concept1}, inherit:'Default', media: {inherit:{type:'exRandom',set:'concept1'}}},
			{data:{side:'left', handle:'target', alias:concept2}, inherit:'Default', media: {inherit:{type:'exRandom',set:'concept2'}}},
			{data:{side:'right', handle:'target', alias:concept1}, inherit:'Default', media: {inherit:{type:'exRandom',set:'concept1'}}},
			{data:{side:'left', handle:'target', alias:concept2}, inherit:'Default', media: {inherit:{type:'exRandom',set:'concept2'}}},
			{data:{side:'right', handle:'target', alias:concept1}, inherit:'Default', media: {inherit:{type:'exRandom',set:'concept1'}}},
			{data:{side:'left', handle:'target', alias:concept2}, inherit:'Default', media: {inherit:{type:'exRandom',set:'concept2'}}},
			{data:{side:'right', handle:'target', alias:concept1}, inherit:'Default', media: {inherit:{type:'exRandom',set:'concept1'}}},
			{data:{side:'left', handle:'target', alias:concept2}, inherit:'Default', media: {inherit:{type:'exRandom',set:'concept2'}}},
			{data:{side:'right', handle:'target', alias:concept1}, inherit:'Default', media: {inherit:{type:'exRandom',set:'concept1'}}}
		],

		// #### Feedback
		// This stimulus is used for giving feedback, in this case only an error notification
		feedback : [
			{handle:'error', location: {top: 80}, css:{color:'red','font-size':'4em'}, media: {word:'X'}, nolog:true}
		],

		// #### Layout
		// In this example we use templates to create the layout (you can see the templates in examples/IAT/).
		// Here we control only the general way that the layout appears.
		// The mechanics inside the templates and the fact that we set the proper data in all trials allow us to use the same stimuli for the layout of all the trials.
		layout: [
			{data:{handle:'left'},location:{left:0,top:0},css:{color:'white',fontSize:'1.7em'},media:{template:'left.jst'}},
			{data:{handle:'right'}, location:{left:'auto',right:0,top:0},css:{color:'white',fontSize:'1.7em'},media:{template:'right.jst'}}
		]
	});

	// ### Media
	/*
		Media
		***********************************************************
	*/

	// The media sets control the content of each stimulus.
	// note that the image urls are relative to the base_url set in the settings section of this file.
	API.addMediaSets({
		// #### Pleasant
		attribute1 : [
			{word: 'Joie'},
			{word: 'Amour'},
			{word: 'Paix'},
			{word: 'Formidable'},
			{word: 'Plaisir'},
			{word: 'Excellent'}
		],
		// #### Unpleasant
		attribute2: [
			{word: 'Mal'},
			{word: 'Colère'},
			{word: 'Pénible'},
			{word: 'Tristesse'},
			{word: 'Méchant'},
			{word: 'Mauvais'}
		],
		// #### disabled
		concept1: [
			{image: 'disabled1.jpg'},
			{image: 'disabled2.jpg'},
			{image: 'disabled3.jpg'},
			{image: 'disabled4.jpg'}
		],
		// #### abled
		concept2: [
			{image: 'abled1.jpg'},
			{image: 'abled2.jpg'},
			{image: 'abled3.jpg'},
			{image: 'abled4.jpg'}
		]
	});


	/*
		Regular IAT sequence
		***********************************************************
	*/
	var regularIAT = [
		// ##### block 1
		// block 1 instructions
		{
			// we set the data with the category names so the template can display them
			data: {block:1, left2:concept1, right2:concept2,blockStart:true},
			// inhertit the generic instruction block
			inherit: {set:'introduction', type:'byData', data: {block:'generic'}},
			stimuli: [{
				inherit:'Instructions',
				media:{template:'inst1.jst'}
			}]
		},
		// repeat the block 1 trial 20 times
		{
			mixer : 'repeat',
			times : 20,
			data : [
				{inherit : {type:'byData', data:{block:1}, set:'IAT'}}
			]
		},

		// ##### block 2
		// block 2 instructions
		{
			data: {block:2, left1:attribute1, right1:attribute2, blockStart:true},
			inherit: {set:'introduction', type:'byData', data: {block:'generic'}},
			stimuli: [{
				inherit:'Instructions',
				media:{template:'inst2.jst'}
			}]
		},
		{
			mixer : 'repeat',
			times : 20,
			data : [
				{inherit : {type:'byData', data:{block:2}, set:'IAT'}}
			]
		},

		// ##### block 3
		// block 3 instructions
		{
			data: {block:3, left1:attribute1, right1:attribute2, left2:concept1, right2:concept2,blockStart:true},
			inherit: {set:'introduction', type:'byData', data: {block:'generic'}},
			stimuli: [{
				inherit:'Instructions',
				media:{template:'inst3.jst'}
			}]
		},
		{
			mixer: 'repeat',
			times: 20,
			data: [
				{inherit : {type:'byData', data:{block:3,row:1}, set:'IAT'}},
				{inherit : {type:'byData', data:{block:3,row:2}, set:'IAT'}}
			]
		},

		// ##### block 4
		// block 4 instructions
		{
			data: {block:4, left1:attribute1, right1:attribute2, left2:concept1, right2:concept2,blockStart:true},
			inherit: {set:'introduction', type:'byData', data: {block:'generic'}},
			stimuli: [{
				inherit:'Instructions',
				media:{template:'inst4.jst'}
			}]
		},
		{
			mixer: 'repeat',
			times: 40,
			data: [
				{inherit : {type:'byData', data:{block:4,row:1}, set:'IAT'}},
				{inherit : {type:'byData', data:{block:4,row:2}, set:'IAT'}}
			]
		},

		// ##### block 5
		// block 5 instructions
		{
			data: {block:5, left2:concept2, right2:concept1,blockStart:true},
			inherit: {set:'introduction', type:'byData', data: {block:'generic'}},
			stimuli: [{
				inherit:'Instructions',
				media:{template:'inst5.jst'}
			}]
		},
		{
			mixer : 'repeat',
			times : 40,
			data : [
				{inherit : {type:'byData', data:{block:5}, set:'IAT'}}
			]
		},

		// ##### block 6
		// block 6 instructions
		{
			data: {block:6, left1:attribute1, right1:attribute2, left2:concept2, right2:concept1,blockStart:true},
			inherit: {set:'introduction', type:'byData', data: {block:'generic'}},
			stimuli: [{
				inherit:'Instructions',
				media:{template:'inst6.jst'}
			}]
		},
		{
			mixer: 'repeat',
			times: 20,
			data: [
				{inherit : {type:'byData', data:{block:6,row:1}, set:'IAT'}},
				{inherit : {type:'byData', data:{block:6,row:2}, set:'IAT'}}
			]
		},

		// ##### block 7
		// block 7 instructions
		{
			data: {block:7, left1:attribute1, right1:attribute2, left2:concept2, right2:concept1,blockStart:true},
			inherit: {set:'introduction', type:'byData', data: {block:'generic'}},
			stimuli: [{
				inherit:'Instructions',
				media:{template:'inst7.jst'}
			}]
		},
		{
			mixer: 'repeat',
			times: 20,
			data: [
				{inherit : {type:'byData', data:{block:7,row:1}, set:'IAT'}},
				{inherit : {type:'byData', data:{block:7,row:2}, set:'IAT'}}
			]
		}
	]; // end regular IAT sequence

	/*
		Swaped IAT sequence
		***********************************************************
	*/
	var swapedIAT = [

		// block 5
		// block 5 instructions
		{
			data: {block:5, left2:concept2, right2:concept1,blockStart:true},
			inherit: {set:'introduction', type:'byData', data: {block:'generic'}},
			stimuli: [{
				inherit:'Instructions',
				media:{template:'inst1.jst'}
			}]
		},
		{
			mixer : 'repeat',
			times : 20,
			data : [
				{inherit : {type:'byData', data:{block:5}, set:'IAT'}}
			]
		},

		// block 2
		// block 2 instructions
		{
			data: {block:2, left1:attribute1, right1:attribute2,blockStart:true},
			inherit: {set:'introduction', type:'byData', data: {block:'generic'}},
			stimuli: [{
				inherit:'Instructions',
				media:{template:'inst2.jst'}
			}]
		},
		{
			mixer : 'repeat',
			times : 20,
			data : [
				{inherit : {type:'byData', data:{block:2}, set:'IAT'}}
			]
		},

		// block 6
		// block 6 instructions
		{
			data: {block:6, left1:attribute1, right1:attribute2, left2:concept2, right2:concept1,blockStart:true},
			inherit: {set:'introduction', type:'byData', data: {block:'generic'}},
			stimuli: [{
				inherit:'Instructions',
				media:{template:'inst3.jst'}
			}]
		},
		{
			mixer: 'repeat',
			times: 20,
			data: [
				{inherit : {type:'byData', data:{block:6,row:1}, set:'IAT'}},
				{inherit : {type:'byData', data:{block:6,row:2}, set:'IAT'}}
			]
		},

		// block 7
		// block 7 instructions
		{
			data: {block:7, left1:attribute1, right1:attribute2, left2:concept2, right2:concept1,blockStart:true},
			inherit: {set:'introduction', type:'byData', data: {block:'generic'}},
			stimuli: [{
				inherit:'Instructions',
				media:{template:'inst4.jst'}
			}]
		},
		{
			mixer: 'repeat',
			times: 20,
			data: [
				{inherit : {type:'byData', data:{block:7,row:1}, set:'IAT'}},
				{inherit : {type:'byData', data:{block:7,row:2}, set:'IAT'}}
			]
		},

		// block 1
		// block 1 instructions
		{
			data: {block:1, left2:concept1, right2:concept2,blockStart:true},			// we set the data with the category names so the template can display them
			inherit: {set:'introduction', type:'byData', data: {block:'generic'}},			// inhertit the generic instruction block
			stimuli: [{
				inherit:'Instructions',
				media:{template:'inst5.jst'}
			}]
		},
		{
			mixer : 'repeat',
			times : 20,
			data : [
				{inherit : {type:'byData', data:{block:1}, set:'IAT'}}
			]
		},

		// block 3
		// block 3 instructions
		{
			data: {block:3, left1:attribute1, right1:attribute2, left2:concept1, right2:concept2,blockStart:true},
			inherit: {set:'introduction', type:'byData', data: {block:'generic'}},
			stimuli: [{
				inherit:'Instructions',
				media:{template:'inst6.jst'}
			}]
		},
		{
			mixer: 'repeat',
			times: 20,
			data: [
				{inherit : {type:'byData', data:{block:3,row:1}, set:'IAT'}},
				{inherit : {type:'byData', data:{block:3,row:2}, set:'IAT'}}
			]
		},

		// block 4
		// block 4 instructions
		{
			data: {block:4, left1:attribute1, right1:attribute2, left2:concept1, right2:concept2,blockStart:true},
			inherit: {set:'introduction', type:'byData', data: {block:'generic'}},
			stimuli: [{
				inherit:'Instructions',
				media:{template:'inst7.jst'}
			}]
		},
		{
			mixer: 'repeat',
			times: 20,
			data: [
				{inherit : {type:'byData', data:{block:4,row:1}, set:'IAT'}},
				{inherit : {type:'byData', data:{block:4,row:2}, set:'IAT'}}
			]
		}
	]; // end swaped IAT

	/*
	 *	Create the Task sequence
	 */
	API.addSequence([
		{
			mixer: 'choose',
			data: [
				{mixer:'wrapper',data:regularIAT},
				{mixer:'wrapper',data:swapedIAT}
			]
		},

		// user feedback- here we will use the computeD function.
		{
			inherit: {set:'introduction', type:'byData', data: {block:'generic'}},
			data: {blockStart:true},
			stimuli: [],
			customize: function(){
				var trial = this;
				var DScoreObj, media;

				// First parcel
				scorer.addSettings('compute',{
					parcelValue : ['first']
				});

				DScoreObj = scorer.computeD();

				media = {css:{color:'white'},media:{html:'<div><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Logo_Accessi_Pro.jpg/300px-Logo_Accessi_Pro.jpg"/><p style="font-size:20px;color=#ffffff><span style="color:#56C2ED;">Votre résultat :'+DScoreObj.DScore+'</span><br/><br/>'+DScoreObj.FBMsg+'<br><br/></p><p style="font-size:20px;color:#FFFFFF">Continuez le programme AccessiPro en cliquant sur ce lien :<br/> <a href="http://bit.ly/2arXTSD" style="color:#3DFF78;text-decoration:underline;font-size:20px;" title="Retour au programme de sensibilisation au handicap AccessiPro">Retour au programme de sensibilisation au handicap AccessiPro</a></p></div>'}};
				trial.stimuli.push(media);
				scorer.dynamicPost({
					score1: DScoreObj.DScore,
					feedback1: DScoreObj.FBMsg
				});

				// Second parcel
				//scorer.addSettings('compute',{
					//parcelValue : ['second']
				//});

				//DScoreObj = scorer.computeD();
				//media = {css:{color:'white'},media:{html:'<div><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Logo_Accessi_Pro.jpg/300px-Logo_Accessi_Pro.jpg"/><p style="font-size:16px;color=#000000><span style="color:#56C2ED;">Votre résultat :'+DScoreObj.DScore+'</span><br/><br/>'+DScoreObj.FBMsg+'<br><br/></p><p style="font-size:14px;color:#000000">Continuez le programme AccessiPro en cliquant sur ce lien :<br/><br/> <a href="http://bit.ly/2arXTSD" style="color:#23A541;" title="Retour au programme de sensibilisation au handicap AccessiPro">Retour au programme de sensibilisation au handicap AccessiPro</a></p></div>'}};
				//trial.stimuli.push(media);
				//scorer.dynamicPost({
					//score1: DScoreObj.DScore,
					//feedback1: DScoreObj.FBMsg
				//});

			}
		},

		{ //Instructions trial, the end of the task, instruction what to do next
			inherit: {set:'introduction', type:'byData', data: {block:'generic'}},
			stimuli: [
				{//The instructions stimulus
					data : {'handle':'instStim'},
					css: {color:'white'},
					media:{html:'<div><p style="font-size:16px;color:#000000">Vous avez terminé le test<br/><br/>Vous pouvez poursuivre le programme AccessiPro en cliquant sur ce lien :<br/><br/> <a href="http://bit.ly/2arXTSD" style="color:#23A541;" title="Retour au programme de sensibilisation au handicap AccessiPro">Retour au programme de sensibilisation au handicap AccessiPro</a></p></div>'}
				}
			]
		}
	]);

	// ### The scorer
	/*
		The scorer
		***********************************************************
	*/ 

	// setting scorer settings
	scorer.addSettings('compute',{
		ErrorVar:'score',
		condVar:"condition",
		//condition 1
		cond1VarValues: [
			attribute1 + ',' + concept1 + '/' + attribute2 + ',' + concept2
		],
		//condition 2
		cond2VarValues: [
			attribute1 + ',' + concept2 + '/' + attribute2 + ',' + concept1
		],
		parcelVar : "parcel",
		// parcelValue : ['first'], ==> we set the parcels individually because we want two separate computations
		fastRT : 150, //Below this reaction time, the latency is considered extremely fast.
		maxFastTrialsRate : 0.1, //Above this % of extremely fast responses within a condition, the participant is considered too fast.
		minRT : 400,
		maxRT : 10000,
		errorLatency : {use:"latency", penalty:600, useForSTD:true},//ignore error respones
		postSettings : {score:"score",msg:"feedback",url:"/implicit/scorer"}
	});

	// scorer messages
	scorer.addSettings('message',{
		MessageDef: [
			{ cut:'-0.65', message:'Vos résultats suggèrent une forte préférence implicite pour les personnes handicapées par rapport aux personnes valides.' },
			{ cut:'-0.35', message:'Vos résultats suggèrent une préférence implicite moyenne pour les personnes handicapées par rapport aux personnes valides.' },
			{ cut:'-0.15', message:'Vos résultats suggèrent une légère préférence implicite pour les personnes handicapées par rapport aux personnes valides.' },
			{ cut:'0.15', message:'Vos résultats suggèrent peu ou pas de préférence implicite entre les les personnes handicapées et les personnes valides.' },
			{ cut:'0.35', message:'Vos résultats suggèrent une légère préférence implicite pour les personnes valides par rapport aux personnes handicapées.' },
			{ cut:'0.65', message:'Vos résultats suggèrent une préférence implicite moyenne pour les personnes valides par rapport aux personnes handicapées.' },
			{ cut:'5', message:'Vos résultats suggèrent une forte préférence implicite pour les personnes valides par rapport aux personnes handicapées' }
		]
	});

	return API.script;
});
