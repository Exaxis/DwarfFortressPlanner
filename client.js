(function(){
var canvas = document.getElementById("mainCanvas");
var ctx = canvas.getContext("2d");

// CONSTANTS ---
// Enum properties format taken from:
// https://stijndewitt.com/2014/01/26/enums-in-javascript/

// The Materials enum tells the app what values can be placed into cells.
// The enum properties tell the app how to interpret and render each value.
// TEXT: Text to describe the cell.
// COLOR: The color to render the cell value
// DISPLAY: What display method to use when rendering the cell.
//		STANDARD: Draw either a full block of color (if character is null) or the provided character in that color.
//		ELEVATION: Two characters will be provided - the first is used to render the cell at the same elevation, the second for rendering the cell
//				   when looking down from above it.
//		TILEMASK: A set of characters will be provided that are used for tilemasking. NOT YET IMPLEMENTED.
// CHARACTER: What character(s), if any, to display in the cell.

var MATERIALS = {
	"EMPTY": 0,
	"FLOOR": 1,
	"STONE": 2,
	"GRASS-1": 3,
	"GRASS-2": 4,
	"GRASS-3": 5,
	"DOOR" : 6,
	"RAMP" : 7,
	"STAIRS": 8,
	"FARM": 9,
	"TABLE": 10,
	"WATER": 11,
	"CARPENTER-TL": 12,
	"CARPENTER-T": 13,
	"CARPENTER-TR": 14,
	"CARPENTER-L": 15,
	"CARPENTER-M": 16,
	"CARPENTER-R": 17,
	"CARPENTER-BL": 18,
	"CARPENTER-B": 19,
	"CARPENTER-BR": 20,
	"TRADING-CIRCLE": 21,
	"TRADING-SOLID": 22,
	"properties": {
		0: {text: "empty", color: "#000000", display: "standard", character: null},
		1: {text: "floor", color: "#d3d3d3", display: "standard", character: String.fromCharCode(8901)},
		2: {text: "wall", color: "#8c8c8c", display: "standard", character: null},
		3: {text: "grass", color: "#4fa862", display: "standard", character: String.fromCharCode(8901)},
		4: {text: "grass", color: "#4fa862", display: "standard", character: ','},
		5: {text: "grass", color: "#4fa862", display: "standard", character: String.fromCharCode(9827)},
		6: {text: "door", color: "#8c8c8c", display: "standard", character: String.fromCharCode(43)},
		7: {text: "ramp", color: "#8c8c8c", display: "elevation", character: String.fromCharCode(9650) + String.fromCharCode(9660)},
		8: {text: "stairs", color: "#8c8c8c", display: "standard", character: 'X'},
		9: {text: "farm", color: "#cdd100", display: "standard", character: String.fromCharCode(8776)},
		10: {text: "table", color: "#966d37", display: "standard", character: String.fromCharCode(9572)},
		11: {text: "water", color: "#6d7eff", display: "standard", character: String.fromCharCode(8776)},
		12: {text: "carpenter", color: "#000000", display: "standard", character: null},
		13: {text: "carpenter", color: "#cdd100", display: "standard", character: '"'},
		14: {text: "carpenter", color: "#cdd100", display: "standard", character: '='},
		15: {text: "carpenter", color: "#cdd100", display: "standard", character: null},
		16: {text: "carpenter", color: "#000000", display: "standard", character: null},
		17: {text: "carpenter", color: "#000000", display: "standard", character: null},
		18: {text: "carpenter", color: "#cdd100", display: "standard", character: null},
		19: {text: "carpenter", color: "#cdd100", display: "standard", character: ']'},
		20: {text: "carpenter", color: "#cdd100", display: "standard", character: null},
		21: {text: "trade depot", color: "#cdd100", display: "standard", character: '0'},
		22: {text: "trade depot", color: "#cdd100", display: "standard", character: null},
	}
}

// Excellent resource for determining JavaScript keycodes:
// http://keycode.info/
//
// NOTE: This app currently uses simple keycodes only. This makes it easy to respond
// to any keypress with a single method and utilize one enum, but also means
// that context-dependent key input, like capital vs. lower-case, is not supported.
var KEYS = {
	"ENTER": 13,
	"ESC": 27,
	"LEFT_ARROW": 37,
	"UP_ARROW": 38,
	"RIGHT_ARROW": 39,
	"DOWN_ARROW": 40,
	"A": 65,
	"D": 68,
	"E": 69,
	"W": 87,
	"O": 79,
	"R": 82,
	"S": 83,
	"F": 70,
	"G": 71,
	"T": 84,
	"P": 80,
	"LEFT_ANGLE": 188,
	"RIGHT_ANGLE": 190,
	"EQUALS": 187
}

// The MODES enum is a list of the cell selection modes the app can use.
// Each enum property describes what the cell selection behavior of that mode is,
// as well as what materials are to be inserted into the map during the mode.
// TEXT: Descriptive text displayed in the app describing the mode.
// MATERIALS: An array of objects referencing values from the MATERIALS enum
//		VALUE: The value of the material from the materials enum that should be placed in the cell
//
//		CHANCE: A value from (0-1] describing the chance that each material will be placed. The CHANCE values
//              of all materials in a mode should add up to exactly 1.
//				Only used for modes with FREE style selection.
//				
// SELECTION: Describes how materials are placed in the map.
// 		STYLE:
//			FREE: The user will hit ENTER to start free selection. Here they can select
//				  A rectangle as wide, tall, and as many layers deep as they want.
//				  Hitting ENTER a second time will set every cell in their selection
//                to be materials from the MATERIALS property of this mode.
//				  If the MATERIALS property contains more than one value, a value will
//                be randomly selected for each cell.
//
//			FIXED: This mode uses a selection of fixed size, and restricted to one layer.
//                 The user will move the cursor around the screen, and the rectangular selection
//                 with this mode's width and height properties will be displayed.
//                 When the user hits ENTER, values from the MATERIALS property of this mode will be
//                 inserted into the selection rectangle one at a time.
//
//		WIDTH and HEIGHT: Describe the shape of a FIXED selection. The number of materials in a fixed-style mode
//                        should be equal to the area of this selection rectangle. 
//						  i.e., for a FIXED selection of 3 width and 3 height, the MATERIALS property should
//                        contain 9 values.

var MODES = {
	"DIG": 0,
	"EMPTY": 1,
	"WALL": 2,
	"DOOR": 3,
	"RAMP": 4,
	"STAIRS": 5,
	"FARM": 6,
	"TABLE": 7,
	"WATER": 8,
	"GRASS": 9,
	"CARPENTER": 10,
	"TRADE-DEPOT": 11,
	"COPY": 12,
	"properties": {
		0: {text: "Dig Flooring", materials: [{value: MATERIALS["FLOOR"], chance: 1.0}], selection: {style: "free", width: null, height: null}},
		1: {text: "Make Empty", materials: [{value: MATERIALS["EMPTY"], chance: 1.0}], selection: {style: "free", width: null, height: null}},
		2: {text: "Place Wall", materials: [{value: MATERIALS["STONE"], chance: 1.0}], selection: {style: "free", width: null, height: null}},
		3: {text: "Place Door", materials: [{value: MATERIALS["DOOR"], chance: 1.0}], selection: {style: "free", width: null, height: null}},
		4: {text: "Place Up Ramp", materials: [{value: MATERIALS["RAMP"], chance: 1.0}], selection: {style: "free", width: null, height: null}},
		5: {text: "Place Stairs", materials: [{value: MATERIALS["STAIRS"], chance: 1.0}], selection: {style: "free", width: null, height: null}},
		6: {text: "Place Farm Plot", materials: [{value: MATERIALS["FARM"], chance: 1.0}], selection: {style: "free", width: null, height: null}},
		7: {text: "Place Table", materials: [{value: MATERIALS["TABLE"], chance: 1.0}], selection: {style: "free", width: null, height: null}},
		8: {text: "Place Water", materials: [{value: MATERIALS["WATER"], chance: 1.0}], selection: {style: "free", width: null, height: null}},
		9: {text: "Place Grass", materials: [{value: MATERIALS["GRASS-1"], chance: 0.83},
											 {value: MATERIALS["GRASS-2"], chance: 0.15}, 
											 {value: MATERIALS["GRASS-3"], chance: 0.02}], 
			selection: {style: "free", width: null, height: null}},
		10: {text: "Place Workshop", 
			 materials: [{value: MATERIALS["CARPENTER-TL"], chance: 1.0}, {value: MATERIALS["CARPENTER-T"], chance: 1.0}, {value: MATERIALS["CARPENTER-TR"], chance: 1.0},
			             {value: MATERIALS["CARPENTER-L"], chance: 1.0}, {value: MATERIALS["CARPENTER-M"], chance: 1.0}, {value: MATERIALS["CARPENTER-R"], chance: 1.0},
			             {value: MATERIALS["CARPENTER-BL"], chance: 1.0}, {value: MATERIALS["CARPENTER-B"], chance: 1.0}, {value: MATERIALS["CARPENTER-BR"], chance: 1.0}], 
	         selection: {style: "fixed", width: 3, height: 3}},
		11: {text: "Place Trade Depot", 
			 materials: [{value: MATERIALS["TRADING-CIRCLE"], chance: 1.0}, {value: MATERIALS["TRADING-SOLID"], chance: 1.0}, {value: MATERIALS["TRADING-SOLID"], chance: 1.0}, {value: MATERIALS["TRADING-SOLID"], chance: 1.0}, {value: MATERIALS["TRADING-CIRCLE"], chance: 1.0},
			             {value: MATERIALS["TRADING-SOLID"], chance: 1.0}, {value: MATERIALS["TRADING-SOLID"], chance: 1.0}, {value: MATERIALS["TRADING-SOLID"], chance: 1.0}, {value: MATERIALS["TRADING-SOLID"], chance: 1.0}, {value: MATERIALS["TRADING-SOLID"], chance: 1.0},
			             {value: MATERIALS["TRADING-SOLID"], chance: 1.0}, {value: MATERIALS["TRADING-SOLID"], chance: 1.0}, {value: MATERIALS["TRADING-CIRCLE"], chance: 1.0}, {value: MATERIALS["TRADING-SOLID"], chance: 1.0}, {value: MATERIALS["TRADING-SOLID"], chance: 1.0},
						 {value: MATERIALS["TRADING-SOLID"], chance: 1.0}, {value: MATERIALS["TRADING-SOLID"], chance: 1.0}, {value: MATERIALS["TRADING-SOLID"], chance: 1.0}, {value: MATERIALS["TRADING-SOLID"], chance: 1.0}, {value: MATERIALS["TRADING-SOLID"], chance: 1.0},
						 {value: MATERIALS["TRADING-CIRCLE"], chance: 1.0}, {value: MATERIALS["TRADING-SOLID"], chance: 1.0}, {value: MATERIALS["TRADING-SOLID"], chance: 1.0}, {value: MATERIALS["TRADING-SOLID"], chance: 1.0}, {value: MATERIALS["TRADING-CIRCLE"], chance: 1.0}
						 ], 
	         selection: {style: "fixed", width: 5, height: 5}},
		12: {text: "Copy Cells", materials: [], selection: {style: "copy", width: null, height: null}}
	}
}

var DIRECTIONS = {
	"UP": 0,
	"LEFT": 1,
	"DOWN": 2,
	"RIGHT": 3
}

// Make our enums immutable
if(Object.freeze){
	Object.freeze(MATERIALS);
	Object.freeze(KEYS);
	Object.freeze(MODES);
	Object.freeze(DIRECTIONS);
}

// CONFIG ---
var debug = true;

var layers = 30;
var layerColumns= 200;
var layerRows = 200;
var cellSize = 16;
var borderSize = 12;

var selectionColor = "#c4ae3e";
var selectionCursorColor = "#7777FF";

var transparencyDisplayLimit = 5;

// GAME DATA ---
var map = createEmptyMap();
var mapKeyPrefix = "dfMapItem";

// GAME STATE ---
var selectedMode = MODES["DIG"];
var controlsActive = true;
var prevKeyPressed = -1;
var keyIsPressed = false;

var mapOffsetX = 0;
var mapOffsetY = 0;
var viewColumns = 0;
var viewRows = 0;

var selectedCellX = 0;
var selectedCellY = 0;
var selectedSourceCellX = 0;
var selectedSourceCellY = 0;

var selectionInProgress = false;
var copyCompleted = false;

var copyBuffer = [];

var selectedLayer = Math.floor(layers/2);
changeLayer(selectedLayer);
var selectedSourceLayer = selectedLayer;;

// EVENT HANDLER REGISTRATION ---
window.onload = function(){
	resizeHandler();
};

window.addEventListener("keydown", keyDownHandler, false);
window.addEventListener("keyup", keyUpHandler, false);
window.addEventListener("resize", resizeHandler, false);

var downloadButton = document.getElementById("downloadButton");
downloadButton.addEventListener('click', convertAndDownloadMap);

var saveButton = document.getElementById("saveButton");
saveButton.addEventListener('click', function(){
	showOverlay("saveOverlay");
});

var saveConfirmButton = document.getElementById("saveConfirmButton");
saveConfirmButton.addEventListener('click', saveMapConfirmClicked);

var saveCancelButton = document.getElementById("saveCancelButton");
saveCancelButton.addEventListener('click', function(){
	closeSaveOverlay();
});

var loadButton = document.getElementById("loadButton");
loadButton.addEventListener('click', loadMapOverlayClicked);

var loadCancelButton = document.getElementById("loadCancelButton");
loadCancelButton.addEventListener('click', function(){
	closeLoadOverlay();
})


// METHODS ---
//	Event Handlers ---
function keyDownHandler(e){
if(controlsActive){
		switch(e.keyCode){
			case KEYS["LEFT_ARROW"]:
				move(DIRECTIONS["LEFT"]);
				draw();
				break;
			case KEYS["UP_ARROW"]:
				move(DIRECTIONS["UP"]);
				draw();
				break;
			case KEYS["RIGHT_ARROW"]: 
				move(DIRECTIONS["RIGHT"]);
				draw();
				break;
			case KEYS["DOWN_ARROW"]: 
				move(DIRECTIONS["DOWN"]);
				draw();
				break;
			case KEYS["ENTER"]:
				cellSelect();
				break;
			case KEYS["ESC"]:
				cancelSelection();
				break;
			case KEYS["LEFT_ANGLE"]:
				if(selectedLayer < layers-1){
					changeLayer(selectedLayer +1);
				}
				break;
			case KEYS["RIGHT_ANGLE"]:
				if(selectedLayer > 0){
					changeLayer(selectedLayer -1);
				}
				break;
			case KEYS["EQUALS"]:
				changeMode(MODES["DOOR"]);
				break;
			case KEYS["A"]:
				changeMode(MODES["WATER"]);
				break;
			case KEYS["E"]:
				changeMode(MODES["EMPTY"]);
				break;
			case KEYS["D"]:
				changeMode(MODES["DIG"]);
				break;
			case KEYS["W"]:
				changeMode(MODES["WALL"]);
				break;
			case KEYS["O"]:
				changeMode(MODES["CARPENTER"]);
				draw();
				break;
			case KEYS["R"]:
				changeMode(MODES["RAMP"]);
				break;
			case KEYS["S"]:
				changeMode(MODES["STAIRS"]);
				break;
			case KEYS["F"]:
				changeMode(MODES["FARM"]);
				break;
			case KEYS["G"]:
				changeMode(MODES["GRASS"]);
				break;
			case KEYS["T"]:
				changeMode(MODES["TABLE"]);
				break;
			case KEYS["P"]:
				changeMode(MODES["TRADE-DEPOT"]);
				break;
		}
	}
}

function keyUpHandler(e){
	keyIsPressed = false;
	prevKeyPressed = -1;
}

function resizeHandler(){
	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;
	
	calculateViewArea(canvas.width, canvas.height);
	setMapOffsets();
	
	draw();
}

function calculateViewArea(width, height){
	viewColumns = Math.floor((width - borderSize) / cellSize);
	viewRows = Math.floor((height - borderSize) / cellSize);
}

function setMapOffsets(){
	if(selectedCellX > viewColumns + mapOffsetX){
		mapOffsetX = selectedCellX - viewColumns;
	}
	
	if(selectedCellX < mapOffsetX){
		mapOffsetX = selectedCellX;
	}
	
	if(selectedCellY > viewRows + mapOffsetY){
		mapOffsetY = selectedCellY - viewRows;
	}
	
	if(selectedCellY < mapOffsetY){
		mapOffsetY = selectedCellY;
	}
}

function move(dir){
	switch(dir){
		case DIRECTIONS["UP"]:
			selectedCellY = selectedCellY > 0 ? selectedCellY - 1 : selectedCellY;
			setMapOffsets();
		break;
		case DIRECTIONS["LEFT"]:
			selectedCellX = selectedCellX > 0 ? selectedCellX - 1 : selectedCellX;
			setMapOffsets();
		break;
		case DIRECTIONS["DOWN"]:
			selectedCellY = selectedCellY < layerRows-1 ? selectedCellY + 1 : selectedCellY;
			setMapOffsets();
		break;
		case DIRECTIONS["RIGHT"]:
			selectedCellX = selectedCellX < layerColumns-1 ? selectedCellX + 1 : selectedCellX;
			setMapOffsets();
		break;
	}
}


//	Initialization ---
function createEmptyMap(){
	var emptyMap = [];
	
	for(var layerIndex = 0; layerIndex < layers; layerIndex++){
		var layerMap = [];
		for(var rowIndex=0; rowIndex < layerRows; rowIndex++){
			var row = [];
			for(var columnIndex=0; columnIndex < layerColumns; columnIndex++){
				row[columnIndex] = 2;
			}
			
			layerMap[rowIndex] = row;
		}
		
		emptyMap[layerIndex] = layerMap;
	}
	
	return emptyMap;
}

function convertAndDownloadMap(){
	var mapObject = convertMapToJSON();
	download(mapObject, "dfMap.txt", 'text/plain');
}

function convertMapToJSON(){
	var mapJSON = {layers: layers, layerRows: layerRows, layerColumns: layerColumns, map: map};
	var mapObject = JSON.stringify(mapJSON);
	return mapObject;
}

function saveMapConfirmClicked(){
	var name = document.getElementById("mapNameInput").value;
	if(name == null || name === ""){
		document.getElementById("mapNameError").style.visibility = "visible";
		return;
	}
	document.getElementById("mapName").innerText = name;
	//saveMapToLocalStorage();
	
	closeSaveOverlay();
}

function loadMapOverlayClicked(){
	var keys = retrieveStorageMapKeys();
	var listElement = document.getElementById("loadMapList");
	
	for(var i = 0; i < keys.length; i++){
		var e = document.createElement("span");
		e.innerText = keys[i].name;
		e.addEventListener('click', function(){
			loadMap(keys[i].key);
		});
		e.className += "loadMapItem";
		e.className += "mainMenuItem";
		
		listElement.appendChild(e);
	};
	
	showOverlay("loadOverlay");
}

function loadMap(key){
	loadMapFromLocalStorage(key);
	closeLoadOverlay();
}

function saveMapToLocalStorage(name){
	var mapObject = convertMapToJSON();
	localStorage.setItem(name, mapObject);
}

function loadMapFromLocalStorage(key){
	var mapObject = localStorage.getItem(key);
	
	if(mapObject != null && mapObject.layers != null && mapObject.layerRows != null && mapObject.layerColumns != null && mapObject.map != null){
		map = mapObject.map;
		layers = mapObject.layers;
		layerColumns = mapObject.layerColumns;
		layerRows = mapObject.layerRows;
	}
}

function download(content, fileName, contentType){
	var a = document.createElement("a");
	var file = new Blob([content], {type: contentType});
	a.href = URL.createObjectURL(file);
	a.download = fileName;
	a.click();
}

//	Drawing ---
function draw(){
	var d0 = performance.now();
	ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
	drawBg();

	for(var row=0; row < layerRows; row++){
		for(var column=0; column < layerColumns; column++){
			drawCell(selectedLayer, column, row);
		}
	}
	var d1 = performance.now();
	
	if(debug){
		console.log("Drawing took " + (d1-d0) + " milliseconds.");
	}
}

function drawBg(){
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
}

function drawCell(layer, column, row){	
	var cellSelected = false;
	var cellStyle = {color: "", character: null};
	var modeProperties = MODES.properties[selectedMode];
	
	if(selectionInProgress){
		if(isCellInSelection(column, row, layer)){
			if(column == selectedCellX && row == selectedCellY){
				cellStyle.color = selectionCursorColor;
			}else {
				cellStyle.color = selectionColor;
			}
			cellSelected = true;
		}
	} else if(column == selectedCellX && row == selectedCellY){
		if(modeProperties.selection.style !== "fixed"){
			cellStyle.color = selectionColor;
		} else {
			cellStyle.color = selectionCursorColor;
		}
		cellSelected = true;
	}
	
	if(!cellSelected){
		var cellValue = map[layer][row][column];
		
		
		cellStyle = getCellProperties(layer, column, row, cellValue);
		
		if(cellStyle.color !== ""){
			cellStyle.color = convertHexColorToRGBA(cellStyle.color);			
		}	
		
		if(modeProperties.selection.style == "fixed" && cellIsFixedSelection(column, row, modeProperties.selection.width, modeProperties.selection.height)){
			cellStyle.color = selectionColor;
			if(cellStyle.display == "none"){
				cellStyle.display = "standard";
			}
		}
	}

	if(cellStyle.display !== "none"){
		var screenLocation = cellPositionToScreenCoords(column, row);
		ctx.fillStyle = cellStyle.color;
		
		if(cellStyle.character != null){
			ctx.font = "15px Arial";
			ctx.textBaseline = "middle";
			ctx.fillText(cellStyle.character, screenLocation.x + (cellSize/4), screenLocation.y + (cellSize/2));
		} else {
		ctx.fillRect(screenLocation.x, screenLocation.y, 
				cellSize, cellSize);
		}
	}
}

function cellIsFixedSelection(column, row, width, height){
	if(column == selectedCellX && row == selectedCellY){
		return false;
	}
		var preCursorColumns = 0,
		preCursorRows = 0;
			
		if(width > 1){
			if(width %2 == 0){
				preCursorColumns = Math.floor((width/2)-1);
			} else {
				preCursorColumns = Math.floor(width / 2);
			}
		} else {
			preCursorColumns = 0;
		}
		
		if(height > 1){
			if(height % 2 == 0){
				preCursorRows = Math.floor((height/2)-1);
			} else {
				preCursorRows = Math.floor(height / 2);
			}
		} else {
			preCursorRows = 0;
		}
	
	
	if((column >= (selectedCellX - preCursorColumns)) && 
	   (column <= (selectedCellX - preCursorColumns + width - 1)) &&
	   (row >= (selectedCellY - preCursorRows)) && 
	   (row <= (selectedCellY - preCursorRows + height - 1))){
			return true;
		} else {
			return false;
		}
}

//	App Interaction ---
function changeLayer(layer){
	selectedLayer = layer;
	var firstDigit, secondDigit;
	var layerString = selectedLayer.toString();
	
	firstDigit = layerString[0];
	if(layerString.length === 2){
		secondDigit = layerString[1];
	}
	
	$("#layerLabel1").text(firstDigit);
	if(secondDigit != null){
		$("#layerLabel2").text(secondDigit);
	} else {
		$("#layerLabel2").text("");
	}
	
	draw();
}

function changeMode(mode){
	var previousSelectStyle = MODES.properties[selectedMode].selection.style;
	
	selectedMode = mode;
	
	// If changing to a mode with a different selection style, ensure that we're no longer
	// in cell selection
	if(MODES.properties[selectedMode].selection.style != previousSelectStyle){
		selectionInProgress = false;
	}
	
	$("#modeLabel").text(MODES.properties[mode].text);
	draw();
}

function cellSelect(){
	var modeProperty = MODES.properties[selectedMode];
	if(!selectionInProgress){
		selectedSourceCellX = selectedCellX;
		selectedSourceCellY = selectedCellY;
		selectedSourceLayer = selectedLayer;
		
		if(modeProperty.selection.style == "free" || modeProperty.selection.style == "copy"){
			// Free-styled and copy selection modes have two stages, so kick off the second stage (allowing them to shape their selection)
			selectionInProgress = true;
			draw();
			return;
		}
	}
	
	if(modeProperty.selection.style == "free"){
		var selectedCells = getSelectedCells();
		
		var materialCount = modeProperty.materials.length;
		
		selectedCells.forEach(function(c){
			var material;
			if(materialCount > 1){
				var sum = 0, r = Math.random();
				for(var i = 0; i < materialCount; i++){
					sum += modeProperty.materials[i].chance;
					if(r <= sum){
						material = modeProperty.materials[i];
						break;
					}
				}
			}else {
				material = modeProperty.materials[0];	
			}
			
			map[c.z][c.y][c.x] = material.value;
		});
	} else if (modeProperty.selection.style == "fixed"){
		// Some possible fixed selection shapes:
		/*
		O = Selected cursor cell
		X = Cell in selection
		
		XXX    XXXX    XXXX    XXXXXXX    XXX    XOXX    XOXX    X    O    
        XOX    XOXX    XOXX    XXXOXXX    XOX            XXXX    O    X
        XXX    XXXX    XXXX    XXXXXXX    XXX                    X
		               XXXX    XXXXXXX    XXX                    X
		
		*/
		
		var materials = modeProperty.materials,
		    width = modeProperty.selection.width,
		    height = modeProperty.selection.height,
			preCursorColumns = 0,
			preCursorRows = 0;
			
		if(width > 1){
			if(width %2 == 0){
				preCursorColumns = Math.floor((width/2)-1);
			} else {
				preCursorColumns = Math.floor(width / 2);
			}
		} else {
			preCursorColumns = 0;
		}
		
		if(height > 1){
			if(height % 2 == 0){
				preCursorRows = Math.floor((height/2)-1);
			} else {
				preCursorRows = Math.floor(height / 2);
			}
		} else {
			preCursorRows = 0;
		}
		
		var materialIndex = 0;
		for(var row = 0; row < height; row++){
			for(var column = 0; column < width; column++){
				// Determine cell placement
				var x = selectedCellX - preCursorColumns + column;
				var y = selectedCellY - preCursorRows + row;
				
				// Determine material
				if(materialIndex <= materials.length){
					var material = materials[materialIndex];
					
					map[selectedLayer][y][x] = material.value;
				} else {
					console.log("Material out of bounds");
				}
				materialIndex++;
			}
		}
	} else if(modeProperty.selection.style == "copy"){
		if(!copyCompleted){
			var selectedCells = getSelectedCells();
			copyBuffer = [[]];
			selectedCells.forEach(function(c){
				
			})
		}
	}
	
	selectionInProgress = false;

	draw();
}

function cancelSelection(){
	if(selectionInProgress){
		selectionInProgress = false;
		draw();
	}
}

// UI Functionality ---
function show(id){
	document.getElementById(id).style.visibility = "visible";
}

function hide(id){
	document.getElementById(id).style.visibility = "hidden";
}

function closeSaveOverlay(){
	hide("mapNameError");
	closeOverlay("saveOverlay");
}

function closeLoadOverlay(){
	hide("mapsNotFoundError");
	closeOverlay("loadOverlay");
}

function showOverlay(name){
	controlsActive = false;
	show(name);
}

function closeOverlay(name){
	controlsActive = true;
	hide(name);
}

//	General Utility ---

/*
 *	Converts a cell location to screen X and Y coordinates
 */
function cellPositionToScreenCoords(column, row){
	var cellX = column * cellSize;
	var cellY = row * cellSize;
	
	var screenX = cellX - (mapOffsetX*cellSize);
	var screenY = cellY - (mapOffsetY*cellSize);
	
	return {x: screenX, y: screenY};
}

/*
 *  Determines what to draw at a particular cell location.
 *	Because empty tiles are transparent, this function
 *	will recursively peek down at layers beneath empty tiles to
 *	determine what should be shown in their place.
 */
function getCellProperties(layer, column, row, value, lowerLayerCounter){
	var properties = {color: "", display: "none", character: null};
	
	if(lowerLayerCounter == null){
		lowerLayerCounter = 0;
	}
	
	if(lowerLayerCounter > transparencyDisplayLimit){
		return properties;
	}
	
	if(value === MATERIALS["STONE"]){
		// Figure out if it is exposed or not
		if(cellIsExposed(layer, column, row)){
			properties.color = MATERIALS.properties[value].color;
			properties.display = MATERIALS.properties[value].display;
			properties.character = MATERIALS.properties[value].character;
		}else {
			properties.color = "";
			properties.character = null;
			properties.display = "none";
		}
	} else if(value === MATERIALS["EMPTY"]) {
		if(layer > 0){
			var valueBelow = map[layer-1][row][column];
			properties = getCellProperties(layer-1, column, row, valueBelow, lowerLayerCounter+1);
		} else {
			properties.color = "";
			properties.character = null;
			properties.display = "none";
		}
	} else {
		properties.color = MATERIALS.properties[value].color;
		properties.display = MATERIALS.properties[value].display;
		properties.character = MATERIALS.properties[value].character;
		if(lowerLayerCounter > 0 && properties.display === "elevation"){
				// We have looked down on a cell with display style "elevation".
				// We need to show the second character, not the first
				if(properties.character.length == 2){
					properties.character = properties.character[1];
				}
		} else {
			// We need the first character in the character list, if characters are present.
			properties.character = MATERIALS.properties[value].character != null ? MATERIALS.properties[value].character[0] : null;
		}

	}
	
	// Elevation color adjustment
	if(properties.display !== "none"){
		if(lowerLayerCounter > 0 && properties.color != ""){
			// If we peeked down to show a cell beneath our layer,
			// make it more transparent
			properties.color = properties.color + "77";
		} else if(properties.color.length < 8) {
			// Tack on full alpha, if not otherwise specified
			properties.color = properties.color + "ff";
		}
	}
	
	return properties;
}

/*
 *	In the game Dwarf Fortress, the material inside of the ground is displayed 
 *  as black, unless it is exposed to a cell the player has dug out.
 *	This method makes that determination for stone cells.
 */
function cellIsExposed(layer, column, row){
	// A stone cell is "exposed" if any of its adjacent cells are not stone
	// Check left column
	if(column > 0){
		if(row > 0 && map[layer][row-1][column-1] !== MATERIALS["STONE"]){
			return true;
		}
		
		if(map[layer][row][column-1] !== MATERIALS["STONE"]){
			return true;
		}
		
		if(row < layerRows-1 && map[layer][row+1][column-1] !== MATERIALS["STONE"]){
			return true;
		}
	}
	
	// Check center column
	if(row > 0 && map[layer][row-1][column] !== MATERIALS["STONE"]){
		return true;
	}
	
	if(row < layerRows-1 && map[layer][row+1][column] !== MATERIALS["STONE"]){
		return true;
	}
	
	// Check right column
	if(column < layerColumns-1){
		if(row > 0 && map[layer][row-1][column+1] !== MATERIALS["STONE"]){
			return true;
		}
		
		if(map[layer][row][column+1] !== MATERIALS["STONE"]){
			return true;
		}
		
		if(row < layerRows-1 && map[layer][row+1][column+1] !== MATERIALS["STONE"]){
			return true;
		}
	}
	
	return false;
}

/*
 *	Determines if a cell is currently in the selection box made by the user
 *	on the current layer. This is used for display purposes.
 */
function isCellInSelection(column, row, layer){		
	
	if(MODES.properties[selectedMode].selection.style != "fixed"){
	var lowerLayer,
		upperLayer,
		leftX,
		rightX,
		lowerY,
		upperY;
		
	if(selectedSourceLayer < selectedLayer){
		lowerLayer = selectedSourceLayer;
		upperLayer = selectedLayer;
	} else {
		lowerLayer = selectedLayer;
		upperLayer = selectedSourceLayer;
	}
	
	if(selectedSourceCellX < selectedCellX){
		leftX = selectedSourceCellX;
		rightX = selectedCellX;
	} else {
		leftX = selectedCellX;
		rightX = selectedSourceCellX;
	}
	
	if(selectedSourceCellY < selectedCellY){
		lowerY = selectedSourceCellY;
		upperY = selectedCellY;
	} else {
		lowerY = selectedCellY;
		upperY = selectedSourceCellY;
	}
	
	if(layer >= lowerLayer && layer <= upperLayer &&
	   column >= leftX && column <= rightX &&
	   row >= lowerY && row <= upperY){
		   return true;
	   } else {
		   return false;
	   }
	} else {
		if(column >= selectedCellX - 1 && column <= selectedCellX + 1 &&
			row >= selectedCellY - 1 && row <= selectedCellY + 1){
				return true;
			} else {
				return false;
			}
	}
}

/*
 *	Returns a list of cells that are currently in the bounds of the user's
 *	selection box - OR - which cells are relevant for placing a workshop centered
 *  around the user's cursor, if in a workshop mode
 *
 *	This returns all selected cells, even those on layers that aren't the 
 *	current layer.
 *
 *	This is done to easily determine what cells will be affected by the user
 * 	when they finalize their selection. 
 */
function getSelectedCells(){
	// if(!selectionInProgress){
	// 	return {};
	// }
	
	var cells = [];
	
	if(MODES.properties[selectedMode].selection.style === "fixed"){
		
		if(selectedCellX > 0 && selectedCellY > 0){
			cells.push({x: selectedCellX - 1, y: selectedCellY - 1, z: selectedLayer});
		}
		if(selectedCellY > 0){
			cells.push({x: selectedCellX, y: selectedCellY - 1, z: selectedLayer});
			cells.push({x: selectedCellX + 1, y: selectedCellY - 1, z: selectedLayer});
		}
		if(selectedCellX > 0){
			cells.push({x: selectedCellX - 1, y: selectedCellY, z: selectedLayer});
		}
		cells.push({x: selectedCellX, y: selectedCellY, z: selectedLayer});
		if(selectedCellX < layerColumns){
			cells.push({x: selectedCellX + 1, y: selectedCellY, z: selectedLayer});
		}
		if(selectedCellX > 0 && selectedCellY < layerRows){
			cells.push({x: selectedCellX - 1, y: selectedCellY + 1, z: selectedLayer});
		}
		if(selectedCellY < layerRows){
			cells.push({x: selectedCellX, y: selectedCellY + 1, z: selectedLayer});
		}
		if(selectedCellX < layerColumns && selectedCellY < layerRows){
			cells.push({x: selectedCellX + 1, y: selectedCellY + 1, z: selectedLayer});
		}
		
	} else {
		// Get offsets
		var deltaZ = selectedLayer - selectedSourceLayer;
		var deltaX = selectedCellX - selectedSourceCellX;
		var deltaY = selectedCellY - selectedSourceCellY;
		
		// Get signs of offsets
		var deltaZSign = Math.sign(deltaZ);
		var deltaXSign = Math.sign(deltaX);
		var deltaYSign = Math.sign(deltaY);
		
		if(deltaZSign === 0){
			deltaZSign = 1;
		}
		
		if(deltaXSign === 0){
			deltaXSign = 1;
		}
		
		if(deltaYSign === 0){
			deltaYSign = 1;
		}
		
		for(var layerOffset = 0; 
			Math.abs(layerOffset) <= Math.abs(deltaZ); 
			layerOffset += 1*deltaZSign){
			
			for(var xOffset = 0;
				Math.abs(xOffset) <= Math.abs(deltaX);
				xOffset += 1*deltaXSign){
					
					for(var yOffset = 0;
						Math.abs(yOffset) <= Math.abs(deltaY);
						yOffset += 1*deltaYSign){
						cells.push({x: selectedSourceCellX + xOffset,
									y: selectedSourceCellY + yOffset,
									z: selectedSourceLayer + layerOffset});
						}
				}
		}
	}
	return cells;
	 
}

function convertHexColorToRGBA(hexColor){
	if(hexColor == null || hexColor === ""){
		return "";
	}
	// Convert color from a hex string to an RGBA string
	var r = parseInt(hexColor.slice(1,3), 16);
    var g = parseInt(hexColor.slice(3,5), 16);
    var b = parseInt(hexColor.slice(5,7), 16);
    var a = parseInt(hexColor.slice(7,9), 16)/255;
	
	return 'rgba('+r+', '+g+', '+b+', '+a+')';
}

function retrieveStorageMapKeys(){
	var filteredKeys = [];
	var keys = Object.keys(localStorage);
	var i = keys.length;
	while( i-- ){
		var key = keys[i];
		var prefixIndex = key.indexOf(mapKeyPrefix);
		if(prefixIndex !== -1){
			var keyName = key.replace(mapKeyPrefix, '').replace(/_/g, ' ');
			filteredKeys.push({key: key, name: keyName});
		}
	}
	
	return filteredKeys;
}

})();
