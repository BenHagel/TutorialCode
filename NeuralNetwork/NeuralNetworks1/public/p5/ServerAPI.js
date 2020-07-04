var ServerAPI_login = {};
var neurons = [];
var general = {
    "inputs": 0,
    "hidden": 0,
    "outputs": 0,
    "nexts": [],
    "perrow": 2
};

var LOCAL_DEBUGGING = true;

if(LOCAL_DEBUGGING){
    ServerAPI_login.baseURL = 'http://localhost:8080/api';
}
else{
}

ServerAPI_login.xmlRequest = function(type, req, b, to){
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
        if(this.readyState === 4 && this.status === 200){
            to(JSON.parse(this.response));
        }
    };

    xhr.open(type, ServerAPI_login.baseURL + req, true);
    xhr.setRequestHeader('Content-type', 'application/json');
    xhr.send(JSON.stringify(b));
};


//ONLY GET AND UPDATE THE STATUS
ServerAPI_login.getStatus = function(){
    var handleResponse = function(data){
        try{
            udpateNetwork(data.net);
        }catch(err){console.log(err);}
    };

    var command = '?cmd=' + 'bh';
    ServerAPI_login.xmlRequest('POST', command, {"cmd": "network_status"}, handleResponse); 
};

//ACTIVATE W NEW INPUTS
ServerAPI_login.getActivate = function(){
    var handleResponse = function(data){
        try{
            udpateNetwork(data.net);
        }catch(err){console.log(err);}
    };

    var command = '?cmd=' + 'bh';
    ServerAPI_login.xmlRequest('POST', command, {"cmd": "network_activate"}, handleResponse); 
};

ServerAPI_login.getStep = function(){
    var handleResponse = function(data){
        try{
            udpateNetwork(data.net);
            updateOutputValues(data.result);
        }catch(err){console.log(err);}
    };

    var command = '?cmd=' + 'bh';
    ServerAPI_login.xmlRequest('POST', command, {"cmd": "network_step"}, handleResponse); 
};

ServerAPI_login.getTrain = function(){
    var handleResponse = function(data){
        try{
            udpateNetwork(data.net);
            updateOutputValues(data.result);
        }catch(err){console.log(err);}
    };

    var command = '?cmd=' + 'bh';
    ServerAPI_login.xmlRequest('POST', command, {"cmd": "network_train"}, handleResponse); 
};


setTimeout(function(){ServerAPI_login.getStatus();}, 700);

function invertColor(hex) {
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.');
    }
    // invert color components
    var r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16),
        g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16),
        b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
    // pad each with zeros and return
    return '#' + padZero(r) + padZero(g) + padZero(b);
}

function padZero(str, len) {
    len = len || 2;
    var zeros = new Array(len).join('0');
    return (zeros + str).slice(-len);
}