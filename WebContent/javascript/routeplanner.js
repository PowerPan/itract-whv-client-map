var routeplanner_startpoint = 0;
var routeplanner_endpoint = 0;
var routeplanner_startpoint_marker;
var routeplanner_endpoint_marker;
var mileston_icon = new L.icon({iconUrl: 'images/milestone.png',iconSize: [12, 12]});

var routes;
var routeLayer = new L.featureGroup();

var routeversion;
var max_routeversion;

function routeplanner_init(){
	date = new Date();
	day = date.getDate();
	month = date.getMonth();
	year = date.getFullYear();
	hour = date.getHours();
	minute = date.getMinutes();
	
	if(day < 10)
		day = "0" + day;
	if(month < 10)
		month = "0" + month;
	if(hour < 10)
		hour = "0" + hour;
	if(minute < 10)
		minute = "0" + minute;
	
	$("#routeplanner-date").val(day+"."+month+"."+year);
	$("#routeplanner-time").val(hour+":"+minute);
	
	map.on('contextmenu', function(e){
		set_point(e.latlng);
    });
	
	routeLayer.addTo(map);
}

function set_point(latlng){
	if(routeplanner_startpoint == 0 || routeplanner_endpoint == 0){
		$.getJSON('http://nominatim.openstreetmap.org/reverse?format=json&lat='+latlng.lat+'&lon='+latlng.lng+'&zoom=20&addressdetails=1',function(addressinfo){
	        var address = geocoder_respone_to_address(addressinfo);
	        //console.log(address);
	        
	        if(routeplanner_startpoint == 0){
	    		console.log("Set Startpoint");
	    		routeplanner_startpoint = latlng;
	    		$("#routeplanner-startpoint").val(address);
	    		routeplanner_startpoint_marker = new L.Marker(routeplanner_startpoint).addTo(map);
	    	}
	    	else if(routeplanner_startpoint != 0 && routeplanner_endpoint != 0){
	    		routeplanner_startpoint = latlng;
	    		routeplanner_endpoint = 0;
	    		map.removeLayer(routeplanner_startpoint_marker);
	    		map.removeLayer(routeplanner_endpoint_marker);
	    		$("#routeplanner-startpoint").val(address);
	    		$("#routeplanner-endpoint").val("");
	    		routeplanner_startpoint_marker = new L.Marker(routeplanner_startpoint).addTo(map);
	    	}
	    	else{
	    		console.log("Set Endpoint");
	    		routeplanner_endpoint = latlng;
	    		$("#routeplanner-endpoint").val(address);
	    		routeplanner_endpoint_marker = new L.Marker(routeplanner_endpoint).addTo(map);
	    	}     
	        
	        //leaflet_control_geocoder_update_popup_cotent(gps,utm,utmref,address);
	    });
	}
	else{
		console.log("clear");
		clear_routeplanner();
	}
		
	
}

function get_routeplanner_plan(){
	$("#routepalnner-loading-indicator").show();
	date = "2014-07-14";
	time = $("#routeplanner-time").val();
	$.getJSON(proxy_URL + "/api/transit/plan?lat="+map.getCenter().lat+"&lon="+map.getCenter().lng+"&fromLat="+routeplanner_startpoint.lat+"&fromLon="+routeplanner_startpoint.lng+"&toLat="+routeplanner_endpoint.lat+"&toLon="+routeplanner_endpoint.lng+"&date="+date+"&time="+time+"&showIntermediateStops=true&maxWalkDistance=1500",function(data){
		routes = new Array();
		max_routeversion = 0;
		for(i = 0; i < data.length;i++){
			for(j = 0;j < data[i].data.length;j++){
				max_routeversion++;
				routes.push(data[i].data[j]);
			}
		}
		$("#routepalnner-loading-indicator").hide();
		$("#routeplanner-details").show();
		$("#clear_routeplanner_button").show();
		routeversion = 0;
		bring_route_tp_map();
	});
}

