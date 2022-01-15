////////////////////////////////////////////////////////////////////
// General settings
////////////////////////////////////////////////////////////////////

var map = L.map('map');
map.setView([55, 12], 3.5);

L.tileLayer('https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
}).addTo(map);


////////////////////////////////////////////////////////////////////
// New polygon layer: countries
////////////////////////////////////////////////////////////////////

// Define styles 
var standardStyle = {
  fillColor: "#ffe28a",
  weight: 1,
  color: '#666547',
  fillOpacity: 0.6,
  opacity: 1
}
var clickStyle = {
  fillColor: '#6fcb9f', 
  color: '#fb2e01', 
  weight: 3
}
var highlightStyle = {
  color: '#fb2e01',
  weight: 1.7,
  fillOpacity: 0.85,
}

function style() {
  return standardStyle
}

// Mouseover and mouseout functions
function highlightFeature(e) {
  var poly = e.target;
  info.update(poly.feature.properties);
  poly.setStyle(highlightStyle);
  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      poly.bringToFront();
  }
}

var lastOpen;
function resetHighlight(e) {
  var poly = e.target;
  if (poly._popup.isOpen()) {
    console.log("Popup is open.")
    lastOpen = e.target;
  } else {
    poly.setStyle(standardStyle);;
  }
  if (map.hasLayer(dataLayerGroup)) {
    dataLayerGroup.bringToFront();
  }
}

// Onclick function
function select(e) {
  if (lastOpen != null) {
    lastOpen.setStyle(standardStyle);
  }
  var poly = e.target;
  countriesLayer.setStyle(standardStyle);
  map.fitBounds(e.target.getBounds());
  poly.setStyle(clickStyle);
}

// Link functions to events
function onEachFeature(feature, layer) {
  // Define popup content 
  var popupContent;
  if (feature.properties.LANG1 && feature.properties.LANG2 && feature.properties.LANG3 && feature.properties.LANG4) {
    popupContent = 
      '<h1>' + feature.properties.NAME + '</h1>' + '\n' +
      'There are 4 official languages: ' + feature.properties.LANG1 + ' , ' + feature.properties.LANG2 + ' , ' + feature.properties.LANG3 + ' and ' + feature.properties.LANG4 + '.'
    } else if (feature.properties.LANG1 && feature.properties.LANG2 && feature.properties.LANG3) {
      popupContent = 
        '<h1>' + feature.properties.NAME + '</h1>' + '\n' +
        'There are 3 official languages: ' + feature.properties.LANG1 + ' , ' + feature.properties.LANG2 + ' and ' + feature.properties.LANG3 + '.'
    } else if (feature.properties.LANG1 && feature.properties.LANG2) {
      popupContent = 
        '<h1>' + feature.properties.NAME + '</h1>' + '\n' +
        'There are 2 official languages: ' + feature.properties.LANG1 + ' and ' + feature.properties.LANG2 + '.'
    } else {
      popupContent =
        '<h1>' + feature.properties.NAME + '</h1>' + '\n' +
        'The official language is ' + feature.properties.LANG1 + '. '
    }
  // Add popups to layer
  layer.bindPopup(popupContent)
  // Add events functions
  layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: select
  });
}

// Add layer with events to map
var countriesLayer = L.geoJSON(countries, {
  style: style,
  onEachFeature: onEachFeature
}).addTo(map);



////////////////////////////////////////////////////////////////////
// Add info box
////////////////////////////////////////////////////////////////////

var info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
};

info.update = function (props) {
    this._div.innerHTML = props ?
        '<b>' + props.NAME
        : 'Hover over a coutry';
};

info.addTo(map);



////////////////////////////////////////////////////////////////////
// Search a country functionnality 
////////////////////////////////////////////////////////////////////

L.Control.textbox = L.Control.extend({
  onAdd: function(map) {
    var text = L.DomUtil.create('div');
    text.id = "searchTextC";
    text.innerHTML = "<strong>Search country:</strong>"
    return text;
  }
});
L.control.textbox = function(opts) { return new L.Control.textbox(opts);}
L.control.textbox({ position: 'topleft' }).addTo(map);

var searchCountry = L.control.search({
  layer: countriesLayer,
  initial: false,
  propertyName: 'NAME',
  textPlaceholder: 'Search by country.',
  marker: false,
  // Move map to country location
  moveToLocation: function(latlng, title, map) {
    map.setView(latlng, 5);
    console.log(title);
  },
});

searchCountry.on('search:locationfound', function(e) {
  // Reset all polygons style
  countriesLayer.setStyle(standardStyle);
  // Select searched country
  e.layer.setStyle(clickStyle);
  e.layer.openPopup();
  // Delete results from language search if any
  if(dataLayerGroup){
    dataLayerGroup.remove();
  };
});

// Add to map
map.addControl(searchCountry);
L.DomUtil.addClass(searchCountry.getContainer(),'info')



////////////////////////////////////////////////////////////////////
// Search a language functionality
////////////////////////////////////////////////////////////////////

var dataLayerGroup;
var filterval = document.querySelector('input[name="radioLang"]:checked').value;

// Filters countries based on selected language
var langFilter = function (feature) {
  if (feature.properties.LANG1 === filterval || feature.properties.LANG2 === filterval || 
    feature.properties.LANG3 === filterval || feature.properties.LANG4 === filterval) return true}

// Delete previous results and highlights selected countries
function addLayerToMap(){
  if (map.hasLayer(dataLayerGroup)) {
  dataLayerGroup.remove();
  }
  // Define new layer of selected countries
  dataLayerGroup = L.geoJson(countries, {
      filter: langFilter,
      pointToLayer: function(feature, latlng) {
          return new L.CircleMarker(latlng, {radius: 8, fillOpacity: 0.85});
      },
      onEachFeature: function (feature, layer) {
          layer.bindPopup(feature.properties.color);
      }, 
      style: ({color: '#fb2e01', weight: 3}),
      interactive: false
      }).addTo(map);
  }

// Add listener to search button
function searchLangFunction(){
  filterval = document.querySelector('input[name="radioLang"]:checked').value;
  map.setView([55, 12], 3.5);
  console.log("The filter was changed to ", filterval);
  countriesLayer.setStyle(standardStyle);
  map.closePopup();
  addLayerToMap();
  };



////////////////////////////////////////////////////////////////////
// Reset button
////////////////////////////////////////////////////////////////////

function reset() {
  // Delete dataLayerGroup if it exists
  if (map.hasLayer(dataLayerGroup)) {
    dataLayerGroup.remove();
    }
  countriesLayer.setStyle(standardStyle);
  // Reset zoom
  map.setView([55, 12], 3.5);
  // Close any open popup
  map.closePopup();
}

// Add listener to reset button
function resetFunction(){
  reset();
  console.log("Map was reset.");
  };