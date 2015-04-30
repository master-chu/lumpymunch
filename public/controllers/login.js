app.controller("LoginController", function($scope, $http, $rootScope, $location){
  $scope.login = function(user){
    $http.post('/login', user).success(function(response){
      $rootScope.currentUser = response;
      $location.url("/history");
    }).error(function(aaa){
      $rootScope.errorMessage = "couldn't log in";
    });
  };
});