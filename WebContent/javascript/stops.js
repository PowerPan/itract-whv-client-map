//////////////
//Stop Config
//////////////

//LayerGroup for the Stops
var stopsLayerGroup = new L.LayerGroup();	

//Array of all Stops that are visible on the Map
var stopsvisible = new Array();
var stop_infos = new Array();

//Set the Stop Icon
var stopicon = new L.icon({iconUrl: 'images/stop.png',iconSize: [20,20]});

//Max PopupWidth Normal 500 
//If the screen is smaller change it to screen.with - 100px
var max_popupwidth = 500;
if(screen.width < max_popupwidth){
	max_popupwidth = screen.width-100;
}

console.log("Proxy URL: "+proxy_URL);



//Use to check which Stop Popup is open needed to stop JSON calls for closed stops
var openstop;

function stop_init(){
	stopsLayerGroup.addTo(map);
}
	
function get_stop_data_from_server(){
	//Get Stops and bring them to the map
	//URL call: http://itract.cs.kau.se:8081/proxy/api/transit/stopsInArea?lat=59.377398154058596&lon=13.518367104629524&southWestLat=59.35938051789711&southWestLon=13.44953089247133&northEastLat=59.39540622331862&northEastLon=13.587203316787736
	if(map.getZoom() > 12){
		$.getJSON(proxy_URL + "/api/transit/stopsInArea?lat="+map.getBounds().getCenter().lat+"&lon="+map.getBounds().getCenter().lng+"&southWestLat="+map.getBounds().getSouthWest().lat+"&southWestLon="+map.getBounds().getSouthWest().lng+"&northEastLat="+map.getBounds().getNorthEast().lat+"&northEastLon="+map.getBounds().getNorthEast().lng,function(data){
			remove_all_markers();
			if(data.length > 0)
				add_stops_to_map(data)
		});
	}
	else
		stopsLayerGroup.clearLayers();
}	

function remove_all_markers(){
	stopsLayerGroup.clearLayers();
	stopsvisible = new Array();
	stop_infos = new Array();
}
	
function add_stops_to_map(json_stops){
	//index i is for the graphs
	for(i = 0; i < json_stops.length;i++){
		//Index j is for the stops 
		for(j = 0;j < json_stops[i].data.length;j++){
			//First Check is the StopType is set if yes we sould have normal stops and parrent stop
			//Depending of the Zoomlevel and the Stoptype we show only the stopType 1 or 0
			//If the stoptype is not set we show it on every zoomlevel
			showstop = 0;
			
			//Add the agency to sop infos
			add_agency_id_to_stop_infos(json_stops[i].data[j]);

			if(typeof json_stops[i].data[j].stopType === 'undefined'){
				//Stop Type is not set -> we show the stop on the map
				showstop = 1;
			}
			else{
				//Check the Zommlevel
				if(map.getZoom() > 15){
					//Show only StopType 0 - Childstops
					if(json_stops[i].data[j].stopType == 0){
						showstop = 1;
					}
				}
				else{
					//Show only Stoptype 1 - GroupStops
					if(json_stops[i].data[j].stopType == 1){
						showstop = 1;
					}
					else if(json_stops[i].data[j].stopType == 0 && (typeof json_stops[i].data[j].parentStation === 'undefined')){
						//parentStaion is not set -> we show the stop on the map
						showstop = 1;
					}
					else{
						//No Parrent Stop add the Info to ParrentStop
						add_child_stop_to_parent_station_stop_infos(json_stops[i].data[j]);
					}
				}
			}
			if(showstop == 1){
				if(jQuery.inArray(json_stops[i].data[j].id,stopsvisible) == "-1"){					
					//Create the Marker with the Icon
					stop_marker = new L.Marker([json_stops[i].data[j].lat,json_stops[i].data[j].lon],{icon: stopicon});
					
					//Add the Marker to the Map
					stop_marker.addTo(stopsLayerGroup);
					
					//Bind the Mouseover Label to the Marker
					stop_marker.bindLabel(json_stops[i].data[j].name);
					
					//Bind the Popup to the Marker
					stop_marker.bindPopup("stoppopup:::"+json_stops[i].data[j].id,{minWidth: 350, maxWidth: 500})
					
					//Add the stop_id to the Array stopsvisible important that afer a 
					//mapmove the marker not will be created a second time
					stopsvisible.push(json_stops[i].data[j].id);
					
					//Add Stop Information to the stop_infos Array
					add_inforamtions_to_stop_infos(json_stops[i].data[j]);				
				}
			}
		}
	}
}

