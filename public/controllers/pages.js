// Contains common functionality for all pages
app.controller("PagesController", function($scope, $rootScope, $http){
  $scope.$on("$viewContentLoaded", function(x){
    $rootScope.errorMessage = null;
  });

  $scope.activityLevels = [
    {name: "Sedentary", multiplier: 1.2},
    {name: "Light Activity", multiplier: 1.375},
    {name: "Medium Activity", multiplier: 1.55},
    {name: "Heavy Activity", multiplier: 1.725},
    {name: "Very Heavy Activity", multiplier: 1.9}
  ];

  $scope.computeBMR = function(){
    var u = $scope.currentUser;
    var bmr = (u.gender === "male") ?
      66 + (6.23 * u.weight) + (12.7 * u.height) - (6.8 * u.age) :
      655 + (4.35 * u.weight) + (4.7 * u.height) - (4.7 * u.age) ;
    bmr *= $scope.activityLevels[u.activityLevel].multiplier;
    return parseInt(bmr, 10);
  };

  //hides error message 
  $scope.hideError = function(){
    $rootScope.errorMessage = null;
  };

  //compute the totals
  $scope.computeTotals = function(){
    $http({
      url: "/api/dailyintake/history/1",
      method: "GET",
      params: {creator_id:  $rootScope.currentUser._id}
    }).success(function(response){
      $scope.todaysTotals = response[0];
    });
  };

  $scope.searchFood = function(foodQuery){
    $http.get("http://api.nal.usda.gov/usda/ndb/search/?format=json&q="
      + foodQuery +
      "&sort=n&max=0&offset=0&api_key=CHurM7gbNq23v6dmXrlykJFRQByqw8PmDjYSzwva")
      .success(function(response){
        $scope.searchedFoods = response.list.item;
      });
  };
});
