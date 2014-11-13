<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
    pageEncoding="ISO-8859-1"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
<link REL="SHORTCUT ICON" HREF="images/itract_logo.png">
<link rel="stylesheet" href="leaflet/leaflet.css" />
<link rel="stylesheet" href="leaflet/locatecontrol/L.Control.Locate.css" />
 <!--[if IE ]>
     <link rel="stylesheet" href="leaflet/leaflet.ie.css" />
     <link rel="stylesheet" href="leaflet/locatecontrol/L.Control.Locate.ie.css" />
 <![endif]-->
<link rel="stylesheet" href="css/style.css" />
<link rel="stylesheet" href="css/stop.css" />
<link rel="stylesheet" href="css/routeplanner.css" />

<script src="jquery/jquery-2.1.1.min.js"></script>
<script src="leaflet/leaflet.js"></script>

<script src="leaflet/locatecontrol/L.Control.Locate.js"></script>

<script src="leaflet/label/Label.js"></script>
<script src="leaflet/label/BaseMarkerMethods.js"></script>
<script src="leaflet/label/Marker.Label.js"></script>
<script src="leaflet/label/Map.Label.js"></script>
<script src="leaflet/hash/leaflet-hash.js"></script>

<script src="javascript/stops.js"></script>
<script src="javascript/routeplanner.js"></script>
<script src="javascript/vehicle.js"></script>
<title>ITRACT Map</title>
</head>
<body>
	<div id="routeplanner">
	<img src="images/itract_logo.png" height="40">
		<div id="wrapper-routeplanner">			
			<input type="text" id="routeplanner-startpoint" size="35"/>
			<input type="text" id="routeplanner-endpoint" size="35"/>
			<input type="text" id="routeplanner-date" size="10"/>
			<input type="text" id="routeplanner-time" size="5"/>
			<input type="button" value="Search" onclick="get_routeplanner_plan()" />
			<div><img  src="images/ajax-loader-2.gif" style="float: inline; display: none;" id="routepalnner-loading-indicator"></div>
			<input type="button" value="Clear" onclick="clear_routeplanner()" id="clear_routeplanner_button" style="display:none;"/>
		</div>
	
	</div>
	<div id="routeplanner-details" style="display: none;">
		<div id="wrapper-routeplanner-details"></div>
	</div>
	<div id="map"></div>
	<script type="text/javascript">
	
	var osmURL = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    osm = new L.TileLayer(osmURL, {maxZoom: 18});
	
	var map = L.map('map').setView([53.55145, 8.0808], 13);
	
	var hash = new L.Hash(map);

	osm.addTo(map);
	
	stop_init();
	
	routeplanner_init();
	
	vehicle_init();
	
	L.control.locate().addTo(map);
	
	map.on('moveend', function(e){
		get_stop_data_from_server();
    });
	
	get_stop_data_from_server();
	
	map.on('popupopen', function(e){
		fill_departures_stop_popup_content(e.popup);
	});
	

		
	//http://www.jaqe.de/2009/01/16/url-parameter-mit-javascript-auslesen/
	function get_url_param( name )
	{
		name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");

		var regexS = "[\\?&]"+name+"=([^&#]*)";
		var regex = new RegExp( regexS );
		var results = regex.exec( window.location.href );

		if ( results == null )
			return "";
		else
			return results[1];
	}
	
	console.log(navigator.language);
	
	</script>
</body>
</html>