function add_child_stop_to_parent_station_stop_infos(stopobj){
	//Check if Parent Stop Info is already availble if not crate it
	if(typeof stop_infos[stopobj.parentStation] === 'undefined'){
		stop_infos[stopobj.parentStation] = new Array();
	}
	//Check if there is already a Array for all ChildStops
	if(typeof stop_infos[stopobj.parentStation].childStops === 'undefined'){
		stop_infos[stopobj.parentStation].childStops = new Array();
	}
	
	if(jQuery.inArray(stopobj.id,stop_infos[stopobj.parentStation].childStops) == "-1")
		stop_infos[stopobj.parentStation].childStops.push(stopobj.id);
	//stop_infos[stopobj.parentStation].stopType = 1;
}

function add_agency_id_to_stop_infos(stopobj){
	//Check if StopInfo is already there
	if(typeof stop_infos[stopobj.id]=== 'undefined'){
		stop_infos[stopobj.id] = new Array();
	}
	
	//Check if there are already an agency at this stop
	if(typeof stop_infos[stopobj.id].agencys=== 'undefined'){
		stop_infos[stopobj.id].agencys = new Array();
	}
	
	if(jQuery.inArray(stopobj.agencyId,stop_infos[stopobj.id].agencys) == "-1")
		stop_infos[stopobj.id].agencys.push(stopobj.agencyId);
	
}

function add_inforamtions_to_stop_infos(stopobj){
	
	//Check if StopInfo is already there
	if(typeof stop_infos[stopobj.id]=== 'undefined'){
		stop_infos[stopobj.id] = new Array();
	}	
	stop_infos[stopobj.id].name = stopobj.name;
	
	//Check if stopType attribut is set if not set stopType to 0
	if(typeof stop_infos[stopobj.id].stopType === 'undefined')
		stop_infos[stopobj.id].stopType = 0
	else
		stop_infos[stopobj.id].stopType = stopobj.stopType;
	
}

function fill_departures_stop_popup_content(popup){
	stop_id = popup.getContent();
	stop_id = stop_id.split(":::");
	if(stop_id[0] != "stoppopup")
		return false;
	stop_id=stop_id[1];
	//First make the Popup Empty
	popup.setContent("<img src='images/ajax-loader.gif'/>");
	

	//Load all Routes that are on this Stop
	$.getJSON(proxy_URL + "/api/transit/routesForStop?lat="+map.getBounds().getCenter().lat+"&lon="+map.getBounds().getCenter().lng+"&agencyId=&stopId="+stop_id,function(data){
		var routes = new Array();
		for(i = 0;i < data.length;i++){
			for(j = 0;j < data[i].data.length;j++){
				routes.push(data[i].data[j]);
			}
		}
		//Sort first for the type (bus,train,etc...)
		//Second sort for the shortName
		routes.sort(dynamicSortMultiple("type","shortName"));
		
		//Set the openstop
		openstop = stop_id;
		
		//If ChildStop ChildStopids = stop_id
		var childStops = new Array()
		if(typeof stop_infos[stop_id].childStops === 'undefined')
			childStops.push(stop_id);
		else
			childStops = stop_infos[stop_id].childStops;
		
		//Build PopupContent
		var html = "<div class='popup_departures' id='fahrplan_"+stop_id+"'>" +
	    "<table style='width: 100%'><tr><td style='width: 95%'><h2>"+stop_infos[stop_id]["name"]+"</h2></td><td valign='top'><h2 id='stop_clock_"+stop_id+"'></h2></td></tr></table>" +
	    "<hr>" +
	    "<div id='popup_departures_table_departures_"+stop_id+"'><img src='images/ajax-loader.gif'/></div>"+
	    "</div>" +
	    "<hr/>" +
	    "<div id='popup_deparutres_alert_field_"+stop_id+"' class='alerts'></div>" +
	    		"<div><a href='../display/?stops="+childStops.join()+"&lat="+((Math.round(map.getCenter().lat*1000))/1000)+"&lng="+((Math.round(map.getCenter().lng*1000))/1000)+"&agencys="+stop_infos[stop_id].agencys.join()+"&stopname="+ encodeURIComponent(stop_infos[stop_id]["name"]) +"' target='_blank' >Departure Display</a></div>";
	    
	    for(i = 0;i < routes.length;i++){
	    	if(typeof routes[i].shortName === 'undefined'){}
			else
				html += "<div class='pdfplanbutton'>"+routes[i].shortName+"</div>";
	    	
	    }
	    html += "<div class='clear'></div>";
		
		
		//Bring the Content to the popup
		popup.setContent(html);
		
		
		
		//Load Departures
		//For the Timeout Function we must convert the childstops from an Array into a komma sperated string
		load_departures_for_stop_and_fill_popup(stop_id,childStops.join());
		
		//Start the Clock
		stop_clock(stop_id);
		
		//Load the Alerts
		load_alerts(stop_id,childStops,stop_infos[stop_id].agencys);
		//console.log("Agencys: "+stop_infos[stop_id].agencys.join());
		
		//When the popup close
		//Delete the content and write only the stop_id into
		//It is nessary to identifiy the popup on the next click
		map.on('popupclose', function(e){
			if(openstop != ""){
				e.popup.setContent("stoppopup:::"+stop_id);
				openstop = "";
			}			
		});		
	});
	
	
}

