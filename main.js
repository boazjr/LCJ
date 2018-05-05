"use strict";

var input = document.getElementById("input");
var output = document.getElementById("output");
var error = document.getElementById("error");
var pattern = document.getElementById("pattern");


function onPatternChanged(obj){
	if (!obj.value.slice(-1) == "m") {
		obj.value = obj.value.replace(/.$/,"*");
	}
	changed();    
}

function changed(){
	console.clear();
	console.log("**************STARTING************");
	clearError();
	output.value = process(input.value, pattern.value);
	// console.log(input.value)
}


/**
 * serialises and deserialises json.
 * @param  {string} input
 * @param  {string} pattern
 */
function process(input, pattern){
	try{
		var obj = JSON.parse(input);
		var ret = JSON.stringify(merge(obj, pattern, 0), null, 2);
	} catch (e){
		setError(e);
	}
	return ret;
}

/**
 * base recursive call returns the object after it"s been merged according to the pattern
 * @param  {} obj
 * @param  {string} pat
 */
function merge(obj, pat, n){
	n = n+1;
	console.log("- ".repeat(n), "merge: ", obj);
	var ret;
	if (pat === ""){
		ret = obj;
	}else if (pat[0]=="*"){
		return skipMerge(obj, nextPat(pat),n);
	}else{
		switch(getType(obj)) { 
		case "object":
			console.log("- ".repeat(n), "merge: dict", obj);
			ret =  {"string":mergeDict(obj, nextPat(pat),n)};
			break;
		case "array":
			console.log("- ".repeat(n), "merge: array", obj);
			ret =  [mergeArray(obj, nextPat(pat),n)];    
			break;
		default:
			ret = obj;
		}
	}
	console.log("- ".repeat(n), "return merge base: ", ret);

	return ret;
}



/**
 * skips the merging
 * @param  {} obj
 * @param  {string} pat
 */
function skipMerge(obj, pat, n){
	n = n+1;
	console.log("- ".repeat(n), "merge skip: ", obj, pat);
	var ret;
	switch(getType(obj)) {
	case "object":
		ret = {};
		for (var key in obj){
			ret[key] = merge(obj[key], pat, n);
		}
		break;
	case "array":
		ret = [];
		for (var i = 0; i < obj.length; i++) {
			ret[i] = merge(obj[i], pat, n);
		}
		break;
	default:
		ret = obj;
	}
	console.log("- ".repeat(n), "return merge skip: ",ret);
	return ret;
}



/** 
 * merging object only works if the fields are the same type
 * @param  {} obj
 * @param  {string} pat
 */
function mergeDict(obj, pat, n){
	n = n+1;
	console.log("- ".repeat(n), "merge dict: ", obj, pat);
	//check all fields are the same type

	var objs = [];
	var type = ""; 
	for (var key in obj) {
		var  currentType = getType(obj[key]);
		if (type === "" ){
			type = currentType;
		}
		if (type === currentType) {
			objs.push(merge(obj[key], pat, n));
			continue;
		}
		throw {name:"MergeError", message:"cannot merge different types: " +type+ " and "+ currentType};
	}
	var ret;
	//if so merge them
	switch (type)   {
	case "object":
		ret = mergeDicts(objs, pat, n);
		break;
	case "array":
		ret = mergeArray(objs, pat, n);    
		break;
	default:
		ret = objs[0];
	} 
	console.log("- ".repeat(n), "return merge dict: ", ret);
	return merge(ret, pat, n);
}

/**
 * checks all the objects in the arrays are the same type,
 * calls merge for each object, then merges all the objects 
 * in the array together. 
 * 
 * @param  {[]} array
 * @param  {string} pat
 */
function mergeArray(array, pat, n){
	n = n+1;
	console.log("- ".repeat(n), "merge array: ", array, pat);
	//check all fields are the same type
    
	var objs = [];
	var type = ""; 
	for (var i =0 ; i < array.length; i++) {
		var currentType = getType(array[i]);
		if (type === ""){
			type = currentType;
		}
		if ( type === currentType) {
			objs.push(merge(array[i], pat, n));
			continue;
		}
		throw {name:"MergeError", message:"cannot merge different types: " +type+ " and "+ currentType};
	}
	var ret;
	switch (type)   {
	case "object":
		ret = mergeDicts(objs, pat, n);
		break;
	case "array":
		ret = mergeArrays(objs, pat, n);  
		break;
	default:
		ret = objs[0];
	} 
	console.log("- ".repeat(n), "return merge array: ", ret);

	return merge(ret, pat, n);
}


/**
 * merge an array of array to a single array.
 * @param  {[]} arrs
 * @param  {string} pat
 */
function mergeArrays(arrs, pat, n){
	n = n+1;
	console.log("- ".repeat(n), "merge Arrays", arrs, pat);

	var ret = [];
	var type = ""; 
	// make sure that all the objects are the same type
	for (var i =0; i<arrs.length; i++){
		for (var j =0; j<arrs[i].length; j++){
			var  currentType = getType(arrs[i][j]);
			if (type === "" ){
				type = currentType;
			}
			if (type === currentType) {
				ret.push(arrs[i][j]);
				continue;
			}
			throw {name:"MergeError", message:"cannot merge different types: " +type+ " and "+ currentType};
		}
	}
	// merge all the objects together.
	console.log("- ".repeat(n), "return merge arrays", ret);
	return ret;
}

/**
 * merges all objects to one object
 * @param  {[object]} objs
 * @param  {string} pat
 */
function mergeDicts(objs, pat, n){
	n = n+1;
	console.log("- ".repeat(n), "merge dicts ", objs);
	var ret =  objs.reduce(function (r, o) {
		//console.log("reducing", r)
		Object.keys(o).forEach(function (k) { 
			if (r[k] !== undefined && getType(r[k])!==getType(o[k])){
				throw {name:"MergeError", message:"cannot merge different types: " +getType(r[k])+ " and "+ getType(o[k])};
			}
			r[k] = o[k]; 
		});
		return r;
	}, {});
	console.log("- ".repeat(n), "return merge dicts ret ", ret);
	return ret;
}



function nextPat(pat){
	var next = pat.substring(1);
	if (next == undefined){
		return "";
	}
	return next;
}

function setError(err){
	error.value = err.name +": "+ err.message;
}
function clearError(){
	error.value = "";
}

function getType(t){
	switch(typeof(t)){
	case "object":
		if (Array.isArray(t)){
			return "array";
		}
		return "object";
	default:
		return typeof(t);
	}
}

function newExample(pat, j){
	return {pattern:pat, json:j};
}
var examples = [
	newExample("m",`["at","bat"]` ),
	newExample("m",`{"at":"a","bat":"b"}`),
	newExample("*m*",`{"string":[{"mat": ""},{"mat": "","brat": ""},{"mat": ""},{"brat": ""}]}` ),
	newExample("mm",`{"at":[{"mat":""}, {"mat":"", "brat":""}],"bat":[{"mat":""}, {"brat":""}]}` ),
	newExample("m",`[{"mat":""},{"mat":"", "brat":""}]` ),
	newExample("m",`[{"mat":"that"},{"mat":"", "brat":""}, {"hello":"world"}]` )
];

function loadExample(n){
    console.log(examples[n])
	input.value = JSON.stringify(JSON.parse(examples[n].json), null, 2);
	pattern.value = examples[n].pattern;
	changed();
}

loadExample(5);

