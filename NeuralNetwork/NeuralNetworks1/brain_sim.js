var {SHA3} = require('sha3');
var hasher1 = new SHA3(256);
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');

//var this.this.customRandom = new CustomRandom('s e e t h i n g .', '!');
//Some hash conversion funcntions
function toHexString(byteArray) {
	return Array.prototype.map.call(byteArray, function(byte) {
		return ('0' + (byte & 0xFF).toString(16)).slice(-2);
	}).join('');
}
	
function toByteArray(hexString) {
	var result = [];
	while (hexString.length >= 2) {
		result.push(parseInt(hexString.substring(0, 2), 16));
		hexString = hexString.substring(2, hexString.length);
	}
	return result;
}

function sigmoid(x) {
	return 1/(1+Math.pow(Math.E, -x));
}
function sigmoid_der(x) {
	let y = sigmoid(x);
	return y * (1 - y);
}
//Custom Random obj
function CustomRandom(newHash, salt){
	this.hash = "@bonisdev"+newHash;
	this.salt = salt;
	this.runs = 0;
	this.precalced = [];
	this.precalcedCounter = -1;

	this.nextHash = function(){
		hasher1.reset();
		if(this.salt){
			this.hash = toHexString(
				hasher1.update(this.hash+this.salt).digest()
			);
		}
		else{
			this.hash = toHexString(
				hasher1.update(this.hash).digest()
			);
		}
		return this.hash;
	};
	
	this.numFromHash = function(seed){
		const nBits = 52;
		seed = seed.slice(0, nBits / 4);
		const r = parseInt(seed, 16);
		let X = r / Math.pow(2, nBits); // uniformly distributed in [0; 1)
		return X;
	};

	this.random = function(){
		this.runs++;
		return this.numFromHash(this.nextHash());
	};

	this.random_pre = function(){
		this.precalcedCounter = (this.precalcedCounter + 1) % this.precalced.length;
		return this.precalced[this.precalcedCounter];
	};

	for(let p = 0;p < 1000;p++){
		this.precalced.push(this.random());
	}
}

function Neuron(temp_id) {
	this.id = temp_id;

	this.bias = OVERLORD_RAND.random()*2 - 1;

	//For recurrence 
	this.potential = 0.0;
	this.threshold = 0.0;//Gets overriden on creation
	this.momentum = 0.0;//momentum (maybe needs to get reset at tf reset)
	this.timesfired = 0;
	this.firesreceived = 0;

	//Connections
	this.incoming = [];
	this.outgoing = [];

	this.output = 0.0;
	this._output = 0.0;
	this.error = 0.0;
	this._error = 0.0;
}

function Neuron_connect(neu_from, neu_to, weight){
	let w = weight == undefined ? OVERLORD_RAND.random() : weight;
	neu_from.outgoing.push({
		"n": neu_to
	});
	neu_to.incoming.push({
		"n": neu_from,
		"w": w,
		"m": 0.0
	});
}

function Neuron_stimulate(nxts, neu, inp){
	neu.timesfired++;
	neu.output = inp;
	for(let i = 0;i < neu.outgoing.length;i++){
		let valToAdd = {
			"f": neu,
			"o": neu.outgoing[i].n,
			"v": neu.output
		};
		nxts.push(valToAdd);
	}
}

