"use strict";

var jsonObject;
var objectArray = [];
var elevationArray = [];
var speedArray = [];
var latArray = [];
var lonArray = [];
var timeArray = [];
var deltaTimeArray = [];
var distanceArray = [];
var maxspeed;



// Check for File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
} else {
  alert('The File APIs are not fully supported in this browser.');
}

function handleFileSelect(evt) {
  var files = evt.target.files; // FileList object

  // files is a FileList of File objects. List some properties.
  var output = [];
  for (var i = 0, f; f = files[i]; i++) {
    output.push('<li><strong>', escape(f.name), '</strong><br>',
            ' - last modified: ',
            f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
          '</li>');

    var reader = new FileReader();
    reader.readAsText(f);

    // Invoked when file is loading.
    reader.onload = function(){
	
      var contentfile = reader.result;
	  
	  var xmldata = parseXml(reader.result);
	  
	  // assistance for speed calculation
	  for(var i = 0; i < xmldata.segments[0].length; i++){
		latArray[i] = (xmldata.segments[0][i].loc[0]);
		lonArray[i] = (xmldata.segments[0][i].loc[1]);
		timeArray[i] = (xmldata.segments[0][i].time);
	  }
	  // set first of these to 0
	  deltaTimeArray[0] = 0;
	  distanceArray[0] = 0;
	  speedArray[0] = 0;
	  
	  // use the distance calculation function to get the single speeds
	  for(var i = 0; i < xmldata.segments[0].length-1; i++){
		distanceArray[i+1] = distVincenty(latArray[i], latArray[i+1], lonArray[i], lonArray[i+1]);
		deltaTimeArray[i+1] = (timeArray[i+1] - timeArray[i]) / 1000;
		speedArray[i+1] = (distanceArray[i+1] / deltaTimeArray[i+1]) * 3.6;
	  }
	  // Maximum Speed in a segment between two points
	  maxspeed = Math.max(...speedArray);
	  
      var lgpx =  new L.GPX(contentfile, {
                async: true
              }).on('loaded', function(e) {
                map.fitBounds(e.target.getBounds());
                //console.log(xmldata);

                // Convert track distance to more readable form
                var trackdistance = e.target.get_distance().toString();
                var trackdis = trackdistance.split(".");

                // Convert Track Duration from ms to more readable form
                var trackduration = e.target.get_total_time();
                var time = parseMsToReadableTime(trackduration);

                // Convert Track Duration from ms to more readable form
                var trackspeed = e.target.get_moving_speed().toString();
                var trackspe = trackspeed.split(".");
                if(trackspe =="Infinity"){
                  alert("Something seems wrong with your gpx-file");
                }
                var Nachkomma;
                if(trackspe ==="Infinity"){
                  Nachkomma = 0;
                }else {
                      Nachkomma = trackspe[1];
                      Nachkomma = Nachkomma.slice(0,2);
                }

                //Mean Elevation
                var totalEle = e.target.get_elevation_gain() - e.target.get_elevation_loss();
                var positiveEle = e.target.get_elevation_gain().toFixed(2);
                var negativeEle = e.target.get_elevation_loss().toFixed(2);
                var shortenedTotalEle = totalEle.toFixed(2);
                elevationArray.push(this._info.elevation._points);
				

                // returns number of rows in Table
                var i = document.getElementById("tableDBTrackContents").rows.length;
                i++;

                // Save Bounds in BoundsArray for Zooming
                objectArray[i] = e.target.getBounds();

                // Add Elements to Content-Table
                $('#tableDBTrackContents').append('<tr class="clickable-row">                      <td class="likeButton" onmouseup="fncEditCell(this)">'
                  + (i++)                                                                       + '</td><td class="likeButton" onmouseup="fncEditCell(this)">'
                  + e.target.get_name()                                                         + '</td><td class="likeButton" onmouseup="fncEditCell(this)">'
                  + trackdis[0] + " m "                                                         + '</td><td class="likeButton" onmouseup="fncEditCell(this)">'
                  + time                                                                        + '</td><td class="likeButton" onmouseup="fncEditCell(this)">'
                  + trackspe[0] + "," + Nachkomma + " km/h "                                    + '</td><td class="likeButton" onmouseup="fncEditCell(this)">'
                  + positiveEle + " m "                                                         + '</td><td class="likeButton" onmouseup="fncEditCell(this)">'
                  + negativeEle + " m "                                                         + '</td><td class="likeButton" onmouseup="fncEditCell(this)">'
                  + shortenedTotalEle + " m "                                                   + '</td><td class="likeButton" onmouseup="fncEditCell(this)">'
				  + maxspeed.toFixed(2) + " km/h "                                              + '</td><td class="likeButton" onmouseup="fncEditCell(this)">'
                  + '</td></tr>'
                );
              })
              .addTo(map);
    }
  }
}

