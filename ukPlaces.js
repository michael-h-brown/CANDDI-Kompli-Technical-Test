/* Place Parser */
function Places(knwl) {
  
  this.languages = {
    'english': true,
  };

  this.calls = function() {
      var words = knwl.words.get('linkWordsCasesensitive');
      var results = [];

      let fullSentence = words.join(' ');
      words = fullSentence.split(', ');
    
    let buildingName = /([A-Za-z]+)/;
    let localAddress = /(\d+)?( ?[A-za-z])+/;
    let postCode = /([A-Z]{1,2}\d{1,2}[A-Z]? \d[A-Z]{2})/;
    let success = true;

    let hasBuildingName = false;
    let thisBuildingName = '';
    let thisLocalAddress = '';
    let thisPostCode = '';

    if (words.length >= 3) {

    if (words[0].match(buildingName).index == 0) {
        thisBuildingName = words[0];
        hasBuildingName = true;
    }

    let startPoint = 0;
    let endPoint = words.length - 1;
    if (hasBuildingName) {
        startPoint++;
    }

    for (var i = startPoint; i < endPoint; i++) {
        if (words[i].match(localAddress).index == 0) {
            thisLocalAddress += words[i] + ', ';
        } else {
            success = false;
        }
    }
    thisLocalAddress = thisLocalAddress.substring(thisLocalAddress.length-2, thisLocalAddress.length);

    if (words[words.length - 1].match(postCode).index == 0) {
        thisPostCode = words[words.length - 1];
    } else {
        success = false;
    }

    

    } else {
        success = false;
    }

    if (success) {
        var newAddress = {
            buildingName: thisBuildingName,
            localAddress: thisLocalAddress,
            postCode: thisPostCode,
            fullAddress: fullSentence
        };
        results.push(newAddress);
    }
  
      return results;
  
  };
  
  var places = this;

};
module.exports = Places;
