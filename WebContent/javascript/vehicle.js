var vehicleLayerGroup = new L.LayerGroup();

var vehicle_icon = new Array() 
vehicle_icon[0] = new L.icon({iconUrl: 'images/vehicle/vehicle_0.png',iconSize: [25, 25]});
vehicle_icon[1] = new L.icon({iconUrl: 'images/vehicle/vehicle_1.png',iconSize: [25, 25]});
vehicle_icon[2] = new L.icon({iconUrl: 'images/vehicle/vehicle_2.png',iconSize: [25, 25]});
vehicle_icon[3] = new L.icon({iconUrl: 'images/vehicle/vehicle_3.png',iconSize: [25, 25]});
vehicle_icon[4] = new L.icon({iconUrl: 'images/vehicle/vehicle_4.png',iconSize: [25, 25]});
vehicle_icon[6] = new L.icon({iconUrl: 'images/vehicle/vehicle_6.png',iconSize: [25, 25]});

function vehicle_init(){
	vehicleLayerGroup.addTo(map);
	update_vehicles();
}

function update_vehicles(){
	if(map.getZoom() > 8){
		$.getJSON(proxy_URL + "/api/transit/vehicleLocations?lat="+map.getBounds().getCenter().lat+"&lon="+map.getBounds().getCenter().lng+"&southWestLat="+map.getBounds().getSouthWest().lat+"&southWestLon="+map.getBounds().getSouthWest().lng+"&northEastLat="+map.getBounds().getNorthEast().lat+"&northEastLon="+map.getBounds().getNorthEast().lng,function(data){
			for(i = 0;i < data.length;i++){
				for(j = 0; j < data[i].data.length;j++){
					for(k = 0; k < data[i].data[j].vehicles.length;k++){
						vehicle = data[i].data[j].vehicles[k];
						vehicle_leaflet_id = check_vehcile_on_map(vehicle);
						if(!vehicle_leaflet_id)
							add_vehicle(vehicle);
						else
							update_vehicle(vehicle,vehicle_leaflet_id);
					}
				}
			}
			
			setTimeout("update_vehicles()",5000);
		});
	}
	else{
		vehicleLayerGroup.clearLayers();
		setTimeout("update_vehicles()",1000);
	}
		
}

function add_vehicle(vehicle){
	vehicle_marker =  new L.Marker([vehicle.currentLocationLat,vehicle.currentLocationLon]);
	vehicle_marker.setIcon(vehicle_icon[3]);
	vehicle_marker.vehicleid = vehicle.vehicleId;
	vehicle_marker.bindPopup(popup_content(vehicle));
	vehicle_marker.addTo(vehicleLayerGroup);
}

function check_vehcile_on_map(vehicle){
	vehicles = vehicleLayerGroup.getLayers();
	for(l = 0; l < vehicles.length;l++){
		if(vehicle.vehicleId == vehicles[l].vehicleid){
			return vehicles[l]._leaflet_id
		}
	}
	return false;
}

function update_vehicle(vehicle,vehicle_leaflet_id){
	var vehicle_marker = vehicleLayerGroup.getLayer(vehicle_leaflet_id);
	vehicle_marker.setLatLng([vehicle.currentLocationLat,vehicle.currentLocationLon]);
}

function popup_content(vehicle){
	var html = "<table>";
	html += "<tr><td>stopId</td><td>"+vehicle.stopId+"</td></tr>";
	html += "<tr><td>routeId</td><td>"+vehicle.routeId+"</td></tr>";
	html += "<tr><td>vehicleId</td><td>"+vehicle.vehicleId+"</td></tr>";
	html += "<tr><td>speed</td><td>"+vehicle.speed+"</td></tr>";
	html += "<tr><td>odometer</td><td>"+vehicle.odometer+"</td></tr>";
	html += "<tr><td>currentOrientation</td><td>"+vehicle.currentOrientation+"</td></tr>";
	html += "<tr><td>congestionLevel</td><td>"+vehicle.congestionLevel+"</td></tr>";
	html += "<tr><td>status</td><td>"+vehicle.status+"</td></tr>";
	html += "<tr><td>label</td><td>"+vehicle.label+"</td></tr>";
	html += "<tr><td>licensePlate</td><td>"+vehicle.licensePlate+"</td></tr>";
	html += "</table>"
	return html;
}

function delete_vehicle(){
	
}