function bring_route_tp_map(){
	index = routeversion;
	routeversion++;
	if(routeversion >= max_routeversion)
		routeversion = 0;
	$("#wrapper-routeplanner-details").html("");
	routeLayer.clearLayers();
	var total_distance = 0;
	var departure_timestamp = arrival_timestamp = routes[index][0].from.departureTime;
	var arrival_timestamp;
	
	map.removeLayer(routeplanner_startpoint_marker);
	map.removeLayer(routeplanner_endpoint_marker);
	
	var boundingBoxPoints = new Array();
	for(var i = 0;i < routes[index].length;i++){
		routes[index][i].routeType=replace_berlin_routtype(routes[index][i].routeType);
		
		total_distance += routes[index][i].distance;
		arrival_timestamp = routes[index][i].to.arrivalTime;
		
		latlngpoint = ([routes[index][i].from.lat,routes[index][i].from.lon]);
		
		var polyline = new L.polyline(Array(latlngpoint));
		boundingBoxPoints.push(latlngpoint);
		
		//Marker at the beginnig of each connection
		milestonemarker = new L.marker(latlngpoint);
		milestonemarker.setIcon(mileston_icon);
		
		
		
		
		if(routes[index][i].mode == "WALK"){
			if(typeof routes[index][i].steps === 'undefined'){}
			else{
				for(var j = 0;j < routes[index][i].steps.length;j++){
					latlngpoint = ([routes[index][i].steps[j].lat,routes[index][i].steps[j].lon]);
					polyline.addLatLng(latlngpoint);
					boundingBoxPoints.push(latlngpoint);
					
				}
			}
		}
		else /*if(routes[index][i].mode == "BUS")*/{
			if(typeof routes[index][i].intermediates === 'undefined'){}
			else{
				for(var j = 0;j < routes[index][i].intermediates.length;j++){
					polyline.addLatLng([routes[index][i].intermediates[j].lat,routes[index][i].intermediates[j].lon]);
					boundingBoxPoints.push([routes[index][i].intermediates[j].lat,routes[index][i].intermediates[j].lon]);
				}
			}
		}
		
		//set the Syle of the Line
		if(routes[index][i].mode == "WALK")
			polyline.setStyle({color: "black"});
		else if(routes[index][i].routeType == 0)
			polyline.setStyle({color: "green"});
		else if(routes[index][i].routeType == 1)
			polyline.setStyle({color: "orange"});
		else if(routes[index][i].routeType == 2)
			polyline.setStyle({color: "#63b1ff"});
		else if(routes[index][i].routeType == 3)
			polyline.setStyle({color: "red"});
		else if(routes[index][i].routeType == 4)
			polyline.setStyle({color: "purple"});

		polyline.setStyle({opacity: 1.0});
		
		polyline.addLatLng([routes[index][i].to.lat,routes[index][i].to.lon]);
		boundingBoxPoints.push([routes[index][i].to.lat,routes[index][i].to.lon]);
		polyline.addTo(routeLayer);
		//Create the Content for the Marker Label		
		var html = "<div class='roueplanner-trip-detail'>";
		if(routes[index][i].mode == "WALK"){
			html += "<img src='images/walk_icon.png'  height='15'/>";
			distance = routes[index][i].distance;
			if(distance < 1000)
				html += distance+" m";
			else{
				html += (distance/1000)+" km";
			}
		}
		else{
			html += "<img src='images/vehicle/vehicle_"+routes[index][i].routeType+".png' height='15'/>";
			html += routes[index][i].routeShortName +"  " + routes[index][i].tripHeadsign;
			html += "<br>From: "+timestamp_to_time(routes[index][i].from.departureTime) + " - " +routes[index][i].from.name + "" +
					"<br>To: " + timestamp_to_time(routes[index][i].to.arrivalTime) + " - " +routes[index][i].to.name;
		}
		html += "</div>";
		//Add the label to the Marker
		milestonemarker.bindLabel(html, {
		    noHide: true,
		    direction: 'auto'
		});
		milestonemarker.addTo(routeLayer);
		
		/*var html = "<div style='border: 1px solid;'>"
			html += routes[index][i].mode+" from "+ routes[index][i].from.name + " to " + routes[index][i].to.name;
			html += "</div>";*/
			$("#wrapper-routeplanner-details").append(html);
			
			

	}
	//Total Distance From meter to kilometer
	total_distance = total_distance / 1000;
	
	//Calculate the Duration
	var duration = arrival_timestamp-departure_timestamp;
	var duration = duration / 1000;
	duration = duration / 60;
	duration = duration / 60;
	var duration_hour = parseInt(duration);
	var duration_minute = parseInt( (duration-duration_hour)*60  );
	var html = "<div style='padding: 1px 6px;'>" +
			"From: "+$("#routeplanner-startpoint").val()+"</br>" +
			"To: "+$("#routeplanner-endpoint").val()+"</br>" +
			"Total Distance: " + total_distance  + "km </br>" +
			"Departure-Time "+timestamp_to_time(departure_timestamp)+"</br>" +
			"Arrival-Time "+timestamp_to_time(arrival_timestamp)+"</br>" +
			"Duration: "+duration_hour+"h "+duration_minute+"m</br>" +
					"<button onclick='bring_route_tp_map()'>Next</button>" +
			"</div>";
	$("#wrapper-routeplanner-details").prepend(html);
	map.fitBounds(boundingBoxPoints,{paddingTopLeft: [60,300],paddingBottomRight: [20,20]});
}

