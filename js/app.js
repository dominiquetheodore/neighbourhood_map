// array contains all locations to be displayed
var myLocations = [
{
    'title': 'Buckingham Palace',
    'coords': {
        lat: 51.5014,
        lng: -0.1419
    }
}, {
    'title': 'South Kensington',
    'coords': {
        lat: 51.4941,
        lng: -0.1739
    },
}, {
    'title': 'Oxford Street',
    'coords': {
        lat: 51.515419,
        lng: -0.141099
    },
}, {
    'title': 'Russell Square',
    'coords': {
        lat: 51.5217,
        lng: -0.1259
    },
}, {
    'title': 'Camden Town',
    'coords': {
        lat: 51.5390,
        lng: -0.1426
    },
}, {
    'title': 'Shepherds Bush',
    'coords': {
        lat: 51.5052,
        lng: -0.2245
    },
}, {
    'title': 'Soho',
    'coords': {
        lat: 51.5136,
        lng: -0.1365
    },
}, {
    'title': 'Covent Garden',
    'coords': {
        lat: 51.5117,
        lng: -0.1233
    }
}, {
    'title': 'Hyde Park',
    'coords': {
        lat: 51.5073,
        lng: -0.1657
    }
},
{
    'title': 'Picadilly Circus',
    'coords': {
        lat: 51.510067,
        lng: -0.133869
    }
}];


var map;

