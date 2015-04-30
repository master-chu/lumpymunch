app.controller('RegisterController', function($scope, $http, $rootScope, $location){
  $scope.register = function(user){
    if(user.password === user.passwordConfirm){
      $http.post('/register', user)
        .success(function(response){
          $rootScope.currentUser = response;
          $location.url('/profile');
      }).error(function(response){
          $rootScope.errorMessage = response;
      });
    }
    else {
      $rootScope.errorMessage = "password fields do not match";
    }
  }
});
