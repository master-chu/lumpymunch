app.controller("DailyIntakeController", function($scope, $rootScope, $http){

  $http({
    url: "/api/dailyintake/today", 
    method: "GET",
    params: {creator_id:  $rootScope.currentUser._id}
  }).success(function(response){
    $scope.todaysDailyIntake = response;
    $scope.$parent.searchedFoods = [];
  });

  //add food to daily intake
  $scope.eat = function(ndbno, name, quantity, measureIndex){   
    var foodThing = {
      ndbno: ndbno,
      name: name,
      quantity: quantity,
      measure: $scope.releventNutritionalData[0].measures[measureIndex].label 
    };
    $scope.releventNutritionalData.forEach(function(nutrient){
      foodThing[$scope.nutrientShortName(nutrient.name)] = {
        value : $scope.roundDown(nutrient.measures[measureIndex].value * quantity),
        unit : nutrient.unit
      };
    });

    $http.post("/api/dailyintake/" + $scope.todaysDailyIntake._id, foodThing)
    .success(function(response){
      if(response.hasOwnProperty("errorMessage")){
        $rootScope.errorMessage = response.errorMessage;
      } else {
        $scope.todaysDailyIntake = response;
        $scope.computeTotals();
      }
    });
  };

  //remove a food from daily intake
  $scope.vomit = function(index){
    $http({
      url: "/api/dailyintake/" + $scope.todaysDailyIntake._id,
      method: "DELETE",
      params: {foodIndex: index}
    }).success(function(response){
      $scope.todaysDailyIntake = response;
      $scope.computeTotals();
    });
  };

  //increase quantity of selected food by one
  $scope.incrementFoodQuantity = function(index){
    $http.put('/api/dailyintake/'+$scope.todaysDailyIntake._id+'/increment', {foodIndex:index})
    .success(function(response){
      $scope.todaysDailyIntake = response;
      $scope.computeTotals();
    });
  };

  //decrease quantity of selected food by one
  $scope.decrementFoodQuantity = function(index){
    $http.put('/api/dailyintake/'+$scope.todaysDailyIntake._id+'/decrement', {foodIndex:index})
    .success(function(response){
      if(response.hasOwnProperty("errorMessage")){
        $rootScope.errorMessage = response.errorMessage;
      } else {
        $scope.todaysDailyIntake = response;
        $scope.computeTotals();
      }
    });
  };

  $scope.expand = function(event, ndbno){
    $http.get("http://api.nal.usda.gov/usda/ndb/reports/?ndbno="
      + ndbno +
      "&type=b&api_key=CHurM7gbNq23v6dmXrlykJFRQByqw8PmDjYSzwva")
      .success(function(response){
        var clickedParent = $(event.target).closest('.panel');
        $scope.selectedFoodQuantity = 1;
        $scope.selectedMeasureIndex = 0;
        $scope.releventNutritionalData = _.filter(response.report.food.nutrients, function(nutrient){
          //energy, protein, carbs, fats, fiber
          var nutrientIds = ["208", "203", "204", "205", "291"];
          return _.includes(nutrientIds, nutrient.nutrient_id);
        });
        clickedParent.find('.panel-collapse').collapse('toggle');  
      });    
  };

  $scope.roundDown = function(val){
    return Math.floor(val);
  };

  $scope.nutrientShortName = function(longName){
    var nameMappings = {
      "Energy": "energy",
      "Protein": "protein",
      "Total lipid (fat)": "fat",
      "Carbohydrate, by difference": "carbs",
      "Fiber, total dietary": "fiber"
    };

    return nameMappings[longName];
  };

  /* ensure any open panels are closed before showing selected */
  $('#accordion').on('show.bs.collapse', function () {
      $('#accordion .in').collapse('hide');
  });

  $scope.computeTotals();
});
