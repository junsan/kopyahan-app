var app = angular.module('app', ['ngMaterial', 'ngRoute', "firebase"]);

app.config(function($mdThemingProvider, $routeProvider) {
    $mdThemingProvider.theme('default')
    .primaryPalette('blue-grey')
    .accentPalette('orange');
    $routeProvider
		.when('/', {
			templateUrl: 'views/signup.html', 
			controller: 'signupController'
		})
		.when('/classroom', {
			templateUrl: 'views/classroom.html',
			controller: 'classroomController'
		})
		.otherwise({
			redirect: '/'
	});
});

app.controller('signupController', function($scope,$location) {

	$scope.startExam = function () {
		$location.path('/classroom');
	}

});

app.controller('classroomController', function($scope,$mdDialog) {

	$scope.showExam = function(ev) {
	    $mdDialog.show({
	      controller: examController,
	      templateUrl: 'views/exam.tmp.html',
	      parent: angular.element(document.body),
	      targetEvent: ev,
	      clickOutsideToClose:true
	    })
        .then(function(answer) {
          $scope.status = 'You said the information was "' + answer + '".';
        }, function() {
          $scope.status = 'You cancelled the dialog.';
        });
 	};

});

function examController($scope,$firebaseObject,$firebaseArray) {

	var ref = new Firebase("https://kopyahan.firebaseio.com/questions");

	$scope.qs = $firebaseArray(ref);
	console.log($scope.qs);
	$scope.xchange = function(q) {
		

		var hopperRef = ref.child(q.$id);
		hopperRef.update({
		  "value": q.value
		});

	}
}