function SmartBoy(conf){

	//ID tracker
	this.ID_TEMPLATE_ = 0;

	//Setup
	this.type = conf.type;
	this.layer_schema = conf.layers;
	this.layers;//2D array of the neurons
	this.outconnections = conf.outconnections;
	this.threshold;// = conf.threshold;//If neurons need a threshold to fire
	this.momentum;// = conf.momentum;
	this.debug = conf.debug;

	//SmartBoy Specific
	this.oracle = {
		"timeindex": conf.oracle_timeindex,
		//"weightgrowth": 1.0001,
		"nexts": []		//{"o": object pointer to where signal is going, "v": value of the signal}
	};
	if(this.debug) console.log('Oracle Configurations:', JSON.stringify(this.oracle));


	//Perceptron scaffolding
	//this.layers = [allInputs, allTheHiddens, allOutputNeurons]
	this.layers = new Array(conf.layers.length);
	for(let i = 0;i < this.layers.length;i++){
		let lyr = [];
		for(let j = 0;j < conf.layers[i];j++){
			lyr.push(new Neuron(this.ID_TEMPLATE_));
			this.ID_TEMPLATE_++;
		}
		this.layers[i] = lyr;
	}

	//Helper function needs to be declared up here before connect
	this.getNeuronByID = (idd = 0) => {
		for(let b = 0;b < this.layers.length;b++){
			for(let c = 0;c < this.layers[b].length;c++){
				if(idd === this.layers[b][c].id) return this.layers[b][c];
			}
		}
		return null;
	};
	


	this.activate = (inputs) => {
		for(let j = 0;j < this.layers[0].length;j++){
			Neuron_stimulate(
				this.oracle.nexts, 
				this.layers[0][j], 
				inputs[j]
			);
		}
	};

	this.resetFiredCount = () => {
		for(let i = 0;i < this.layers.length;i++){
			for(let j = 0;j < this.layers[i].length;j++){
				this.layers[i][j].timesfired = 0;
				this.layers[i][j].firesreceived = 0;
			}
		}
	};

	this.step = () => {
		this.oracle.timeindex++;
		let neuronsCheckedSoFar = [];

		while(this.oracle.nexts.length > 0){
			let signal = this.oracle.nexts.shift();
			let neu = signal.o;

			if(neuronsCheckedSoFar.indexOf(neu) === -1){
				neuronsCheckedSoFar.push(neu);
			}
			else{
			}
			
			//Add the val of this signal to the potential
			var getWeight = function(nnn, neufrom){
				for(let i = 0;i < nnn.incoming.length;i++) 
					if(nnn.incoming[i].n === neufrom) return nnn.incoming[i];
			};
			let ww = getWeight(neu, signal.f);
			neu.potential += ww.w * signal.v;
			neu.firesreceived++;
		}

		//While there are neurons to fire?
		for(let k = 0;k < neuronsCheckedSoFar.length;k++){
			if(true){//neuronsCheckedSoFar[k].potential + neuronsCheckedSoFar[k].bias >= neuronsCheckedSoFar[k].threshold){
				let spillage = neuronsCheckedSoFar[k].potential - neuronsCheckedSoFar[k].threshold;//TODO <- this could mean something

				neuronsCheckedSoFar[k].output = sigmoid(neuronsCheckedSoFar[k].potential + neuronsCheckedSoFar[k].bias);// + spillage/neuronsCheckedSoFar[k].threshold;//neuronsCheckedSoFar[k].potential / neuronsCheckedSoFar[k].threshold;//1.0;
				neuronsCheckedSoFar[k]._output = sigmoid_der(neuronsCheckedSoFar[k].potential + neuronsCheckedSoFar[k].bias);

				neuronsCheckedSoFar[k].potential = 0.0;//spillage/2.5;// 0;//+ spillage *0.01? lol maybe
				neuronsCheckedSoFar[k].timesfired++;
				neuronsCheckedSoFar[k].lastfired = this.oracle.timeindex;

				//Send nexts out
				for(let i = 0;i < neuronsCheckedSoFar[k].outgoing.length;i++){
					let valToAdd = {
						"f": neuronsCheckedSoFar[k],
						"o": neuronsCheckedSoFar[k].outgoing[i].n,
						"v": neuronsCheckedSoFar[k].output
					};
					this.oracle.nexts.push(valToAdd);
				}
			}
			//Neuron cannot fire!
			else{

			}
		}

		let theOuts = [];
		for(let c = 0;c < this.layers[this.layers.length-1].length;c++){
			//console.log(this.layers[this.layers.length-1][c].id);
			theOuts.push(this.layers[this.layers.length-1][c].output + 0);
			this.layers[this.layers.length-1][c].output = 0;
		}
		return theOuts;
	};

	this.sb_train_supervised2 = (aveoutputs, targetoutputs, learningrate) => {
		let totalError = 0.0;
		let activeNeurons = [];
		let neuronsAlreadyLookedAt = [];//neuronsAlreadyLookedAt.push(neu); not necessary will nvr connect ot an output

		//List all the neurons that are outputs under active, (error propogates backwards now)
		for(let v = 0;v < this.layers[2].length;v++){
			let e = aveoutputs[v] - targetoutputs[v]; //1 got 0.3, move .7 UP
			this.layers[2][v].error = e;
			totalError += Math.abs(e);
			activeNeurons.push(this.layers[2][v]);
		}
		
		//While there are active neurons that need fixin
		do{
			for(let j = activeNeurons.length-1;j > -1;j--){
				//Loop through inputs and update the incoming weights
				let sum = 0.0;
				//If there are any outputs to this neuron then have to calculate the error ourselves
				if(activeNeurons[j].outgoing.length > 0){
					//Loop through outputs gather up error
					for(let k = 0;k < activeNeurons[j].outgoing.length;k++){
						//Loop through the inputs of the neuron that is receiving the spike to update that weight
						for(let h = 0;h < activeNeurons[j].outgoing[k].n.incoming.length;h++){
							//Found the memory address that controls the weight
							if(activeNeurons[j].outgoing[k].n.incoming[h].n === activeNeurons[j]){
								let oldWeight = activeNeurons[j].outgoing[k].n.incoming[h].w;
								activeNeurons[j].outgoing[k].n.incoming[h].w -=
									learningrate * 
									activeNeurons[j].outgoing[k].n.error * 
									activeNeurons[j].output * 
									(activeNeurons[j].timesfired / activeNeurons[j].outgoing[k].n.firesreceived);
								activeNeurons[j].outgoing[k].m = 
									(activeNeurons[j].outgoing[k].n.incoming[h].w - oldWeight) / 
									Math.min(activeNeurons[j].outgoing[k].n.incoming[h].w, oldWeight);
								activeNeurons[j].outgoing[k].m += 
									(activeNeurons[j].outgoing[k].m < 0) ? -1 : 1;
								sum += 
									activeNeurons[j].outgoing[k].n.error * 
									activeNeurons[j].outgoing[k].n.incoming[h].w;
							}
						}
					}
				}
				//No outputs, so the error was already assigned to us in the output layer
				else{
					sum = activeNeurons[j].error;
				}
				
				
				activeNeurons[j].error = sum * activeNeurons[j]._output;

				//Updat ethe bais
				activeNeurons[j].bias -= learningrate * activeNeurons[j].error;

				//Find next neurons to propgate through
				for(let k = 0;k < activeNeurons[j].incoming.length;k++){
					if(neuronsAlreadyLookedAt.indexOf(activeNeurons[j].incoming[k].n) === -1){
						neuronsAlreadyLookedAt.push(activeNeurons[j].incoming[k].n);
						activeNeurons.push(activeNeurons[j].incoming[k].n);
					}
					//else{dont bother updating, already looked at once... 0_o} TODO maybe more?
				}

				activeNeurons.splice(j, 1);
			}
		} while(activeNeurons.length > 0);

		return totalError;
	};

	this.calculateDiagnostics = () => {
		//Calculate longest path per each output to get to each input
		//Active routes
		let activeRoutes = [];//{a: [2, 21, 78, 32]}
		let winningRoutes = [];
		//Neurons already visited
		let idsHitAlready = [];//[34, 12, 8, 3]

		//Start at the outputs, add all the starting routes
		for(let i = 0;i < this.layers[2].length;i++){
			let newPath = {};
			newPath.a = [];
			newPath.a.push(this.layers[2][i].id);
			idsHitAlready.push(this.layers[2][i].id);
			activeRoutes.push(newPath);
		}

		//Set the list of ids that are inputs
		let inputIds = [];
		for(let i = 0;i < this.layers[0].length;i++){
			inputIds.push(this.layers[0][i].id);
		}

		//WHile less than 90% of the neurons have not been looked ay YET
		while(idsHitAlready.length !== this.layers[0].length + this.layers[1].length + this.layers[2].length){//< (0.0+(this.ID_TEMPLATE_ - this.layers[0].length)) * 0.96){
			for(let i = activeRoutes.length-1;i > -1;i--){
				let thisNeur = this.getNeuronByID(activeRoutes[i].a[activeRoutes[i].a.length-1]);
	
				//Check if neuron IS an input
				if(inputIds.indexOf(thisNeur.id) > -1){
					//WINNER CAWSE
					//console.log("ROUTE FOUND", activeRoutes[i].a.length);
					//console.log(activeRoutes[i].a);
					winningRoutes.push({"a": [...activeRoutes[i].a]});//add to winner!
					//activeRoutes.splice(i, 1);//remove that boy from active
				}
				//NOT YET an input
				else{
					//Get keys
					let tgs = Object.keys(thisNeur.incoming.targets);
					//variable for keeping track of if a path has yielded any new viable paths
					let newPathsMade = 0;
					for(let j = 0;j < tgs.length;j++){
						let num_id = Number(tgs[j]);
						//Doesnt exist in alraeedy checked 
						if(idsHitAlready.indexOf(num_id) === -1){
							//ADD NEW ROUTE (TODO= remove old one)
							activeRoutes.push({
								"a": [...activeRoutes[i].a]
							});
							activeRoutes[activeRoutes.length-1].a.push(num_id);
	
							//If not an input id, add it to already seen 
							if(inputIds.indexOf(num_id) === -1){
								idsHitAlready.push(num_id);
							}
							newPathsMade++;
						}
						//Does exist in already checked, leave
						else{
	
						}
					}
				}
				activeRoutes.splice(i, 1);
			}
		}///ALL VICTORY ROUTES FROM OUTPUT TO INPUT
		console.log("Winning Routes:", winningRoutes.length);

		//Time Index gaps from inputs
		let timeIndexGaps = [];
		//Now calculate the average + Min/Max wait time between neuron firings
		let minGap = 9999999;
		let maxGap = 0;
		let negativeOneConnections = 0;//# of connections that have never had information flow through them

		for(let i = 0;i < this.layers.length;i++){
			for(let j = 0;j < this.layers[i].length;j++){
				let ins = Object.keys(this.layers[i][j].incoming.lastactive);
				for(let k = 0;k < ins.length;k++){
					if(this.layers[i][j].incoming.lastactive[ins[k]] !== -1){
						//console.log(i, j, ins[k], this.layers[i][j].incoming.lastactive[ins[k]]);
						let g = this.oracle.timeindex - this.layers[i][j].incoming.lastactive[ins[k]];
						timeIndexGaps.push(g);
						if(g > maxGap) maxGap = g;
						else if(g < minGap) minGap = g;
					}
					else{
						negativeOneConnections++;
						//console.log("SUM NEGTIVES id", this.layers[i][j].id, );
					}
				}
			}
		}

		let ave = 0.0;
		for(let jj = 0;jj < timeIndexGaps.length;jj++){
			ave += timeIndexGaps[jj];
		}
		ave /= (timeIndexGaps.length+0.0);

		console.log("min", minGap);
		console.log("ave", ave);
		console.log("max", maxGap);
		console.log(timeIndexGaps.length, " gaps");
		console.log("negativeOneConnections", negativeOneConnections);
		console.log('recorded at oracle.timeindex', this.oracle.timeindex);
		//inputs listings
		console.log('input list for output cells');
		for(let y = 0;y < this.layers[this.layers.length-1].length;y++){
			console.log(Object.keys(
				this.layers[this.layers.length-1][y].incoming.lastactive
			));
		}
	};
	
	this.showWeightsOfNet = () =>{
		for(let i = 0;i < this.layers.length;i++){
			console.log('layer_', i);
			for(let j = 0;j < this.layers[i].length;j++){
				let wss = ""+this.layers[i][j].id+"[tf:" + this.layers[i][j].timesfired + "][fr:" + this.layers[i][j].firesreceived + "][bias:" + this.layers[i][j].bias + "][thrs:" + this.layers[i][j].threshold + "]-----";
				for(let k = 0;k < this.layers[i][j].incoming.length;k++){
					wss += this.layers[i][j].incoming[k].n.id + "," + this.layers[i][j].incoming[k].w + " | ";
				}
				console.log(wss);
			}
		}
	};

	this.getNetworkState = () => {
		let net = {};
		net.type = this.type;
		net.outconnections = this.outconnections;
		net.layer_schema = this.layer_schema;
		net.neurons = [];
		
		for(let k = 0;k < this.layers.length;k++){
			for(let i = 0;i < this.layers[k].length;i++){
				let n = {};
				n.id = this.layers[k][i].id;
				n.bias = this.layers[k][i].bias;
				n.potential = this.layers[k][i].potential;
				n.threshold = this.layers[k][i].threshold;
				n.momentum = this.layers[k][i].momentum;
				n.timesfired = this.layers[k][i].timesfired;

				n.incoming = this.layers[k][i].incoming.map(function(inn){
					return {"id": inn.n.id, "w": inn.w, "m": inn.m, "d": 0.0};//added 'd'
				});

				n.outgoing = this.layers[k][i].outgoing.map(function(ouut){
					return {"id": ouut.n.id};
				});

				n.output = this.layers[k][i].output;
				n._output = this.layers[k][i]._output;
				n.error = this.layers[k][i].error;
				n._error = this.layers[k][i]._error;

				net.neurons.push(n);
			}
		}
		
		net.oracle = {
			"timeindex": this.oracle.timeindex,
			"nexts": this.oracle.nexts.map(function(nnn){
				return {"f": nnn.f.id, "o": nnn.o.id, "v": nnn.v}
			})
		};

		return net;
	};
}



