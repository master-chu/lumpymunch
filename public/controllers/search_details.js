app.controller("SearchDetailsController", function($scope, $rootScope, $http, $routeParams){

  $http.get("http://api.nal.usda.gov/usda/ndb/reports/?ndbno="
  + $routeParams.ndbno +
  "&type=b&api_key=CHurM7gbNq23v6dmXrlykJFRQByqw8PmDjYSzwva")
  .success(function(response){
    $scope.food = response.report.food;
    $scope.selectedMeasureIndex = 0;
  });    
});