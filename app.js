
//modules
const HTTPS = require('https');
const Cheerio = require('cheerio');
const Knwl = require('knwl.js');

let knwlInstance = new Knwl('english');
let loadedData;
let rawData = '';

const defaultURL = 'tim@canddi.com';
let requestURL = defaultURL;
let emailProvided = false;
let emailFound = false;

function parseHTML(data) {

	//Custom Plugins
	knwlInstance.register('ukPhones', require('./ukPhone.js'));
	knwlInstance.register('ukPlaces', require('./ukPlaces.js'));

	/*
	Get all <p> tag inner html,
	<a> tag inner html and <a>
	tag hrefs
	*/
	let allData = '';
	data('p').each(function (i, pObject) {
		allData += data(this).text() + '|';
	});
	data('a').each(function (i, aObject) {
		allData += data(this).text() + '|';
	});
	data('a').each(function(i, aHrefObject) {
		allData += data(this).attr('href') + '|';
	});
	data('script').each(function(i, scriptObject) {
		//console.log(data(this).html());
		allData += data(this).html() + '|';
	});

	let dataLines = cleanData(allData);

	//debug
	// console.log(dataLines);
	// console.log('')*3;


	let allPhoneNos = [];
	let allEmails = [];
	let allAddresses = [];

	for (var i = 0; i < dataLines.length; i++) {


		/////////PHONE NUMBERS/////////////

		/*
		Find phone numbers on this line
		Check against no.s starting with '0'
		instead of '+...'
		*/
		knwlInstance.init(dataLines[i]);
		let numbers = knwlInstance.get('ukPhones');

		/*
		Store found phone numbers
		Should store all in case more than one
		in numbers
		*/
		if (numbers.length > 0) {
			allPhoneNos.push(numbers[0].phone);
		}

		////////////EMAILS////////////////

		let emails = knwlInstance.get('emails');

		/*
		Store email addresses
		Same as above, should store
		all found addresses
		*/
		if (emails.length > 0) {
			allEmails.push(emails[0].address);
		}

		/////////////Physical Addresses/////////

		let places = knwlInstance.get('ukPlaces');

		//As Above storing addresses
		if (places.length > 0) {
			allAddresses.push(places[0].fullAddress);
		}
	}

	//Make the results loopable
	let titles = ['Phone Numbers', 'Email Addresses', 'Addresses'];
	let pointers = [allPhoneNos, allEmails, allAddresses];

	//Loop through each type of result
	for (var pointer = 0; pointer < pointers.length; pointer++) {

		let processed = [];
		let timesFound = [];

		//If any results were found for this type of result
		if (pointers[pointer].length > 0) {
			//Track number of occurances per unique result
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

		} else {
			console.log('\nNo ' + titles[pointer] + ' Found..\n');
		}

	}
}

//Replaces common issues with the site data
function cleanData(data) {
	let cleanedData = data;

	//tabs
	cleanedData = cleanedData.replace(/\t/g, '');

	//newlines
	cleanedData = cleanedData.replace(/\n/g, ', ');

	//commas spaced on both sides
	cleanedData = cleanedData.replace(/ , /g, ', ');

	//colons are padded (to help find phone numbers)
	cleanedData = cleanedData.replace(/:/g, ' : ');
	
	cleanedData = cleanedData.split('|');

	for (var i = cleanedData.length - 1; i >= 0; i--) {
		cleanedData[i] = cleanedData[i].trim();
		if (cleanedData[i] == '') {
			cleanedData.splice(i, 1);
		}
	}

	return cleanedData;
}

if (process.argv.length == 3) {
	requestURL = process.argv[2];
	emailProvided = true;
} else if (process.argv.length == 2) {
	console.log('No email address given as argument, defaulting to: tim@canddi.com');
} else {
	console.log('Too many arguments supplied, using: ' + process.argv[2]);
}

//Checks argument as valid email address
//if not then use default
do {
	knwlInstance.init(requestURL);
	let emails = knwlInstance.get('emails');
	if(emails.length > 0) {
		requestURL = 'https://www.' + emails[0].address.split('@')[1] + '/';
		emailFound = true;
	} else if (emailProvided) {
		requestURL = defaultURL;
		console.log('No email address detected, defaulting to tim@canddi.com');
	} else {
		throw new Error('There was an issue using the default email address...');
	}
}while (emailFound == false);

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
