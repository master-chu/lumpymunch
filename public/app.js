var app = angular.module('LumpyMunch', ['ngRoute']);

app.config(function($routeProvider, $locationProvider) {
  $routeProvider
    .when('/home', {
      templateUrl: 'views/home.html',
      controller: 'HomeController',
      resolve: {
        logincheck: lessStrictCheckLoggedIn
      }
    })
    .when('/search', {
      templateUrl: 'views/search.html',
      controller: 'SearchController',
      resolve: {
        logincheck: lessStrictCheckLoggedIn
      }
    })
    .when('/search/details/:ndbno', {
      templateUrl: 'views/search_details.html',
      controller: 'SearchDetailsController',
      resolve: {
        logincheck: lessStrictCheckLoggedIn
      }
    })
    .when('/history', {
      templateUrl: 'views/history.html',
      controller: 'HistoryController',
      resolve: {
        logincheck: checkLoggedIn
      }
    })
    .when('/login', {
      templateUrl: 'views/login.html',
      controller: 'LoginController'
    })
    .when('/profile', {
      templateUrl: 'views/profile.html',
      controller: 'ProfileController',
      resolve: {
        logincheck: checkLoggedIn
      }
    })
    .when('/register', {
      templateUrl: 'views/register.html',
      controller: 'RegisterController'
    })
    .when('/dailyintake', {
      templateUrl: 'views/daily_intake.html',
      controller: 'DailyIntakeController',
      resolve: {
        logincheck: checkLoggedIn
      }
    })
    .when('/community', {
      templateUrl: 'views/community.html',
      controller: 'CommunityController',
      resolve: {
        logincheck: checkLoggedIn
      }
    })
    .otherwise({
      redirectTo: '/home'
    });
});

function checkLoggedIn($q, $timeout, $http, $location, $rootScope){
  var deferred = $q.defer();
  $http.get('/loggedin').success(function(user){
    $rootScope.errorMessage = null;
    // User is authenticated
    if(user !== '0'){
      $rootScope.currentUser = user;
      deferred.resolve();
    }
    // User is not authenticated
    else {
      $rootScope.errorMessage = 'You need to log in.';
      deferred.reject();
      $location.url('/login');
    }
  });
  return deferred.promise;
}

function lessStrictCheckLoggedIn($q, $timeout, $http, $location, $rootScope){
  var deferred = $q.defer();

  $http.get('/loggedin').success(function(user){
    $rootScope.errorMessage = null;
    // User is authenticated
    if(user !== '0'){
      $rootScope.currentUser = user;
    }
    deferred.resolve();
  });
  return deferred.promise;
}

//controller for navbar
app.controller("NavController", function($scope, $http, $location, $rootScope){

  //manage CSS tab highlighting
  $("#navbar").on("click", "li", function(e){
    var clickedLink = $(e.target).closest("li");
    $("#navbar li").removeClass("active");
    clickedLink.addClass("active");
  });

  $(".navbar-brand").click(function(e){
    $("#navbar li").removeClass("active");
  });

  $scope.logout = function(){
    $http.post("/logout").success(function(response){
      $rootScope.currentUser = null;
      $location.url("/home");
    });
  };
});
