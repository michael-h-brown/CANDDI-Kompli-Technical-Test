
/*
DISCLAIMER!
This file is to get used to Node and the modules to
be used in the project. Code is hacked together and
experimental
*/

//modules
const HTTPS = require('https');
const Cheerio = require('cheerio');
const Knwl = require('knwl.js');

let knwlInstance = new Knwl('english');
let loadedData;
let rawData = '';

//Get HTML for the webpage
HTTPS.get('https://www.canddi.com/', (response) => {
	response.on('data', (chunk) => {
		rawData += chunk;
	});

	response.on('end', () => {
		loadedData = Cheerio.load(rawData);
		//Send to be analysed for data
		parseHTML(loadedData);
	});

	response.on('error', (err) => {
		console.log('Error: ' + err.message);
	});
});

function parseHTML(data) {

	knwlInstance.register('phones', require('knwl.js/default_plugins/phones.js'));

	//Get individual lines of the HTML
	let dataLines = splitData(data.html());

	for (var i = 0; i < dataLines.length; i++) {

		//Hard coded string changes that enable phone numbers
		//to be found
		dataLines[i] = dataLines[i].replace(/\s/g, '');
		let tempLine = dataLines[i].replace('+44', ' 0');
		tempLine = tempLine.replace('<', ' ');
		tempLine = tempLine.replace('>', ' ');

		//Find phone numbers on this line
		knwlInstance.init(tempLine);
		let numbers = knwlInstance.get('phones');

		//Print first phone number found in the HTML
		//In this case the a tag in the header of the page
		if (numbers.length > 0) {
			console.log('Phone No. Found: ' + numbers[0].phone);
			break;
		}
	}
}

//Returns a string array containing a chunk of HTML
function splitData(data) {
	lines = [];
	lines = data.split('>');
	for (var i = 0; i < lines.length; i++) {
		if (lines[i] != '') {
			lines[i] += '>';
		}
	}
	return lines;
}