//TESTING
var app = express();

//Star the server?
var startServer = false;

const fs = require('fs');
let OVERLORD_RAND = new CustomRandom("snxeaky seed", "adfff");



//Define hero
var hero2 = new SmartBoy({
	"type": "smartboy",// smartboy
	"layers": 
		[2, 6, 1],//The policy network
	"outconnections": 2,//maybe make 2 later??? idk
	"debug": true,
	"oracle_timeindex": 0
});

//First layer
Neuron_connect(hero2.layers[0][0], hero2.layers[1][0]);
Neuron_connect(hero2.layers[0][0], hero2.layers[1][1]);

Neuron_connect(hero2.layers[0][1], hero2.layers[1][0]);
Neuron_connect(hero2.layers[0][1], hero2.layers[1][1]);

//Hiddnes 1
/*Neuron_connect(hero2.layers[1][0], hero2.layers[1][2]);
Neuron_connect(hero2.layers[1][0], hero2.layers[1][3]);
Neuron_connect(hero2.layers[1][1], hero2.layers[1][2]);
Neuron_connect(hero2.layers[1][1], hero2.layers[1][3]);

Neuron_connect(hero2.layers[1][2], hero2.layers[1][4]);
Neuron_connect(hero2.layers[1][2], hero2.layers[1][5]);
Neuron_connect(hero2.layers[1][3], hero2.layers[1][4]);
Neuron_connect(hero2.layers[1][3], hero2.layers[1][5]);

Neuron_connect(hero2.layers[1][4], hero2.layers[1][0]);
Neuron_connect(hero2.layers[1][4], hero2.layers[1][1]);
Neuron_connect(hero2.layers[1][5], hero2.layers[1][0]);
Neuron_connect(hero2.layers[1][5], hero2.layers[1][1]);
*/
//Outputs
Neuron_connect(hero2.layers[1][0], hero2.layers[2][0]);
Neuron_connect(hero2.layers[1][1], hero2.layers[2][0]);


