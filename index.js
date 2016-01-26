//Add the requried module 'angular-ui' as a dependency
angular.module('maptesting', ['ui.map','ui.event']);

function MapCtrl($scope,$http) {
    var ll = new google.maps.LatLng(-23.006502,-43.313342);
    $scope.mapOptions = {
        center: ll,
        zoom: 15,
        minZoom:15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var markerCluster, pontosCluster;

    //Markers should be added after map is loaded
    $scope.onMapIdle = function() {
        if (markerCluster === undefined){
            markerCluster = new MarkerClusterer($scope.myMap, [], {
                maxZoom:13,                
                //imagePath: 'http://jpfritz.github.io/dfb-spiele/icons/m'
            });
            pontosCluster = new MarkerClusterer($scope.myMap, [], {
                //imagePath: 'http://jpfritz.github.io/dfb-spiele/icons/m'
            })       
            $.getJSON('http://dadosabertos.rio.rj.gov.br/apiTransporte/apresentacao/rest/index.cfm/obterTodasPosicoes',function(data){
            var markers = [];
            var arr = data.DATA;
            for(var i=0;i<arr.length;i++){
                var infoWindow = new google.maps.InfoWindow();
            	var o = arr[i];
                var ll = new google.maps.LatLng(o[3], o[4]);
                var content = o[2] + " - " + o[0];
                var marker = new MarkerWithLabel({
                    map: $scope.myMap,
                    title: content,
                    position: ll,
                    labelContent: o[2] != '' ? o[2] : 'N/A',
                    labelAnchor: new google.maps.Point(22, 0),
                    labelClass: "labels", // the CSS class for the label
                    labelStyle: {opacity: 0.75},
                });
                marker.linha = o[2];
                window.allTracks = [];
                google.maps.event.addListener(marker, 'click', (function (marker, content) {
                    return function () {
                        infoWindow.setContent(content);
                        infoWindow.open($scope.myMap, marker);
                        if(marker.linha != '' && marker.linha != 'N/A'){
                            dlTrack(marker,function(shapes){
                                //clean existing tracks
                                for (var index = 0; index < window.allTracks.length; index++) {
                                    var element = window.allTracks[index];
                                    element.setMap(null);
                                }
                                for (var index = 0; index < shapes.length; index++) {
                                    var element = shapes[index];
                                    var flightPath = new google.maps.Polyline({
                                        path: element,
                                        geodesic: true,
                                        strokeColor: '#FF0000',
                                        strokeOpacity: 1.0,
                                        strokeWeight: 2
                                    });
                                    flightPath.setMap($scope.myMap);
                                    window.allTracks.push(flightPath);
                                    $scope.$apply();            
                                }
                            });
                            dlStops(marker)
                        }
                    }
                })(marker, content));

                google.maps.event.addListener(marker, 'mouseout', function () {
                    infoWindow.close();
                });

                markers.push(marker);
            }
            
            markerCluster.clearMarkers();
            markerCluster.addMarkers(markers);
            $scope.$apply();
           });
            
            /*var marker = new google.maps.Marker({
                map: $scope.myMap,
                position: ll
            });
            $scope.myMarkers = [marker, ];*/
        }
    };

    var pontos = [];
    var dlTrack = function(mkr,cb){
        var linha = mkr.linha;
        if(mkr.shapes == undefined){
            pontos.length = 0;
            $.get('http://dadosabertos.rio.rj.gov.br/apiTransporte/Apresentacao/csv/gtfs/onibus/percursos/gtfs_linha'+linha+'-shapes.csv',function(data){
                var arr = data.split('\n');
                var shapes = {};
                var shapesArr = [];
                for(var i=1;i<arr.length;i++){
                    var o = arr[i].split(',');
                    var pt = {linha:o[0],descricao:o[1],order:o[3],shapeid:o[4],lat:eval(o[5])*1,lng:eval(o[6])*1};
                    pontos.push(pt);
                    if(pt.shapeid != 'shapeid' && pt.shapeid != 'shape_id' && pt.shapeid != undefined)
                    {
                        shapes[pt.shapeid] = shapes[pt.shapeid] || [];
                        shapes[pt.shapeid].push(pt);
                    } 
                }
                for(var key in shapes) {
                    var tr = shapes[key];
                    shapesArr.push(tr);
                }
                mkr.shapes = shapesArr;
                cb(mkr.shapes);
            });
        } else {
            cb(mkr.shapes);
        }
    }
    
    var dlStops = function(mkr){
        var pontosDeOnibus = [];
        var linha = mkr.linha;
        pontosDeOnibus.length = 0;
        $.get('http://dadosabertos.rio.rj.gov.br/apiTransporte/Apresentacao/csv/gtfs/onibus/paradas/gtfs_linha'+linha+'-paradas.csv',function(data){
            var arr = data.split('\n');
            for(var i=1;i<arr.length;i++){
                var o = arr[i].split(',');
                var pt = {linha:o[0],descricao:o[1],order:o[3],lat:o[4],lon:o[5]};
                var marker = new MarkerWithLabel({
                    map: $scope.myMap,
                    title: "PONTO " + pt.linha,
                    position: new google.maps.LatLng(pt.lat, pt.lon),
                    labelContent: "PONTO " + pt.linha,
                    labelAnchor: new google.maps.Point(22, 0),
                    labelClass: "labels", // the CSS class for the label
                    labelStyle: {opacity: 0.75},
                });
                pontosDeOnibus.push(marker);
            }
            mkr.pontosDeOnibus = pontosDeOnibus;
            pontosCluster.clearMarkers();
            pontosCluster.addMarkers(mkr.pontosDeOnibus);
            console.log(pontosDeOnibus);
        });
    }
    
    
    $scope.markerClicked = function(m) {
        window.alert("clicked");
    };

}