function load_alerts(popup,stop_ids,agencys){
	//array to Store the alerts
	var alerts = new Array();
	
	var agency_stop_combinations = new Array();
	
	for(var i = 0;i < stop_ids.length;i++){
		for(var j = 0; j < agencys.length;j++){			
			combination = new Array();
			combination.agency = agencys[j];
			combination.stop = stop_ids[i];
			agency_stop_combinations.push(combination);
		}
	}
	//console.log(agency_stop_combinations);
	load_alerts_from_server(popup,agency_stop_combinations,alerts);
}

function load_alerts_from_server(popup,agency_stop_combinations,alerts){
	$.getJSON(proxy_URL + "/api/transit/alerts?lat="+map.getCenter().lat+"&lon="+map.getCenter().lng+"&agencyId="+agency_stop_combinations[0].agency+"&stopId="+agency_stop_combinations[0].stop,function(data){
		
		for(var i = 0; i < data.length;i++){
			for(var j = 0; j < data[i].data.patches.length;j++){
				alerts.push(data[i].data.patches[j]);
			}
		}
		agency_stop_combinations.shift();
		if(agency_stop_combinations.length == 0)
			fill_popup_with_alerts(popup,alerts);
		else
			load_alerts_from_server(popup,agency_stop_combinations,alerts);
		
	});
}

function fill_popup_with_alerts(popup,alerts){
	alert_text = new Array();
	for(var i = 0;i < alerts.length;i++){
		//Check if there is a text in the same language like the browser
		if(typeof alerts[i].alert.alertHeaderText.translations[navigator.language] === 'undefined'){
			//ok no Text in the Local Language defined, see if there is a text in english "en"
			if(typeof alerts[i].alert.alertHeaderText.en === 'undefined'){
				//Ok Also no defined english, so we read all keys and use the first in the list
				var keys = Object.keys(alerts[i].alert.alertHeaderText.translations);
				//Check if the Message is already in the Array "alert_text", if no add it!
				if(jQuery.inArray(alerts[i].alert.alertHeaderText.translations[keys[0]],alert_text) == "-1")
					alert_text.push(alerts[i].alert.alertHeaderText.translations[keys[0]]);
			}
			else{
				//Check if the Message is already in the Array "alert_text", if no add it!
				if(jQuery.inArray(alerts[i].alert.alertHeaderText.translations.en,alert_text) == "-1")
					alert_text.push(alerts[i].alert.alertHeaderText.translations.en);
			}
		}
		else{
			//Check if the Message is already in the Array "alert_text", if no add it!
			if(jQuery.inArray(alerts[i].alert.alertHeaderText.translations[navigator.language],alert_text) == "-1")
				alert_text.push(alerts[i].alert.alertHeaderText.translations[navigator.language]);
		}
			
	}
	var html = "<marquee>"+alert_text.join(" +++ ")+"</marquee>"
	
	document.getElementById("popup_deparutres_alert_field_"+popup).innerHTML = html;
}

function load_departures(stop_id,stop_ids,departures,stop_ids_untouched){

	//Create the Timestamps for the Query
	var now = new Date();
	start_time = Date.parse(now);
	end_time = start_time+86400000;
	$.getJSON(proxy_URL + "/api/transit/arrivalsAndDeparturesForStop?lat="+map.getBounds().getCenter().lat+"&lon="+map.getBounds().getCenter().lng+"&agencyId=&stopId="+stop_ids[0]+"&startTime="+start_time+"&endTime="+end_time+"&numArrivals=0&numDepartures=5",function(data){
		for(i = 0;i < data.length;i++){
			for(j = 0;j < data[i].data.departures.length;j++){
				departures.push(data[i].data.departures[j]);	
			}
		}
		stop_ids.shift();
		if(stop_ids.length == 0){
			fill_popup_with_departures(departures,stop_ids_untouched);
		}			
		else{
			load_departures(stop_id,stop_ids,departures,stop_ids_untouched);
		}
			
	});
}