console.log("Weights before:::");
hero2.showWeightsOfNet();
console.log("===================================================================================================");


//what a [8, 220, 1] stable smart boy should look like
//RUN for 10 minutes
/*let training_data_for_xor = [
	{"inputs": [0, 0], "outputs": [0]},
	{"inputs": [0, 1], "outputs": [1]},
	{"inputs": [1, 0], "outputs": [1]},
	{"inputs": [1, 1], "outputs": [0]}
];*/
let training_data_for_xor = [
	{"inputs": [0, 0], "outputs": [0]},
	{"inputs": [0, 1], "outputs": [1]},
	{"inputs": [1, 0], "outputs": [1]},
	{"inputs": [1, 1], "outputs": [0]}
];

//Firing sequence - 
//Process of: inputing X amount of times, summing the error, and returning
//In this case, activate() x 1, step() x 4

function runSequence(ins){
	hero2.resetFiredCount();

	let results = new Array(hero2.layers[2].length);
	for(let h = 0;h < results.length;h++) results[h] = 0;
	let primerTime = 1;
	let totalThoughtTime = 5 * primerTime;
	let outsGathered = 0;

	for(let i = 0;i < totalThoughtTime;i++){
		hero2.activate(ins);
		let res = hero2.step();
		//console.log(res);
		if(i >= primerTime){
			results = res.map(function(x, ind){return x + results[ind];});
			//console.log(results);
			outsGathered+=1.0;
		}
	}

	return results.map(x => x / (0.0 + outsGathered));
}

