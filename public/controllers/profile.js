app.controller("ProfileController", function($scope, $rootScope, $http){
  $scope.editing = false;
  $scope.userClone = _.cloneDeep($rootScope.currentUser);

  //show inputs to allow user to edit profile
  $scope.showEdit = function () {
    $scope.editing = true;
  };

  //cancel editing of profile, restore object
  $scope.cancelEdit = function () {
    $scope.userClone = _.cloneDeep($rootScope.currentUser);
    $scope.editing = false;
  };

  //commit changes to profile to the server
  $scope.commitEdit = function () {
    $http.put("/api/user/", $scope.userClone)
      .success(function(res) { 
        $rootScope.currentUser = res; 
        $scope.userClone = _.cloneDeep($rootScope.currentUser);
      });

    $scope.editing = false;
  };
});
