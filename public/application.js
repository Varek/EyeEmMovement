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
        //$('<p>Ende '+enddatum+'</p>').insertAfter('#zeit');
        //console.log(enddatum-datum);
        // set slider values after init of slider
        //$( "#slider" ).slider( "option", "min", datum, "max", enddatum );
        // slider 0 till unix timestamp difference of 3 days in 10 minutes steps
        var startdate, lat, lng;
        switch($('#place').val()){
          case '1': 
            startdate = '2012-08-24T20:00:00+02:00';
            lat = 52.52515030;
            lng = 13.36928844;
            break;
          case '2':
            startdate = '2012-08-10T18:00:00+02:00';
            lat = 52.53084564;
            lng = 13.40096760;
            break;
        }
        $( "#slider" ).slider( "option", "step", 600 );
        //place for search query posting down here
        $.getJSON('/load_movement/'+lat+'/'+lng+'/'+startdate, function(data) {
          movement = data[1];
          var startdate = data[0];
          var enddatum = startdate + (5*60*60);
          $( "#slider" ).slider( "option", "min", startdate);
          $( "#slider" ).slider( "option", "max", enddatum);
          $('#slider').slider("value", startdate)
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
   $('.time_travel').live('click',function(){
      $('#slider').slider("value", $(this).data('timestamp'))
   })
})

function drawHeatMap (map,movement,timestamp) {
  var heatmapProvider;
  map.overlays.clear();
  markersContainer.objects.clear();
  $('#photoContainer').empty();
  var heatMapDataSet = locationsToHeatMapData(movement[timestamp]);
  colorGradient = {
    stops: {
      "0": "#E8680C",
      "0.25": "#F5A400",
      "0.5": "#EDED09",
      "0.75": "#FF4600",
      "1": "#F51F00"},
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
  $('#photoContainer').append('<a href="#foo" class="time_travel" data-timestamp="' + (timestamp-600) +'"><div class="arrow_up"></div></a>')
  $('#photoContainer').append('<a href="#baz" class="time_travel" data-timestamp="' + (timestamp+600) +'"><div class="arrow_down"></div></a>')
  for (var i = 0; i < movement[timestamp].length; i++) {
    if (!movement[timestamp][i]['latitude'] || !movement[timestamp][i]['longitude']) continue
    var coord = new nokia.maps.geo.Coordinate(parseFloat(movement[timestamp][i]['latitude']),parseFloat(movement[timestamp][i]['longitude']))
    markersContainer.objects.add(new nokia.maps.map.StandardMarker(coord))
    var thumbUrl = movement[timestamp][i]['thumbUrl'].replace('/h/','/w/')
    $('#photoContainer').append('<div class="photo_div"><img src="'+thumbUrl+'"></div>')
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