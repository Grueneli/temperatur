/* Wetterstationen Euregio Beispiel */

// Innsbruck
let ibk = {
    lat: 47.267222,
    lng: 11.392778
};

// Karte initialisieren
let map = L.map("map", {
    fullscreenControl: true, //maxZoom: 12,
}).setView([ibk.lat, ibk.lng], 11);

// thematische Layer
let themaLayer = {
    stations: L.featureGroup(),
    temperatur: L.featureGroup(),
    wind: L.featureGroup(),
    snowhights: L.featureGroup(),
}

// Hintergrundlayer
let layerControl = L.control.layers({
    "Relief avalanche.report": L.tileLayer(
        "https://static.avalanche.report/tms/{z}/{x}/{y}.webp", {
        attribution: `© <a href="https://lawinen.report">CC BY avalanche.report</a>`, maxZoom: 12,
    }).addTo(map),
    "Openstreetmap": L.tileLayer.provider("OpenStreetMap.Mapnik"),
    "Esri WorldTopoMap": L.tileLayer.provider("Esri.WorldTopoMap"),
    "Esri WorldImagery": L.tileLayer.provider("Esri.WorldImagery")
}, {
    "Wetterstationen": themaLayer.stations,
    "Temperatur": themaLayer.temperatur.addTo(map),
    "Wind": themaLayer.wind.addTo(map),
    "Schneehöhen": themaLayer.snowhights.addTo(map),
}).addTo(map);

layerControl.expand();


// Maßstab
L.control.scale({
    imperial: false,
}).addTo(map);

function getColor(value, ramp) { //value = temperatur, ramp= Colorramp
 for(let rule of ramp){ //rule wird dann überprüft ob sie zwischen min und max ist
        if (value >= rule.min && value < rule.max){
            return rule.color;
        }
    }
}
console.log (getColor(-40, COLORS.temperatur));

//Rain Viewer
L.control.rainviewer({ 
    position: 'bottomleft',
    nextButtonText: '>',
    playStopButtonText: 'Play/Stop',
    prevButtonText: '<',
    positionSliderLabelText: "Hour:",
    opacitySliderLabelText: "Opacity:",
    animationInterval: 500,
    opacity: 0.5
}).addTo(map);

function writeStationLayer(jsondata) {
    L.geoJSON(jsondata, {
        pointToLayer: function (feature, latlng){
            return L.marker (latlng, {
                icon: L.icon({
                    iconUrl: "icons/icons.png",
                    iconSize: [32,37],
                    iconAnchor: [16, 37],
                    popupAnchor: [0, -37]
                }),
            });
        },
        onEachFeature: function(feature,layer) {
            let prop = feature.properties;
            let array = feature.geometry.coordinates
            let pointInTime = new Date (prop.date); //erzeug mir ein neues Java Daten objekt das prop.date heißt  => richtiges Datum erstellt
            //console.log(pointInTime);
            layer.bindPopup (`
            <h4> ${prop.name}, ${array[2]} m ü. NN </h4>
           <ul>
            <li> Lufttemperatur in °C: ${prop.LT|| "-"} </li>
            <li> Relative Luftfeuchte in %: ${prop.RH || "-"} </li>
            <li> Windgeschwindigkeit in km/h: ${(prop.WG*3.6).toFixed(1)|| "-"} </li> 
            <li> Schneehöhe in cm: ${prop.HS || "-"} </li>
            </ul>
            <span>${pointInTime.toLocaleDateString()}</span>
            `);
        }
        //if (prop.WG) {return (prop.WG *3.6).toFixed(1);}else {return "-";} /toFixed: ich will nur eine Nachkomma stelle
        //to.LocaleDateString() => normales Datum tt.mm.jjjj

       
    }).addTo(themaLayer.stations)
}

// Icon für Temperatur 
function writeTemperatureLayer (jsondata){
    L.geoJSON(jsondata, {
        filter: function (feature){
            if (feature.properties.LT > -50 && feature.properties.LT <50){
                return true;

            }
        },
        pointToLayer: function (feature, latlng){
            let color = getColor (feature.properties.LT, COLORS.temperatur); //Variable definieren mit zwei werten: da wo wir die werte herbekommen (LT) und wo wir die Farben finden
            return L.marker (latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                 html: `<span style= "background-color:${color}">${feature.properties.LT.toFixed(1)}</span>`  
                }),
            });
        },
    }).addTo(themaLayer.temperatur);
}
// Icon für Wind
function writeWindLayer (jsondata){ // anpasssen
    L.geoJSON(jsondata, {
        filter: function (feature){
            if (feature.properties.WG > 0 && feature.properties.WG <300){
                return true;

            }
        },
        pointToLayer: function (feature, latlng){
            let color = getColor (feature.properties.WG, COLORS.wind); //Variable definieren mit zwei werten: da wo wir die werte herbekommen (LT) und wo wir die Farben finden
            return L.marker (latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                 html: `<span style= "background-color:${color}">${feature.properties.WG.toFixed(1)}</span>`  
                }),
            });
        },
    }).addTo(themaLayer.wind); 
}

//Icon für Schneehöhe
function writeSchneehöhenLayer (jsondata){ // anpasssen
    L.geoJSON(jsondata, {
        filter: function (feature){
            if (feature.properties.HS > 0 && feature.properties.HS <1000){
                return true;

            }
        },
        pointToLayer: function (feature, latlng){
            let color = getColor (feature.properties.HS, COLORS.snowhights); //Variable definieren mit zwei werten: da wo wir die werte herbekommen (LT) und wo wir die Farben finden
            return L.marker (latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                 html: `<span style= "background-color:${color}">${feature.properties.HS.toFixed(1)}</span>`  
                }),
            });
        },
    }).addTo(themaLayer.snowhights); 
}

// Wetterstationen Tirol
async function loadStations(url) {
    let response = await fetch(url);
    let jsondata = await response.json();
    writeStationLayer (jsondata);
    writeTemperatureLayer (jsondata);
    writeWindLayer(jsondata);
    writeSchneehöhenLayer(jsondata);
  

    // Wetterstationen mit Icons und Popups implementieren

}
loadStations("https://static.avalanche.report/weather_stations/stations.geojson");
