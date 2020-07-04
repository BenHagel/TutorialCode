var Player = {};
var Network = undefined;
var entities = [];	//animation components of neurons
//{
//	x, y, size, bounce,
//	
//}
var Result = undefined;
var daFont;
var dragImg;

let neuronSpacing = 120;
let startingNeuronSize = 50;

function Neuron(id, x, y, type){
	this.id = id;
	this.x = x;
	this.y = y;
	this.type = type;
	this.size = startingNeuronSize;
	this.bounce = 10 + Math.random() * 5;

	this.incoming = [];
	this.outgoing

	this.draw = () => {
		if(this.type === "input") greenNeuron();
		else if(this.type === "hidden") blueNeuron();
		else if(this.type === "output") redNeuron();

		ellipse(this.x, this.y, 
			this.size, this.size);
	};

	this.drawConnections = () => {
		//Draw connections
		stroke(180);
		for(let j = 0;j < this.incoming.length;j++){
			let ww = this.incoming[j].w;
			strokeWeight(max(1, ww));
			line(
				this.incoming[j].n.x, this.incoming[j].n.y,
				this.x, this.y
			);
		}
	};

	this.drawWeights = () => {
		//Draw connections
		stroke(240);
		textSize(12);
		textAlign(CENTER, CENTER);
		for(let j = 0;j < this.incoming.length;j++){
			let ww = this.incoming[j].w;
			ww = ww.toFixed(1);
			
			//Weight Base
			fill(40);
			noStroke();
			rect(
				(this.incoming[j].n.x + this.x) / 2,
				(this.incoming[j].n.y + this.y) / 2,
				40,25
			);

			//Weight value
			if(this.incoming[j].d > 0) fill(10, 240, 10);
			else if(this.incoming[j].d < 0) fill(240, 10, 10);
			else fill(240);
			stroke(240);
			strokeWeight(0.5);
			text(ww, (this.incoming[j].n.x + this.x) / 2, (this.incoming[j].n.y + this.y) / 2)
		}
	};
}

function redNeuron(){noStroke();fill(180, 30, 30);}
function greenNeuron(){noStroke();fill(30, 180, 35);}
function blueNeuron(){noStroke();fill(30, 80, 180);}

function preload(){
	daFont = loadFont("FiraMono.ttf");//loadFont(ServerAPI_login.baseURL);
	//dragImg = loadImage("drag.png");
}

function setup(){
	createCanvas(windowWidth, windowHeight);
	ellipseMode(CENTER);
	rectMode(CENTER);
	textFont(daFont);
	resetPlayer();
	smooth();
}
//Reset camera, and network state
function resetPlayer(){
	Player.camX = 0.0;
	Player.camY = 0.0;
	//Control
	Player.dragStartX = 0;
	Player.dragStartY = 0;
	Player.literalDragStartX = 0;
	Player.literalDragStartY = 0;
}
//Receive a state change of the network
function udpateNetwork(network){
	//First time add animation entities to canvas
	let firstTimeStatus = false;
	if(!Network) firstTimeStatus = true;

	//Update 

	//Animations done
	Network = network;

	//First time add animation entities to canvas
	if(firstTimeStatus){
		entities = [];
		for(let i = 0;i < network.neurons.length;i++){
			if(network.neurons[i].id < Network.layer_schema[0]){
				entities.push(new Neuron(network.neurons[i].id,
					getX(network.neurons[i].id) + neuronSpacing,
					getY(network.neurons[i].id) + neuronSpacing,
					"input"
				));
			}
			else if(network.neurons[i].id < Network.layer_schema[0] + Network.layer_schema[1]){
				entities.push(new Neuron(network.neurons[i].id,
					getX(network.neurons[i].id) + neuronSpacing,
					getY(network.neurons[i].id) + neuronSpacing,
					"hidden"
				));
			}
			else{
				entities.push(new Neuron(network.neurons[i].id,
					getX(network.neurons[i].id) + neuronSpacing,
					getY(network.neurons[i].id) + neuronSpacing,
					"output"
				));
			}
			//Add basis of incoming / outgoing connectoins
			entities[entities.length-1].incoming = network.neurons[i].incoming;
			entities[entities.length-1].outgoing = network.neurons[i].outgoing;
		}

		//Loop through add connectoins
		for(let i = 0;i < entities.length;i++){
			//convert ids to [Obj]
			let e = getNeuron(entities[i].id);
			for(let j = 0;j < e.incoming.length;j++){
				e.incoming[j].n = getNeuron(e.incoming[j].id);
			}
			for(let j = 0;j < e.outgoing.length;j++){
				e.outgoing[j].n = getNeuron(e.outgoing[j].id);
			}
		}
	}

	//Update neurons and weight entities normally
	else{
		//make the 
	}
}
//Get the x coordiante based on the id of the neuron
function getX(id){
	if(id < Network.layer_schema[0]){
		return startingNeuronSize * id + (id * neuronSpacing);
	}
	else if(id < Network.layer_schema[0] + Network.layer_schema[1]){
		let jj = id - Network.layer_schema[0];
		return startingNeuronSize * (jj) + (jj * neuronSpacing);
	}
	else{
		let jj = id - Network.layer_schema[0] - Network.layer_schema[1];
		return startingNeuronSize * (jj) + (jj * neuronSpacing);
	}
}
//Ge the y coordinate based on the id of the neuron
function getY(id){
	if(id < Network.layer_schema[0]){
		return startingNeuronSize * 0 + (0 * neuronSpacing)
	}
	else if(id < Network.layer_schema[0] + Network.layer_schema[1]){
		let jj = id - Network.layer_schema[0];
		return startingNeuronSize * 1 + (1 * neuronSpacing) + 
			startingNeuronSize * (jj) + (jj * neuronSpacing);
	}
	else{
		let jj = id - Network.layer_schema[0] - Network.layer_schema[1];
		return startingNeuronSize * 2 + (2 * neuronSpacing) + 
			startingNeuronSize * (jj) + (jj * neuronSpacing);
	}
}
//Update output values
function updateOutputValues(result){
	Result = result;
}

