
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

let requestURL = 'https://www.canddi.com/';

//should loop through looking for valid address
if (process.argv.length >= 3) {
	knwlInstance.init(process.argv[2]);
	let email = knwlInstance.get('emails');
	if (email.length > 0) {
		requestURL = 'https://www.' + email[0].address.split('@')[1] + '/';
	}
}

//Get HTML for the webpage
HTTPS.get(requestURL, (response) => {
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

	knwlInstance.register('ukPhones', require('./ukPhone.js'));
	knwlInstance.register('ukPlaces', require('./ukPlaces.js'));

	//Get individual lines of the HTML
	let dataLines = splitData(data.html());

	let allPhoneNos = [];
	let allEmails = [];
	let allAddresses = [];

	for (var i = 0; i < dataLines.length; i++) {

		//Hard coded string changes that enable phone numbers
		//to be found
		dataLines[i] = dataLines[i].replace(/\s/g, '');
		//let tempLine = dataLines[i].replace('+44', ' 0');
		let tempLine = dataLines[i].replace(/"/g, ' " ');
		tempLine = tempLine.replace(/:/g, ' : ');

		//Find phone numbers on this line
		//Check against no.s starting with '0'
		//instead of '+44'
		knwlInstance.init(tempLine);
		let numbers = knwlInstance.get('ukPhones');

		//Print first phone number found in the HTML
		//In this case the a tag in the header of the page
		if (numbers.length > 0) {
			allPhoneNos.push(numbers[0].phone);
		}

		let emails = knwlInstance.get('emails');

		//console.log(emails.length);

		if (emails.length > 0) {
			allEmails.push(emails[0].address);
		}

		//Gets if <p> is multiline (2 lines), adapt to 
		//handle if on single line or more than two lines
		if (dataLines[i].substring(0,3) == '<p>') {
			tempLine = dataLines[i + 1].split('.')[0];

			knwlInstance.init(tempLine);

			let places = knwlInstance.get('ukPlaces');

			if (places.length > 0) {
				allAddresses.push(places[0].fullAddress);
			}
		}
	}

	let titles = ['Phone Numbers', 'Email Addresses', 'Addresses'];
	let pointers = [allPhoneNos, allEmails, allAddresses];

	for (var pointer = 0; pointer < pointers.length; pointer++) {

		let processed = [];
		let timesFound = [];
		for (var i = 0; i < pointers[pointer].length; i++) {
			let found = false;
			for (var j = 0; j < processed.length; j++) {
				if (processed[j] == pointers[pointer][i]) {
					timesFound[j]++;
					found = true;
					break;
				}
			}
			if (found == false) {
				processed.push(pointers[pointer][i]);
				timesFound.push(1);
			}
		}

		console.log('\n' + titles[pointer] + ' Found\n');

		for (var i = 0; i < processed.length; i++) {
			console.log(processed[i] + ' | ' + timesFound[i].toString() + ' Occurance(s)');
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