function fill_popup_with_departures(departures,stop_ids){
	var html = "<table><tr class='header_row'><td class='header_row_route' colspan='1'>Linie</td><td class='header_row_destination'>Ziel</td><td class='header_row_departure'>Abfahrt</td></tr>"		

	departures.sort(dynamicSort("time"));

	max_rows = 5;
	if(departures.length < 5)
		max_rows = departures.length;

	for(i = 0;i < max_rows;i++){
		//If the RouteShortName is not Set don't Display it
		if(typeof departures[i].routeShortName === 'undefined')
			routeShortName = "";
		else
			routeShortName = departures[i].routeShortName;
		
		//Filter the Headsign name in the actual town
		replacestring = stop_infos[stop_id].name.split(" ");
		replacestring = replacestring[0]+" ";
		tripHeadsign = departures[i].tripHeadsign.replace(replacestring,"");
		
		//Calculate the Time until departure
		time = calculate_departue_time(departures[i].time);
		
		departures[i].routeType = replace_berlin_routtype(departures[i].routeType);
		
		//Build the HTML together
		html += "<tr>" +
				"<td><img style='' src='images/routetype/"+departures[i].routeType+".png' height='10' />" +
				"&nbsp;"+routeShortName+"</td>" +
				"<td>"+tripHeadsign+"</td>" +
				"<td>"+time+"</td>" +
				"</tr>";
	}
	
	if(max_rows == 0){
		html += "<tr><td colspan='3' align='center'>No Departures!</td></tr>";
	}
	html += "</table>";
	//Bring the HTML to the Popup		
	//$("#popup_departures_table_departures_"+stop_id).html(html);
	
	document.getElementById("popup_departures_table_departures_"+stop_id).innerHTML = html;
	
	//Start Timer for the next Call
	setTimeout("load_departures_for_stop_and_fill_popup('"+stop_id+"','"+stop_ids.join()+"')",60000);
}

function load_departures_for_stop_and_fill_popup(stop_id,stop_ids){
	
	//Bring stop_ids back to an Array
	stop_ids = stop_ids.split(",");
	
	//Stop_id = ID of the current stop and to identify the Popup
	//Stop_ids = array with stop_ids to show all departures for all childStops
	if(stop_id != openstop){
		return false;
	}
		
	var departures = new Array();
		
	load_departures(stop_id,stop_ids,departures,stop_ids.slice());	
}

function calculate_departue_time(timestamp){
	//when the Vehicle is driving in the next 60 Minutes show
	//how many minutes until the vehicles drive
	//if it is over 60 Minutes show the Time in the format hh.mm
	timedelta = parseInt( (timestamp - Date.parse(new Date())) /1000/60);
	if(timedelta < 60){
		if(timedelta == 0)
			return "sofort";
		return "in&nbsp;"+timedelta+"&nbsp;min";
	}
		
	
	timeobj = new Date(timestamp*1);
	var hour = timeobj.getHours();
    var minute = timeobj.getMinutes();
    if(hour < 10)
    	hour = "0" + hour;
    if(minute < 10)
        minute = "0" + minute;
    
    return hour +":"+minute;
}

function stop_clock(stop_id){
    time = new Date();
    var hour = time.getHours();
    var minute = time.getMinutes();
    var second = time.getSeconds();
    if(hour < 10)
    	hour = "0" + hour;
    if(minute < 10)
        minute = "0" + minute;
    if(second < 10)
    	second = "0" + second;
    if(document.getElementById('stop_clock_'+stop_id)){
        document.getElementById('stop_clock_'+stop_id).innerHTML =  hour + ":" + minute + ":" + second;
        setTimeout("stop_clock('"+stop_id+"')",100);
    }
    else{
    	//console.log("uhr weg");
    	return false;    	
    }
        

}
//http://stackoverflow.com/questions/1129216/sorting-objects-in-an-array-by-a-field-value-in-javascript
function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

function dynamicSortMultiple() {
    /*
     * save the arguments object as it will be overwritten
     * note that arguments object is an array-like object
     * consisting of the names of the properties to sort by
     */
    var props = arguments;
    return function (obj1, obj2) {
        var i = 0, result = 0, numberOfProperties = props.length;
        /* try getting a different result from 0 (equal)
         * as long as we have extra properties to compare
         */
        while(result === 0 && i < numberOfProperties) {
            result = dynamicSort(props[i])(obj1, obj2);
            i++;
        }
        return result;
    }
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

function sleep(milliseconds) {
	  var start = new Date().getTime();
	  for (var i = 0; i < 1e7; i++) {
	    if ((new Date().getTime() - start) > milliseconds){
	      break;
	    }
	  }
	}