//console.log(runSequence([1,1]));

//Training sequence -
//Process of training our network
function trainOurNetwork_V1(tval){
	let trainingRounds = tval;

	//Loop through the training data set
	for(let trainHowManyTimes = 0;trainHowManyTimes < trainingRounds;trainHowManyTimes+=1){
		//console.log("BEGIN ROUND________"+trainHowManyTimes);
	
		let tdset = trainHowManyTimes % training_data_for_xor.length;
	
		let calculatedOutput = runSequence(training_data_for_xor[tdset].inputs);
	
		//Try back prop now
		hero2.sb_train_supervised2(calculatedOutput, training_data_for_xor[tdset].outputs, 0.76);
	}
	console.log('\nTRAINED', trainingRounds, 'rounds :\n');
}

trainOurNetwork_V1(70000);





////////TTTTTTTESSSSSSSSSSSSSTTTTTTTTTTTTTTTT
////////TTTTTTTESSSSSSSSSSSSSTTTTTTTTTTTTTTTT
////////TTTTTTTESSSSSSSSSSSSSTTTTTTTTTTTTTTTT

console.log("Weights After:::");
hero2.showWeightsOfNet();


console.log('\nXOR________:\n');
for(let tdset = 0;tdset < training_data_for_xor.length;tdset++){

	let gottenVal = runSequence(training_data_for_xor[tdset].inputs);

	console.log("got:", gottenVal);
	console.log("wanted:", training_data_for_xor[tdset].outputs);
	console.log("----");
}