function draw(){
	//Background
	background(9);
	drawHUD();

	//Draw the environemnt
	drawEnv();
	drawNetwork();
	/*
	camera(
		width/2.0, height/2.0, (height/2.0) / tan(PI*30.0 / 180.0),
		0, 1, 1,
		0, 0, 1);
	*/
	fill(255);
}

function drawHUD(){
	push();
		translate(-width/2 + Player.camX, 
			-height/2 + Player.camY);
		fill(255);
		stroke(1);
		rect(300, 300, 0, 0);
	pop();
}

function drawEnv(){
	strokeWeight(2);
	stroke(160);
	push();
		translate(width/2 + Player.camX, height/2 + Player.camY);
		line(0,-2000, 0, 2000);
		line(-2000, 0, 2000, 0);
	pop();
}



function getNeuron(id){
	for(let i = 0;i < entities.length;i++){
		if(entities[i].id === id) return entities[i];
	}
}

function drawNetwork(){
	//Draw the network
	if(Network){
		translate(width/2 + Player.camX, height/2 + Player.camY);

		
		//Draw Connections
		for(let i = 0;i < entities.length;i++){
			entities[i].drawConnections();
		}

		//Draw pulses
		stroke(250, 250, 42);
		strokeWeight(4);
		for(let i = 0;i < Network.oracle.nexts.length;i++){
			let n = getNeuron(Network.oracle.nexts[i].f);
			let o = getNeuron(Network.oracle.nexts[i].o);
			line(
				n.x, n.y,
				o.x, o.y
			);
		}

		//Draw Weights
		for(let i = 0;i < entities.length;i++){
			entities[i].drawWeights();
		}

		//Draw Neurons
		for(let i = 0;i < entities.length;i++){
			entities[i].draw();
		}




	}
}

function keyPressed(){
	//B.keyPressed();
}

function keyReleased(){
	//B.keyReleased();
}

function mouseDragged(){
	Player.camX = Player.dragStartX + mouseX - Player.literalDragStartX;
	Player.camY = Player.dragStartY + mouseY - Player.literalDragStartY;
}

function mousePressed(){
	Player.dragStartX = Player.camX;
	Player.dragStartY = Player.camY;
	Player.literalDragStartX = mouseX;
	Player.literalDragStartY = mouseY;
}

function mouseReleased(){
	Player.dragEndX = mouseX;
	Player.dragEndY = mouseY;
}

function windowResized(){
	resizeCanvas(windowWidth, windowHeight);
}

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