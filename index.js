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
    var markerCluster;

    //Markers should be added after map is loaded
    $scope.onMapIdle = function() {
        if (markerCluster === undefined){
            markerCluster = new MarkerClusterer($scope.myMap, [], {
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
                
                google.maps.event.addListener(marker, 'mouseover', (function (marker, content) {
                    return function () {
                        infoWindow.setContent(content);
                        infoWindow.open($scope.myMap, marker);
                        if(marker.linha != ''){
                            dlTrack(marker.linha);
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
    var dlTrack = function(linha){
        pontos.length = 0;
        $.get('http://dadosabertos.rio.rj.gov.br/apiTransporte/Apresentacao/csv/gtfs/onibus/percursos/gtfs_linha'+linha+'-shapes.csv',function(data){
            var arr = data.split('\n');
            for(var i=0;i<arr.length;i++){
                var o = arr[i].split(',');
                pontos.push({linha:o[0],descricao:o[1],order:o[3],shapeid:o[4],lat:o[5],lon:o[6]});
            }
            console.log(pontos);
        });
    }
    
    $scope.markerClicked = function(m) {
        window.alert("clicked");
    };

}