if(startServer){
	app.use(express.static('public'));
	// parse application/x-www-form-urlencoded
	app.use(bodyParser.urlencoded({ extended: false }));
	// parse application/json
	app.use(bodyParser.json());

	app.get('/', function (req, res) {
		res.sendFile(path.join(__dirname + '/public/canvas.html'));
	});
	app.post('/api', function(req, res){
		//Return the state of the network
		if(req.body.cmd === "network_status"){

			console.log(req.body);

			res.json({"net": hero2.getNetworkState()});
		}
		else if(req.body.cmd === "network_activate"){
			hero2.activate([1, 1]);
			res.json({"net": hero2.getNetworkState()});
		}
		else if(req.body.cmd === "network_step"){
			let result = hero2.step();
			res.json({"net": hero2.getNetworkState(), "result": result});
		}
		else if(req.body.cmd === "network_train"){
			trainOurNetwork_V1(1000);
			res.json({"net": hero2.getNetworkState()});
		}
		else{
			//error
			res.json({"uwu": "JUJU"});
		}
	});
	app.get('/state', function (req, res) {
		//STEP move forward
		console.log("steps before:", hero2.oracle.nexts.length);
		console.log(hero2.step());
		console.log("outs ^^^^");
		console.log('next steps:', hero2.oracle.nexts.length);

		//Compile all the nexts going to and from 
		for(let h = 0;h < hero2.oracle.nexts.length;h++){
			//console.log(hero2.oracle.nexts[h]);
			//if(hero2.oracle.nexts[h].o == req.query.ind) console.log(hero2.oracle.nexts[h])
		}

		console.log("req.query.cmd, req.query.ind", req.query.cmd, req.query.ind);
		console.log(hero2.getNeuronInfo(Number(req.query.ind)));

		//console.log(hero2.oracle.nexts);
		console.log('=========');
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', '*');
		res.setHeader('Access-Control-Allow-Headers', '*');
		res.setHeader('Access-Control-Allow-Credentials', true);
		res.json(hero2.getNeuronInfo(Number(req.query.ind)));
	});
	app.listen(8080);
}