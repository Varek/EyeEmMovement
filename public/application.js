$(function() {
  nokia.Settings.set("appId", "pGWrn1YOkrGt4uaqlj0e"); 
  nokia.Settings.set("authenticationToken", "YKMKiMya8wZ0QY3V7NRy2A");

  var map = new nokia.maps.map.Display(
    document.getElementById("mapContainer"), {
        // Zoom level for the map
        'zoomLevel': 10,
        // Map center coordinates
        'center': [52.51, 13.4] 
    });
})