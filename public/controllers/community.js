app.controller("CommunityController", function($scope, $rootScope, $http){

  $scope.following = [];
  $scope.followedBy = [];
  $scope.notFollowing = [];
  $scope.users = [];
  $scope.viewing = {};

  //opens modal to display user profile
  $scope.openProfile = function(user)
  {
    $scope.viewing = user;
    $scope.buildGraph(user);
    $('#profile-view').modal();
    $('#profile-view').on('shown.bs.modal', function (e) {
      $(window).trigger('resize');
    });
  };
  
  //get all users
  $scope.getUsers = function(){
    $http.get("/api/user/")
      .success(function(res) { 
        $scope.users = res; 
        $scope.sortUsers();
      });
  };

  //add other user to following list
  $scope.addFollowing = function(other){
    $http({
      url: "/api/user/" + other._id + "/follow",
      method: "POST",
      params: {userId:  $rootScope.currentUser._id}
    }).success(function(response){
      $rootScope.currentUser = response;
      $scope.getUsers();
    });
  };

  //delete other user from following list
  $scope.deleteFollowing = function(other){
    $http({
      url: "/api/user/" + other._id + "/unfollow",
      method: "POST",
      params: {userId:  $rootScope.currentUser._id}
    }).success(function(response){
      $rootScope.currentUser = response;
      $scope.getUsers();
    });
  };

  //is the logged in user following user with given oid?
  $scope.isFollowing = function(oid) {
    for(var i = 0; i < $rootScope.currentUser.following.length; i++)
    {
      if (oid == $rootScope.currentUser.following[i]) { return true; }
    }

    return false;
  };

  //does this user follow logged in user?
  $scope.isFollowedBy = function(oid) {
    for(var i = 0; i < $rootScope.currentUser.followedBy.length; i++)
    {
      if (oid == $rootScope.currentUser.followedBy[i]) { return true; }
    }

    return false;
  };

  $scope.sortUsers = function(){
    $scope.following = [];
    $scope.followedBy = [];
    $scope.notFollowing = [];
    var selectedUser = {};

    //for each user in the database,
    for(var i = 0; i < $scope.users.length; i++)
    {
      selectedUser = $scope.users[i];

      //skip logged in user
      if (selectedUser._id == $rootScope.currentUser._id) { continue; }

      //does the logged in user follow selectedUser?
      if($scope.isFollowing(selectedUser._id)){ 
        $scope.following.push(selectedUser);
      }
      else { $scope.notFollowing.push(selectedUser); }

      //does the selected user follow the logged in user?
      if($scope.isFollowedBy(selectedUser._id))
      {
        $scope.followedBy.push(selectedUser);
      }        
    }
  };

  //build graph for user profile
  $scope.buildGraph = function(user){
    var calories = [];
    $http({
      url: "/api/dailyintake/history/10",
      method: "GET",
      params: {creator_id:  user._id}
      }).success(function(response){
        response.forEach(function(totals){
          calories.push(totals.energy);
        });

        $('#graph').highcharts({
          title: {
              text: user.username + ' Calorie History over the last ' + calories.length + ' days',
              x: -20 //center
          },
          xAxis: {
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
              min: 0
          },
          tooltip: {
              valueSuffix: ' kcal'
          },
          legend: {
              layout: 'vertical',
              align: 'right',
              verticalAlign: 'middle',
              borderWidth: 0
          },
          series: [{
              name: user.username,
              data: calories
          }]
        });
      });
  };

  $scope.formatDate = function(date){
    return date.toDateString();
  };

  $scope.getUsers();
});
