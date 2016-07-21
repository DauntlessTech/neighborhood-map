var cityMarkersArr = [];

function ViewModel(map, latLng, geocoder) {
    var self = this;

    self.address = ko.observableArray();
    self.filter = ko.observableArray();

    self.venues = ko.observableArray();
    var venues = self.venues;

    self.refineArr = ko.observableArray();
    var refineArr = self.refineArr;

    self.markersArr = ko.observableArray();
    var markersArr = self.markersArr;

    self.cityMarker = ko.observable();

    self.bookmarks = ko.observableArray();
    var bookmarks = self.bookmarks;

    function getData(map, geocoder, address, filter, venues) {

        if (cityMarkersArr.length > 0) {

            cityMarkersArr[0].setMap(null);
            cityMarkersArr = [];
            //clear the sidebar list before every search
            $('#info').text('');
            //clear the map of markers
            $(markersArr()).each(function(index) {
                markersArr()[index].setMap(null);
            });
            //empty the array of markers
            markersArr([]);
            venues([]);
            refineArr([]);
        }

        geocoder.geocode({
                address: address
            },
            function(results, status) {
                if (status === google.maps.GeocoderStatus.OK) {

                    latLng = results[0].geometry.location;
                    map.setCenter(results[0].geometry.location);
                    map.setZoom(14);
                    //main marker seprate of markersArr
                    self.cityMarker = new google.maps.Marker({
                        map: map,
                        position: latLng,
                        icon: 'https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png',
                        draggable: false,
                        infowindow: new google.maps.InfoWindow({
                            content: address
                        })
                    });
                    self.cityMarker.infowindow.open(map, self.cityMarker);
                    cityMarkersArr.push(self.cityMarker);

                    var jqxr = $.get('https://api.foursquare.com/v2/venues/search?&client_id=4DZ0UPQETEOFEHOWZHKDEDAVMELD1WW5GQWQWRM25M2IZSNS&client_secret=BTQAOLRHOAJPDQKYDG0I4XOPWPH4W5IZGDVNGZCXT1TCEWTF&v=20130815' +
                        '&ll=' + latLng.lat() + ', ' + latLng.lng() +
                        '&query=' + filter,
                        function(result, status) {
                            console.log('api call succeded: ' + new Date());
                            var newLatLng;
                            $(result.response.venues).each(function(i) {

                                newLatLng = {
                                    lat: result.response.venues[i].location.lat,
                                    lng: result.response.venues[i].location.lng
                                };
                                //infowindow content string
                                var name = result.response.venues[i].name;
                                if (name === null) {
                                    name = 'Not Available';
                                }
                                var url = result.response.venues[i].url;
                                var urlText = url;
                                if (url === null) {
                                    //added to avoid clicking on blank urls, a better implementaion would be to remove the url element if it is undefined. But that would require new variable assignments and I am lazy.
                                    url = 'javascript: void(0)';
                                    urlText = 'Not Available';
                                }
                                var phone = result.response.venues[i].contact.formattedPhone;
                                if (phone === null) {
                                    phone = 'Not Available';
                                }
                                var twitter = result.response.venues[i].contact.twitter;
                                if (twitter === null) {
                                    twitter = 'Not Available';
                                } else {
                                    twitter = '@' + twitter;
                                }
                                var infoString =
                                    '<article class="uk-comment infowindow"><h3>' + name + '<h3>' +
                                    ' <h4 class="uk-comment-title">Web: <a href="' + url + '" target="_blank"> <img class="uk-icon-small uk-float-right" src="data/img/open.png" alt="Open In New Browser">' + urlText + '</a></h4> ' +
                                    '<div class="uk-comment-meta"><p> Phone: ' + phone + ' | Twitter: ' + twitter + '</p></div></article><hr class="uk=grid-divider"/>';

                                //make sure the venues are not already in any arrays to avoid duplicates
                                if (venues.indexOf(result.response.venues.name) > 0 && refineArr.indexOf(result.response.venues.name) && markersArr.indexOf(result.response.venues.name)) {
                                    return false;
                                } else {
                                    venues.push({
                                        name: result.response.venues[i].name,
                                        url: result.response.venues[i].url,
                                        phone: result.response.venues[i].contact.formattedPhone,
                                        twitter: result.response.venues[i].contact.twitter,
                                        city: result.response.venues[i].location.city.toUpperCase(),
                                        add: result.response.venues[i].location.address,
                                        id: i
                                    });
                                    refineArr.push({
                                        name: result.response.venues[i].name,
                                        url: result.response.venues[i].url,
                                        phone: result.response.venues[i].contact.formattedPhone,
                                        twitter: result.response.venues[i].contact.twitter,
                                        city: result.response.venues[i].location.city.toUpperCase(),
                                        add: result.response.venues[i].location.address,
                                        id: i
                                    });
                                    markersArr.push(
                                        new google.maps.Marker({
                                            name: result.response.venues[i].name,
                                            map: map,
                                            position: newLatLng,
                                            icon: 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png',
                                            infowindow: new google.maps.InfoWindow({
                                                content: infoString,
                                                id: i
                                            }),
                                            click: function(id) {
                                                var marker = this;
                                                $(markersArr()).each(function(index) {
                                                    if (markersArr()[index] !== markersArr()[id]) {
                                                        markersArr()[index].infowindow.close();
                                                    }
                                                });
                                                //close the main marker
                                                self.cityMarker.infowindow.close();
                                                marker.setAnimation(google.maps.Animation.BOUNCE);
                                                setTimeout(function() {
                                                    marker.setAnimation(null);
                                                }, 750);
                                                marker.infowindow.open(map, this);
                                            }
                                        })
                                    );
                                }
                            });
                        }).fail(function(status) {
                        alert("Api call failed");
                    }).done(function() {
                        console.log('foursquare data recieved: ' + new Date());
                        $(markersArr()).each(function(index) {
                            markersArr()[index].setMap(map);
                            markersArr()[index].addListener('click', markersArr()[index].click);
                        });
                    }).always(function() {
                        console.log('foursquare finished: ' + new Date());
                    });

                } else {
                    if (address === '') {
                        alert('Search requires an address');
                    } else {
                        alert('Geocode was not successful for the following reason: ' + status);
                    }
                }
            });
    }

    self.functions = {
        markerSearch: function(element) {
            var id = element.id;
            markersArr()[id].click(id);
        },
        venueSearch: function(element) {
            var address = self.address();
            var filter = self.filter();

            getData(map, geocoder, address, filter, venues);
        },
        bookmarkIt: function(element) {
            var bookmarkIndex = bookmarks.indexOf(element);
            var bookmarkCache = {
                info: element,
                marker: markersArr()[element.id]
            };

            if (bookmarkIndex === -1) {
                bookmarks.push(bookmarkCache);
                venues.remove(element);
                bookmarkCache.marker.click(element.id);
            } else {
                venues.push(element.info);
                bookmarks.remove(element);
            }
        },
        bookmarkSearch: function(element) {
            element.marker.setMap(map, element.marker);
            element.marker.infowindow.open(map, element.marker);
            map.setCenter(element.marker.position);
        },
        refine: ko.observable(''),
        refineResults: function(value) {
            var filter = value.toString().toLowerCase();
            venues.removeAll();
            return ko.utils.arrayFilter(refineArr(), function(refine) {
                if (refine.name.indexOf(value.toLowerCase() >= 0)) {
                    var name = refine.name.toString().toLowerCase();

                    if (name.indexOf(filter)) {
                        //clear markers and list items that don't match
                        markersArr()[refine.id].setMap(null);
                        venues.remove(refine);
                    } else {
                        //add them if they do
                        markersArr()[refine.id].setMap(map, this);
                        venues.push(refine);
                    }
                } else {
                    //if there is no value rest to default list
                    $(refineArr).each(function(index) {
                        venues().push(this[index]);
                        markersArr()[index].setMap(map, this);
                    });
                }
            });
        }
    };
    self.functions.refine.subscribe(self.functions.refineResults);
}

