/* Place Parser */


/*
NOTE: THIS WAS A COPY OF THE DEFAULT
PLACES PLUGIN, BUT THE THIS.CALLS
FUNCTION IS COMPLETELY RE-WRITTEN
*/

function Places(knwl) {
  
  this.languages = {
    'english': true,
  };

  this.calls = function() {
      var words = knwl.words.get('linkWordsCasesensitive');
      var results = [];

      //Handles if a phone number is split by spaces
      let fullSentence = words.join(' ');
      fullSentence = fullSentence.replace(/, /g, ',');
      fullSentence = fullSentence.replace(/ /g, '|');
      words = fullSentence.split(',');
      for (var i = 0; i < words.length; i++) {
        words[i] = words[i].replace(/\|/g, ' ');
      }
    
    let buildingName = /([A-Za-z]+)/;
    let localAddress = /(\d+)?( ?[A-za-z])+/;
    let postCode = /([A-Z]{1,2}\d{1,2}[A-Z]? \d[A-Z]{2})/;
    let success = true;

    let hasBuildingName = false;
    let thisBuildingName = '';
    let thisLocalAddress = '';
    let thisPostCode = '';

    //minimum length for an address
    if (words.length >= 3) {
        let addressEndPoint;

        /*
        Checks for a post code to determine if
        an address is present at all and trims
        any excess text behind the the post code
        */
        fullSentence = '';
        let found = false;
        for (var i = words.length - 1; i >= 0; i--) {
          if (found == false) {
            if (words[i].match(postCode) != null) {
                fullSentence += words[i] + ', ';
                addressEndPoint = i;
                found = true;
            }
          } else {
            fullSentence += words[i] + ', ';
          }
        }
        fullSentence = fullSentence.substring(0, fullSentence.length - 2);
        fullSentence = fullSentence.split(', ').reverse().join(', ');

        if (addressEndPoint == null) {
            success = false;
        } else {
          /*
          Match if the address has a building name
          (NOTE: Picks up anything that is not preceded
          by a digit)
          */
            if (words[0].match(buildingName) != null) {
                if (words[0].match(buildingName).index == 0) {
                    thisBuildingName = words[0];
                    hasBuildingName = true;
                }
            }

            let startPoint = 0;
            let endPoint = addressEndPoint;
            if (hasBuildingName) {
                startPoint++;
            }

            //Finds all address lines between the building
            //name and the post code
            for (var i = startPoint; i < endPoint; i++) {
                if (words[i].match(localAddress) != null) {
                    if (words[i].match(localAddress).index == 0) {
                        thisLocalAddress += words[i] + ', ';
                    } else {
                        success = false;
                    }
                } else {
                    success = false;
                }
            }

            //Gets the actual post code
            if (words[addressEndPoint].match(postCode) != null) {
                thisPostCode = words[addressEndPoint];
            } else {
                success = false;
            }
        }
    } else {
        success = false;
    }

    //If one is found return an object
    //containing all the data
    if (success) {
        var newAddress = {
            buildingName: thisBuildingName,
            localAddress: thisLocalAddress,
            postCode: thisPostCode,
            fullAddress: fullSentence.split('.')[0]
        };
        results.push(newAddress);
    }
  
      return results;
  
  };
  
  var places = this;

};
module.exports = Places;
