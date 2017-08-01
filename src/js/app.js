// GOOGLE MAPS CODE ============================================================
// (https://developers.google.com/maps/documentation/javascript/examples/map-simple)

let map;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {
      lat: 40.7339945,
      lng: -73.9858134
    },
    zoom: 12,
    disableDefaultUI: true
  });
  ko.applyBindings(new VM());
}

// New York's hottest bathrooms ================================================
const bathroomArray = [{
    id: "4d9c92f4baae54815f2cde64",
    name: "Dream Downtown",
    lat: 40.742291,
    lng: -74.0056441
  }, {
    id: "5866c6299398ab0830a60b8d",
    name: "Stewart Hotel",
    lat: 40.7487243,
    lng: -73.9938283
  },
  {
    id: "54419745498e8a6b5608301b",
    name: "The Milling Room",
    lat: 40.783747,
    lng: -73.9766567
  },
  {
    id: "56f32b83cd1058e40988b7e4",
    name: "The William Vale Hotel",
    lat: 40.722283,
    lng: -73.9588797
  },
  {
    id: "439ab2a9f964a520d12b1fe3",
    name: "Bam Rose Cinemas",
    lat: 40.6863328,
    lng: -73.9797778
  },
  {
    id: "5487845b498ed6d0cef81f32",
    name: "Gotan",
    lat: 40.7192553,
    lng: -74.0087969
  },
  {
    id: "4d531ddd7e0f8eec112b8ae4",
    name: "Corkbuzz",
    lat: 40.7350748,
    lng: -73.99533
  },
  {
    id: "49d18dfdf964a5208f5b1fe3",
    name: "The Plaza",
    lat: 40.7644691,
    lng: -73.9766764
  },
  {
    id: "560a9d9b498e4a17fa12b88f",
    name: "Routine",
    lat: 40.689767,
    lng: -73.9081967
  }
]

// Function for creating bathroom objects in KO ================================
let Bathroom = function(data) {
  "use strict";
  this.lat = ko.observable(data.lat);
  this.lng = ko.observable(data.lng);
  this.name = ko.observable(data.name);
  this.id = ko.observable(data.id);
  this.bio = ko.observable('');
  this.website = ko.observable('');
  this.img = ko.observable('');
  this.card = ko.observable('');
};

// VM Code ==============================================================
let VM = function() {

  "use strict";
  let self = this; // Bind to this
  this.bathrooms = ko.observableArray([]); // Create bathrooms array in KO
  let marker; // Initialize marker
  // Initialize infowindow object with maxWidth of 300px
  let IW = new google.maps.InfoWindow({
    maxWidth: 300,
  });

  // Loop through bathroomArray and assign each entry to list
  bathroomArray.forEach(function(bathroom) {
    self.bathrooms.push(new Bathroom(bathroom));
  });
  // Loop through each bathroom in this.bathrooms and assign values
  self.bathrooms().forEach(function(bathroom) {
    // Create a marker for the bathroom
    marker = new google.maps.Marker({
      position: new google.maps.LatLng(bathroom.lat(), bathroom.lng()),
      map: map,
      animation: google.maps.Animation.DROP // Set animation to drop
    });
    // Assign marker
    bathroom.marker = marker;

    // I went with foursquare because Yelp's fusion API doesn't support client-end calls. Meh. :/
    // For each bathroom in the array, make a AJAX call to Foursquare to scrape data
    $.ajax({
      url: 'https://api.foursquare.com/v2/venues/' + bathroom.id() +
        '?client_id=0K0OIU022VPILROCPI32UUS1IUAQ4EC332OSQJ24NJRF1SQU&client_secret=Z1KWVRGSHJVPMH2UZOPWZQKJM2OABK3FXHW5B04M3KKXIB4M&v=20170731',
      dataType: "json",
      success: function(data) {
        // If the AJAX call works:
        // This cleans up the response to make it easier to parse!
        let result = data.response.venue;

        // Grab Website, Image, and Bio. If nothing is returned set the value to a blank string.

        let website = result.hasOwnProperty('url') ? result.url : '';
        bathroom.website(website || '');

        if (result.bestPhoto.hasOwnProperty('prefix') && result.bestPhoto.hasOwnProperty('suffix')) {
          bathroom.img(result.bestPhoto.prefix + '250x250' + result.bestPhoto.suffix || '');
        } else {
          bathroom.img('');
        }

        let bio = result.hasOwnProperty('description') ? result.description : '';
        bathroom.bio(bio || '');

        // Put together card
        let card = '<div id="bathroomCard"><img id="bathroomPhoto" src="' +
          bathroom.img() +
          '" alt="Image of Location"><h1>' + bathroom.name() + '</h1><p><a href=' + bathroom.website() + '><i class="material-icons">info</i> Visit website</a> <a target="_blank" href=https://www.google.com/maps/dir/Current+Location/' +
          bathroom.lat() + ',' + bathroom.lng() + '><i class="material-icons">location_on</i> Get directions</a></p><p>' + bathroom.bio() + '</p></div>';

        // Add event listener for card
        google.maps.event.addListener(bathroom.marker, 'click', function() {
          IW.open(map, this);
          bathroom.marker.setAnimation(google.maps.Animation.BOUNCE);
          setTimeout(function() {
            bathroom.marker.setAnimation(null);
          }, 500);
          IW.setContent(card);
          map.setCenter(bathroom.marker.getPosition());
        });
      },
      // Handle errors
      error: function(e) {
        IW.setContent('<p>Data not found. :(</p>');
        document.getElementById("error").innerHTML = "<p>Data not found. :(</p>";
      }
    });
  });

  // Toggle card when user clicks on a list item
  self.showCard = function(bathroom) {
    google.maps.event.trigger(bathroom.marker, 'click');
  };

  // Search code ===============================================================
  // Search results array
  self.searchResults = ko.observableArray();

  // Start by adding all bathrooms
  self.bathrooms().forEach(function(bathroom) {
    self.searchResults.push(bathroom);
  });

  // On User Input update KO
  self.userInput = ko.observable('');

  // Refine results based upon user's search
  self.searchResultsMarkers = function() {
    let searchInput = self.userInput().toLowerCase();
    self.searchResults.removeAll();
    self.bathrooms().forEach(function(bathroom) {
      bathroom.marker.setVisible(false);
      // If bathroom matches search, add it to the array
      if (bathroom.name().toLowerCase().indexOf(searchInput) !== -1) {
        self.searchResults.push(bathroom);
      }
    });
    // If bathroom matches search, add marker
    self.searchResults().forEach(function(bathroom) {
      bathroom.marker.setVisible(true);
    });
  };

};