function initMap() {
    var map;
    var latLng = { lat: 47.605358, lng: -122.331099};

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 8,
        center: latLng,
        disableDefaultUI: true
    });

    var geocoder = new google.maps.Geocoder();

    $(window).resize(function() {
        $('#map').height($(window).height());
        $('#map').width($(window).width());
        map.setCenter(latLng);
    });

    var styles = [{"featureType":"administrative","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"administrative.country","elementType":"geometry.stroke","stylers":[{"visibility":"off"}]},{"featureType":"administrative.province","elementType":"geometry.stroke","stylers":[{"visibility":"off"}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"visibility":"on"},{"color":"#e3e3e3"}]},{"featureType":"landscape.natural","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"all","stylers":[{"color":"#cccccc"}]},{"featureType":"road","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit.line","elementType":"geometry","stylers":[{"visibility":"off"}]},{"featureType":"transit.line","elementType":"labels.text","stylers":[{"visibility":"off"}]},{"featureType":"transit.station.airport","elementType":"geometry","stylers":[{"visibility":"off"}]},{"featureType":"transit.station.airport","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#FFFFFF"}]},{"featureType":"water","elementType":"labels","stylers":[{"visibility":"off"}]}];

    map.setOptions({
        styles: styles
    });
    ko.applyBindings(new ViewModel(map, latLng, geocoder));
}