function timestamp_to_time(timestamp){
	date = new Date(timestamp);
	var hour = date.getHours();
    var minute = date.getMinutes();
    var second = date.getSeconds();
    if(hour < 10)
    	hour = "0" + hour;
    if(minute < 10)
        minute = "0" + minute;
    return hour + ":" + minute;
}

function replace_berlin_routtype(type){
	//900 - Tram
	if(type == 900)
		return 0;
	//109 - SBahn -> 2
	else if(type == 109)
		return 2;
	//400 - UBahn --> 1
	else if(type == 400)
		return 1;
	//700 - Bus --> 3
	else if(type == 700)
		return 3;
	//100 - Zug --> 3
	else if(type == 100)
		return 2;
	else
		return type;
}

function clear_routeplanner(){
	$("#routeplanner-details").hide();
	$("#routeplanner-startpoint").val("");
	$("#routeplanner-endpoint").val("");
	$("#clear_routeplanner_button").hide();
	routeplanner_startpoint = 0;
	routeplanner_endpoint = 0;
	map.removeLayer(routeplanner_startpoint_marker);
	map.removeLayer(routeplanner_endpoint_marker);
	routeLayer.clearLayers();
}

function geocoder_respone_to_address(address){
    var returndata = Array();

    if(address.address.kindergarten)
        returndata.push(address.address.kindergarten);
    if(address.address.fire_station)
        returndata.push(address.address.fire_station);
    if(address.address.fuel)
        returndata.push(address.address.fuel+" Tankstelle");
    if(address.address.supermarket)
        returndata.push(address.address.supermarket);
    if(address.address.pharmacy)
        returndata.push(address.address.pharmacy);
    if(address.address.building)
        returndata.push(address.address.building);
    if(address.address.bank)
        returndata.push(address.address.bank);
    if(address.address.bicycle_parking)
        returndata.push(address.address.bicycle_parking);
    if(address.address.school)
        returndata.push(address.address.school);
    if(address.address.taxi)
        returndata.push(address.address.taxi);
    if(address.address.mall)
        returndata.push(address.address.mall);
    if(address.address.sports_centre)
        returndata.push(address.address.sports_centre);
    if(address.address.allotments)
        returndata.push(address.address.allotments);
    if(address.address.college)
        returndata.push(address.address.college);
    if(address.address.car)
        returndata.push(address.address.car);
    if(address.address.attraction)
        returndata.push(address.address.attraction);
    if(address.address.house)
        returndata.push(address.address.house);
    if(address.address.parking)
        returndata.push(address.address.parking);
    if(address.address.industrial)
        returndata.push(address.address.industrial);
    if(address.address.fast_food)
        returndata.push(address.address.fast_food);
    if(address.address.bus_stop)
        returndata.push("Haltestelle: "+address.address.bus_stop);
    if(address.address.address29)
        returndata.push(address.address.address29);
    if(address.address.public_building)
        returndata.push(address.address.public_building);
    if(address.address.library)
        returndata.push(address.address.library);
    if(address.address.stadium)
        returndata.push(address.address.stadium);
    if(address.address.common)
        returndata.push(address.address.common);
    if(address.address.restaurant)
        returndata.push(address.address.restaurant);
    if(address.address.commercial)
        returndata.push(address.address.commercial);

    //----------------------------------------------

    if(address.address.pedestrian)
        returndata.push(address.address.pedestrian);

    if(address.address.footway)
        returndata.push(address.address.footway);

    if(address.address.road)
        returndata.push(address.address.road);

    if(address.address.house_number)
        returndata.push(address.address.house_number);

    if(address.address.postcode)
        returndata.push(address.address.postcode);

    if(address.address.city)
        returndata.push(address.address.city);

    if(address.address.city_district)
        returndata.push(address.address.citydistrict);

    if(address.address.hamlet)
        returndata.push(address.address.hamlet);

    if(address.address.town)
        returndata.push(address.address.town);

    return returndata.join(" ");
}