function reseter(e) {
    e.wrap('<form>').closest('form').get(0).reset();
    e.unwrap();
}
// vincenty's formula to calculate Distance on the WGS84 ellipsoid
function distVincenty(lat1, lat2, lon1, lon2) {
  var a = 6378137,
      b = 6356752.314245,
      f = 1 / 298.257223563; // WGS-84 ellipsoid params
  var L = toRad(lon2 - lon1);
  var U1 = Math.atan((1 - f) * Math.tan(toRad(lat1)));
  var U2 = Math.atan((1 - f) * Math.tan(toRad(lat2)));
  var sinU1 = Math.sin(U1),
      cosU1 = Math.cos(U1);
  var sinU2 = Math.sin(U2),
      cosU2 = Math.cos(U2);

  var lambda = L,
      lambdaP, iterLimit = 100;
  do {
    var sinLambda = Math.sin(lambda),
        cosLambda = Math.cos(lambda);
    var sinSigma = Math.sqrt((cosU2 * sinLambda) * (cosU2 * sinLambda) + (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
    if (sinSigma == 0) return 0; // co-incident points
    var cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    var sigma = Math.atan2(sinSigma, cosSigma);
    var sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
    var cosSqAlpha = 1 - sinAlpha * sinAlpha;
    var cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha;
    if (isNaN(cos2SigmaM)) cos2SigmaM = 0; // equatorial line: cosSqAlpha=0 (§6)
    var C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
    lambdaP = lambda;
    lambda = L + (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
  } while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);

  if (iterLimit == 0) return NaN // formula failed to converge
  var uSq = cosSqAlpha * (a * a - b * b) / (b * b);
  var A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  var B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  var deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
  var s = b * A * (sigma - deltaSigma);

  s = s.toFixed(3); // round to 1mm precision
  return s;
}

// distance calculation for a sphere
function distanceOnSphere(lat1, lat2, lon1, lon2){
	lat1 = lat1 * Math.PI / 180.0;
	lat2 = lat2 * Math.PI / 180.0;
	lon1 = lon1 * Math.PI / 180.0;
	lon2 = lon2 * Math.PI / 180.0;
	var r = 6378100;
	
	// P 
	var rho1 = r * Math.cos(lat1);
	var z1 = r * Math.sin(lat1);
	var x1 = rho1 * Math.cos(lon1);
	var y1 = rho1 * Math.sin(lon1);
	
	// Q
	var rho2 = r * Math.cos(lat2);
	var z2 = r * Math.sin(lat2);
	var x2 = rho2 * Math.cos(lon2);
	var y2 = rho2 * Math.sin(lon2);
	
	var dot = (x1 * x2 + y1 * y2 + z1 * z2);
	var cos_theta = dot / (r * r);
	
	var theta = Math.acos(cos_theta);
	
	return r * theta;
}
// numeric to radians
function toRad(Value) {
    return Value * Math.PI / 180;
}
// Handle the .gpx like the xml it is
function parseXml(xmlstr){
			var doc = new DOMParser().parseFromString(xmlstr, "text/xml");
			return get_gpx_data(doc.documentElement);
}
// Array structure for the relevant information for easy access in for loops
function get_gpx_data(node, result) {
			if(!result)
				result = { segments: [] };
				
			switch(node.nodeName)
			{
			case "name":
				var p = $("<p />");
				p.text(node.nodeName + " = " + node.textContent);
				result.name = node.textContent;
				$("#log").append(p);
				break;
					
			case "trkseg":
				var segment = [];
				result.segments.push(segment)
				for(var i=0; i<node.childNodes.length; i++)
				{
					var snode = node.childNodes[i];
					if(snode.nodeName == "trkpt")
					{
						var trkpt = { loc: [ parseFloat(snode.attributes["lat"].value), parseFloat(snode.attributes["lon"].value) ] };
						for(var j=0; j<snode.childNodes.length; j++)
						{
							var ssnode = snode.childNodes[j];
							switch(ssnode.nodeName)
							{
								case "time":
									trkpt.time = new Date(ssnode.childNodes[0].data);
									break;
								case "ele":
									trkpt.ele = parseFloat(ssnode.childNodes[0].data);
									break;
							}
						}
						segment.push(trkpt)
					}
				}
				break;
		}
		
		for(var i=0; i<node.childNodes.length; i++){
			get_gpx_data(node.childNodes[i], result);
		}
	return result;
}

// Zoom to Clicked Zoom Feature & Fill Name and Description Field
window.fncEditCell = function(argThis) {
  var rowNumber = argThis.parentNode.rowIndex;
  map.fitBounds(objectArray[rowNumber]);

  //Read out elevations of all points
  var elevations = [];
  var labels = [];
  for(let i = 0; i < elevationArray[rowNumber-1].length; i++){
    elevations.push(elevationArray[rowNumber-1][i][1]);
    labels.push(i);
  }

  //Chart showing the elevation of selected track
  var ctx = document.getElementById("myChart").getContext('2d');
  var myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: labels,
        datasets: [{
            label: 'Elevation ( m )',
            data: elevations,
			yAxisID: 'A',
            backgroundColor: [
                'rgba(255, 99, 132, 0.5)',
            ],
            borderColor: [
                'rgba(83, 238, 201, 1 )'
            ]
        },
		{ 
			data: speedArray,
			label: "Speed ( Km / h )",
			yAxisID: 'B',
			borderColor: "#3e95cd",
			fill: false
		}]
    },
    options: {
        title: {
             display: true,
             text: 'Elevation- and Speed-Profile',
             fontSize : 15
        },
        scales: {
          yAxes: [
			{   id: 'A',
				type: 'linear',
				position: 'left',
				scalePositionLeft: true,
				ticks: {
					beginAtZero:true
				},
				scaleLabel:{
					display: true,
					labelString: 'Elevation ( m )'
				}
			},
			{   id: 'B',
				type: 'linear',
				position: 'right',
				scalePositionLeft: false,
				ticks:{
					max: Math.floor((maxspeed + 25) / 10) * 10,
					min: 0
				},
				scaleLabel:{
					display: true,
					labelString: 'Speed ( km/h )'
				}
			}
		  ]
      }
    }
  });
};