/* start knockoutJS viewmodel */
var ViewModel = function() {
    var self = this;
    self.infoWindow = new google.maps.InfoWindow({
        minWidth: 3000
    });

    // reset map
    google.maps.event.addDomListener(document.getElementById("reset-btn"), "click", function() {
        map.setZoom(13);
        map.setCenter(myLocations[0].coords);
        self.infoWindow.close();
    });

    // define location class
    var Location = function(data) {
        this.title = ko.observable(data.title);
        this.location = ko.observable(data.coords);
        this.description = ko.observable(data.description);
        // marker is used for google map api
        this.marker = new google.maps.Marker({
            title: this.title(),
            position: this.location(),
            map: map,
        }, this);
        this.marker.addListener('click', function() {
            self.toggleBounce(this);
            map.setCenter(this.getPosition());
            map.setZoom(15);
            self.populateInfoWindow(this, self.infoWindow);
        });
    };

    // toggle marker animation
    self.toggleBounce = function(marker) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        window.setTimeout(function() {
            marker.setAnimation(null);
        }, 1400);
    };

    self.locationList = ko.observableArray([]);
    myLocations.forEach(function(loc_item) {
        var loc = new Location(loc_item);
        // push it into location list
        self.locationList().push(loc);
    });

    self.visiblePlaces = ko.observableArray([]);
    myLocations.forEach(function(loc) {
        var loc = new Location(loc);
        self.visiblePlaces().push(loc);

    });

    self.searchTerm = ko.observable('');

    self.filterLocations = function() {
        self.visiblePlaces.removeAll();
        self.locationList().forEach(function(loc) {
            if (loc.title().toLowerCase().indexOf(self.searchTerm()) != -1) {
                self.visiblePlaces.push(loc);
            }
        });
    }

    self.currentLocation = ko.observable('');

    // set location through list menu
    this.setLocation = function(clickedLocation) {
        self.currentLocation(clickedLocation);
        self.populateInfoWindow(clickedLocation.marker, self.infoWindow);
        map.setCenter(clickedLocation.marker.getPosition());
        map.setZoom(15);
        self.toggleBounce(clickedLocation.marker);
        closeNav();
    };

    self.populateInfoWindow = function(marker, infowindow) {
        if (infowindow.marker != marker) {
            infowindow.setContent('');
            infowindow.marker = marker;
            // Make sure the marker property is cleared if the infowindow is closed.
            infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
                marker.setAnimation(null);
            });
            var streetViewService = new google.maps.StreetViewService();
            var radius = 50;

            infowindow.setContent('<div id="infowindow_wrapper">' + '<h2>' + marker.title + '</h2>' + '<div id="pano"></div>' + '<div id="wiki-container"></div>' + '<div id="flickr-badges"></div></div>');

            function getStreetView(data, status) {
                if (status == google.maps.StreetViewStatus.OK) {
                    var nearStreetViewLocation = data.location.latLng;
                    var heading = google.maps.geometry.spherical.computeHeading(
                        nearStreetViewLocation, marker.position);

                    var panoramaOptions = {
                        position: nearStreetViewLocation,
                        pov: {
                            heading: heading,
                            pitch: 30
                        }
                    };
                    var panorama = new google.maps.StreetViewPanorama(
                        document.getElementById('pano'), panoramaOptions);
                    $('#pano').show();
                    panorama.setVisible(true);
                } else {
                    infowindow.setContent('<h4>' + marker.title + '</h4><hr>' +
                        '<div>No Street View Found</div>');
                }
            };

            //fetch wikipedia article about the chosen location
            var $station = marker.title;

            function getWikiSnippet() {
                $.ajax({
                    url: 'https://en.wikipedia.org/w/api.php',
                    data: {
                        action: 'opensearch',
                        search: $station,
                        format: 'json'
                    },
                    dataType: 'jsonp',
                    success: function(apiResult) {
                        $('#wiki-container').empty();
                        $('#wiki-container').append('<p>' + apiResult[2][0] + '</p><a href="' + apiResult[3][0] + '">' + 'Wikipedia' + '</a>');
                    },
                    error: function() {
                        alert('Unable to fetch Wikipedia articles');
                    }
                });
            };
            getWikiSnippet();

            // fetch nearby restaurants with Foursquare API
            var CLIENT_ID_Foursquare = 'LLZ2Y4XNAN2TO4UN4BOT4YCC3GVPMSG5BVI545HG1ZEMBDRM';
            var CLIENT_SECRET_Foursquare = '0UTHYFC5UAFI5FQEXVAB5WIQREZCLCANHT3LU2FA2O05GW3D';

            function getRestaurants() {
                $.ajax({
                    type: "GET",
                    dataType: 'json',
                    cache: false,
                    url: "https://api.foursquare.com/v2/venues/search?client_id=" + CLIENT_ID_Foursquare + "&client_secret=" + CLIENT_SECRET_Foursquare + "&v=20130806&ll=" + marker.getPosition().lat() + ',' + marker.getPosition().lng() + '&query=restaurant',
                    async: true,
                    success: function(data) {
                        venues = data.response.venues;
                        $('#fnav').empty();
                        $.each(venues, function(key, val) {
                            $.ajax({
                                type: "GET",
                                dataType: 'json',
                                cache: false,
                                url: "https://api.foursquare.com/v2/venues/" + val.id,
                                data: 'client_id=' + CLIENT_ID_Foursquare + '&client_secret=' + CLIENT_SECRET_Foursquare + '&v=20140806',
                                async: true,
                                success: function(data) {
                                    $('#fnav').append('<li class="venue"><b>' + val.name + '</b>' + (data.response.venue.rating ? ('<br>' + 'Foursquare rating: ' + '<b>' + data.response.venue.rating + '</b>' + '<br>') : '<br>') + val.location.formattedAddress + '<br>' + (val.url ? '<a target="_blank" href="' + val.url + '">' + val.url + '</a>' : '') + '</li>');
                                },
                                error: function() {
                                    alert('Unable to fetch restaurants from Foursquare');
                                }
                            });

                        });
                    }
                });
            };
            getRestaurants();

            // Use streetview service to get the closest streetview image
            streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);

            // Open the infowindow on the correct marker.
            infowindow.open(map, marker);

        }
    };
};

// load Google Map
var initMap = function() {
    var markers = [];
    // define a basic map with necessary data
    map = new google.maps.Map(document.getElementById('map'), {
        center: myLocations[8].coords,
        zoom: 13
    });

    google.maps.event.addDomListener(window, "resize", function() {
        var center = map.getCenter();
        google.maps.event.trigger(map, "resize");
        map.setCenter(center);
    });

    // Instantiate ViewModel
    ko.applyBindings(new ViewModel(map));
};