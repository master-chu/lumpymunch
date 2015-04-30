app.controller("HistoryController", function($scope, $rootScope, $http){
  if($rootScope.currentUser){
    $http({
      url: "/api/dailyintake/",
      method: "GET",
      params: {creator_id:  $rootScope.currentUser._id}
    }).success(function(response){
      $scope.dailyIntakeHistory = response;
    });
  }

  //construct daily intake graph for last 10 days
  $scope.buildHistoryGraph = function(user){
    var calories = [];
    var protein = [];
    var fat = [];
    var fiber = [];
    var carbs = [];
    $http({
      url: "/api/dailyintake/history/10",
      method: "GET",
      params: {creator_id:  user._id}
      }).success(function(response){
        response.forEach(function(totals){
          calories.push(totals.energy);
          protein.push(totals.protein);
          fat.push(totals.fat);
          fiber.push(totals.fiber);
          carbs.push(totals.carbs);
        });
        $('#caloriesHistoryGraph').highcharts({
          title: {
              text: 'Calories',
              x: -20 //center
          },
          xAxis: {
            title: {
              text: 'Days'
            },
            allowDecimals: false
          },
          yAxis: {
              title: {
                  text: 'Energy (kcal)'
              },
              plotLines: [{
                  value: 0,
                  width: 1,
                  color: '#808080'
              }],
              min: 0,
              plotLines: [{
                color: '#FF0000',
                width: 2,
                value: $scope.computeBMR(), // Need to set this probably as a var.
                label: {
                    text: 'Target',
                    align: 'right',
                    x: -10
                }
              }]
          },
          tooltip: {
              valueSuffix: ' kcal'
          },
          series: [{
              name: "calories",
              data: calories
          }]

        });
        $('#proteinHistoryGraph').highcharts({
          title: {
              text: 'Protein',
              x: -20 //center
          },
          xAxis: {
            title: {
              text: 'Days'
            },
            allowDecimals: false
          },
          yAxis: {
              title: {
                  text: 'Protein (grams)'
              },
              plotLines: [{
                  value: 0,
                  width: 1,
                  color: '#808080'
              }],
              min: 0
          },
          tooltip: {
              valueSuffix: ' g'
          },
          series: [{
              name: "protein",
              data: protein,
              color: 'orange'
          }]
        });
        $('#carbsHistoryGraph').highcharts({
          title: {
              text: 'Carbohydrates',
              x: -20 //center
          },
          xAxis: {
            title: {
              text: 'Days'
            },
            allowDecimals: false
          },
          yAxis: {
              title: {
                  text: 'Carbs (grams)'
              },
              plotLines: [{
                  value: 0,
                  width: 1,
                  color: '#808080'
              }],
              min: 0
          },
          tooltip: {
              valueSuffix: ' g'
          },
          series: [{
              name: "carbs",
              data: carbs,
              color: 'gray'
          }]
        });
        $('#fatHistoryGraph').highcharts({
          title: {
              text: 'Fat',
              x: -20 //center
          },
          xAxis: {
            title: {
              text: 'Days'
            },
            allowDecimals: false
          },
          yAxis: {
              title: {
                  text: 'Fat (grams)'
              },
              plotLines: [{
                  value: 0,
                  width: 1,
                  color: '#808080'
              }],
              min: 0
          },
          tooltip: {
              valueSuffix: ' g'
          },
          series: [{
              name: "fat",
              data: fat,
              color: 'green'
          }]
        });
        $('#fiberHistoryGraph').highcharts({
          title: {
              text: 'Fiber',
              x: -20 //center
          },
          xAxis: {
            title: {
              text: 'Days'
            },
            allowDecimals: false
          },
          yAxis: {
              title: {
                  text: 'Fiber (grams)'
              },
              plotLines: [{
                  value: 0,
                  width: 1,
                  color: '#808080'
              }],
              min: 0
          },
          tooltip: {
              valueSuffix: ' g'
          },
          series: [{
              name: "fiber",
              data: fiber,
              color: 'brown'
          }]
        });
      });
  };

  if($rootScope.currentUser){
    $scope.buildHistoryGraph($rootScope.currentUser);
    $scope.computeTotals();
  }
});
