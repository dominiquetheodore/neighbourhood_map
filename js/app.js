var map;

/* start knockoutJS viewmodel */
var ViewModel = function(map) {
    var self = this;

    self.infoWindow = new google.maps.InfoWindow({
        minWidth: 3000
    });

    self.searchTerm = ko.observable('');

    self.restaurantsList = ko.observableArray([]);

    var CLIENT_ID_Foursquare = 'DIDEED10YVJT00JEPMBOEKW0DD4YCTNCXL2BYUWG0TKLZVNF';
    var CLIENT_SECRET_Foursquare = 'EKQJTSMJDU1144G2N3NZDGMFNP3HSW2TCJAVFRTUW3BLNU2L';

    // reset map
    google.maps.event.addDomListener(document.getElementById("reset-btn"), "click", function() {
        map.setZoom(13);
        map.setCenter(myLocations[0].coords);
        self.searchTerm('');
        self.infoWindow.close();
    });


    function getRestaurants(marker) {
        $.ajax({
            type: "GET",
            dataType: 'json',
            cache: false,
            url: "https://api.foursquare.com/v2/venues/search?client_id=" + CLIENT_ID_Foursquare + "&client_secret=" + CLIENT_SECRET_Foursquare + "&v=20130806&ll=" + marker.getPosition().lat() + ',' + marker.getPosition().lng() + '&radius=800&query=restaurant',
            async: true,
            success: function(data) {
                self.restaurantsList.removeAll();
                self.restaurantsList(data.response.venues);
            },
            error: function() {
                alert('unable to fetch restaurants from Foursquare API');
            }
        });
    }

    function processResults(data) {
        console.log(data.response.venues);
        self.restaurantsList.push(data.response.venues);
    }

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
            self.currentLocation(this);
            getRestaurants(this);
            self.populateInfoWindow(this, self.infoWindow);
            map.panBy(0, -200); //prevent infowindow from getting cropped 
            closeNav();
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

    self.filteredList = ko.computed(function() {
        var searchTerm = self.searchTerm().toLowerCase();
        if (searchTerm === null) {
            return self.locationList();
        } else {
            return ko.utils.arrayFilter(self.locationList(), function(location) {
                if (location.title().toLowerCase().indexOf(searchTerm) >= 0) {
                    // show the marker on google map
                    location.marker.setVisible(true);
                    return true;
                } else {
                    location.marker.setVisible(false);
                    return false;
                }
            });
        }
    });

    // set location through list menu
    self.currentLocation = ko.observable('');
    this.setLocation = function(clickedLocation) {
        self.currentLocation(clickedLocation);
        google.maps.event.trigger(clickedLocation.marker, 'click');
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

            var getWikiSnippet = function() {
                $.ajax({
                    url: 'https://en.wikipedia.org/w/api.php',
                    data: {
                        action: 'opensearch',
                        search: marker.title,
                        format: 'json'
                    },
                    dataType: 'jsonp',
                    success: function(apiResult) {
                        // Use streetview service to get the closest streetview image
                        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
                        infowindow.setContent('<div id="infowindow_wrapper">' +
                            '<h2>' + marker.title + '</h2>' +
                            '<div id="pano"></div>' +
                            '<div id="wiki-container">' + '<br>' + apiResult[2][0] + '<br><br><a href="' + apiResult[3][0] + '">' + 'Wikipedia' + '</a>' + 
                            '</div>' + 
                            '</div>');
                    },
                    error: function() {
                        alert('could not load wikipedia article');
                    }
                });
            };
            getWikiSnippet();

            var streetViewService = new google.maps.StreetViewService();
            var radius = 50;


            var getStreetView = function(data, status) {
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

                } else {
                    infowindow.setContent('<h4>' + marker.title + '</h4><hr>' +
                        '<div>No Street View Found</div>');
                }
            };

            // Open the infowindow on the correct marker.
            infowindow.open(map, marker);

        }
    };

};

// load Google Map
var initMap = function() {
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