// Change color of clicked table element
$('#tableDBTrackContents').on('click', '.clickable-row', function(event) {
  $(this).addClass('active').siblings().removeClass('active');
});


function parseMsToReadableTime(milliseconds){
  //Get hours from milliseconds
  var hours = milliseconds / (1000*60*60);
  var absoluteHours = Math.floor(hours);
  var h = absoluteHours > 9 ? absoluteHours : '0' + absoluteHours;

  //Get remainder from hours and convert to minutes
  var minutes = (hours - absoluteHours) * 60;
  var absoluteMinutes = Math.floor(minutes);
  var m = absoluteMinutes > 9 ? absoluteMinutes : '0' +  absoluteMinutes;

  //Get remainder from minutes and convert to seconds
  var seconds = (minutes - absoluteMinutes) * 60;
  var absoluteSeconds = Math.floor(seconds);
  var s = absoluteSeconds > 9 ? absoluteSeconds : '0' + absoluteSeconds;

  return h + ':' + m + ':' + s + " (hh:mm:ss)";
}

// Listen of new Element was added
document.getElementById('files').addEventListener('change', handleFileSelect, false);

// Hide/ Show i/o Fields

function hide_show(){
  var x = document.getElementById("hidableContainer");
  if(x.style.display === "none"){
    x.style.display = "block";
  } else {
    x.style.display ="none";
  }
}
