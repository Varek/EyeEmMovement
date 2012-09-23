var movement, map, markersContainer;
$(function() {
  nokia.Settings.set("appId", "pGWrn1YOkrGt4uaqlj0e"); 
  nokia.Settings.set("authenticationToken", "YKMKiMya8wZ0QY3V7NRy2A");

  map = new nokia.maps.map.Display(
    document.getElementById("mapContainer"), {
      components: [ 
            // Behavior collection
            new nokia.maps.map.component.Behavior(),
            new nokia.maps.map.component.ZoomBar(),
            //new nokia.maps.map.component.Overview(),
            //new nokia.maps.map.component.TypeSelector(),
            new nokia.maps.map.component.ScaleBar() ],
        // Zoom level for the map
        'zoomLevel': 10,
        // Map center coordinates
        'center': [52.51, 13.4] 
    });
  markersContainer = new nokia.maps.map.Container();
  map.objects.add(markersContainer);
  // a workaround for a flaw in the demo system (http://dev.jqueryui.com/ticket/4375), ignore!
  $( "#dialog:ui-dialog" ).dialog( "destroy" );
  // insert datepicker

  $( "#date" ).datepicker();
  
  
  var place = $( "#place" ),
    userdate = $( "#date" ),
    allFields = $( [] ).add( place ).add( date ),
    tips = $( ".validateTips" );

  function updateTips( t ) {
    tips
      .text( t )
      .addClass( "ui-state-highlight" );
    setTimeout(function() {
      tips.removeClass( "ui-state-highlight", 1500 );
    }, 500 );
  }

  function checkLength( o, n, min, max ) {
    if ( o.val().length > max || o.val().length < min ) {
      o.addClass( "ui-state-error" );
      updateTips( "Length of " + n + " must be between " +
        min + " and " + max + "." );
      return false;
    } else {
      return true;
    }
  }

  function checkRegexp( o, regexp, n ) {
    if ( !( regexp.test( o.val() ) ) ) {
      o.addClass( "ui-state-error" );
      updateTips( n );
      return false;
    } else {
      return true;
    }
  }
  
  $( "#dialog-form" ).dialog({
    autoOpen: true,
    height: 400,
    width: 350,
    modal: true,
    buttons: {
      "start search": function() {
        var bValid = true;
        allFields.removeClass( "ui-state-error" );
        
        var datum = Date.parse($('#date').val());
        //console.log(datum);
        //timestamp ausgeben
        //$('<p>Start '+datum+'</p>').insertAfter('#zeit');
        //Zeitspanne Beginn
        var enddatum = 1345831200 + (5*60*60);
        //$('<p>Ende '+enddatum+'</p>').insertAfter('#zeit');
        //console.log(enddatum-datum);
        // set slider values after init of slider
        //$( "#slider" ).slider( "option", "min", datum, "max", enddatum );
        // slider 0 till unix timestamp difference of 3 days in 10 minutes steps
        $( "#slider" ).slider( "option", "min", 1345831200);
        $( "#slider" ).slider( "option", "max", enddatum);
        $( "#slider" ).slider( "option", "step", 600 );
        //place for search query posting down here
        $('#slider').slider("value", 1345831200)
        $.getJSON('/load_movement', function(data) {
          movement = data;
          drawHeatMap(map,movement,$('#slider').slider("value"));
        });
        
        $( this ).dialog( "close" );
      },
      Cancel: function() {
        $( this ).dialog( "close" );
      }
    },
    close: function() {
      allFields.val( "" ).removeClass( "ui-state-error" );
    }
  });
    
  $( "#slider" ).slider({
    change: function(event, ui)
     { var nextunixtime = $('#slider').slider("value");
      if (movement) drawHeatMap(map,movement,nextunixtime);
      //console.log(nextunixtime);
     }
  });  
  
   //$( ".selector" ).slider({ min: -7 });
})

function drawHeatMap (map,movement,timestamp) {
  var heatmapProvider;
  map.overlays.clear();
  markersContainer.objects.clear();
  var heatMapDataSet = locationsToHeatMapData(movement[timestamp]);
  colorGradient = {
    stops: {
      "0": "#0066FF",
      "0.25": "#2657D9",
      "0.5": "#73388C",
      "0.75": "#A62459",
      "1": "#FF0000"},
    interpolate: false};

  heatmapProvider = new nokia.maps.heatmap.Overlay({
    max: 20,
    colors: colorGradient,
    opacity: 0.5,
    coarseness: 1,
    type: "density"
  });
  
  // Read data into our Heatmap
  heatmapProvider.addData(heatMapDataSet);
  // Add it to the map's object collection so it will be rendered onto the map
  map.overlays.add(heatmapProvider);
  for (var i = 0; i < movement[timestamp].length; i++) {
    var coord = new nokia.maps.geo.Coordinate(parseFloat(movement[timestamp][i]['latitude']),parseFloat(movement[timestamp][i]['longitude']))
    markersContainer.objects.add(new nokia.maps.map.StandardMarker(coord))
    $('#photoContainer').append('<img src="'+movement[timestamp][i]['thumbUrl']+'">')
  }
}

var locationsToHeatMapData = function (locations) {
  var heatmapData = [],
    location,
    i, 
    len = locations.length;
  for (i = 0; i < len; i++) {
    location = locations[i];
    heatmapData.push({
        longitude: location.longitude,
        latitude: location.latitude
      }
    );
  }
  return heatmapData;
};