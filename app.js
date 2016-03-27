var app = angular.module('app', ['ngMaterial', 'ngRoute', 'firebase']);

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

app.controller('signupController', function($scope,$location,$firebaseObject) {

	$scope.startExam = function () {
		
		var studentRef = new Firebase("https://kopyahan.firebaseio.com/students");
		var email = $scope.studentemail;
		
		studentRef.push({
		    "name": $scope.fullname,
		    "email": $scope.studentemail
		});

		var name = '';

		// Retrieve new posts as they are added to our database
		studentRef.limitToLast(1).on("child_added", function(snapshot, prevChildKey) {
		  var newPost = snapshot.val();
		  $scope.userSit = Math.floor(Math.random() * 12) + 1;

		  var updateStudentRef = studentRef.child(snapshot.key());
			updateStudentRef.update({
			  "sit": $scope.userSit
		  });

		  name = newPost.name;
		  console.log(newPost);
		});



		var chairsRef = new Firebase("https://kopyahan.firebaseio.com/sits");

		$scope.chairs = $firebaseObject(chairsRef);
		var row = 0;
		//console.log($scope.userSits);


		$scope.chairs.$loaded(function(data) {
			angular.forEach(data, function(chair) {
				row++; 
				angular.forEach(chair, function(sit) { 
					if(sit.value == $scope.userSit) {
						//console.log(chair);
						var sitRef = new Firebase("https://kopyahan.firebaseio.com/sits/row"+row+"/sit"+sit.value);
						sitRef.update({
						  "sitted": name
						});
					}
				});	
			});
		});




		$location.path('/classroom');
	}

});

app.controller('classroomController', function($scope,$mdDialog,$firebaseObject) {
	

	$scope.isSelected = true;

	var chairsRef = new Firebase("https://kopyahan.firebaseio.com/sits");

	$scope.chairs = $firebaseObject(chairsRef);

	//console.log($scope.chairs);

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

app.directive('studentList', function () {
        return {
           restrict: 'E',
           scope: {
           		data: "=",
           },
           template: "<div>"+
			    		"<div style='font-size:11px;margin-bottom:5px;'>Student {{data.value}}</div>"+
			    		"<div>{{data.sitted}}</div>"+
						"<md-button class='md-fab md-primary md-hue-2' ng-click='showExam();' aria-label='Profile'>"+
				            "<md-icon md-svg-src='img/icons/android-content-copy-512px.svg'></md-icon>"+
				        "</md-button>"+
				        "<md-button class='md-fab ' ng-click='showExam();' aria-label='Profile'>"+
				            "<md-icon md-svg-src='img/icons/log-out-512px.svg'></md-icon>"+
				        "</md-button>"+
			    	  "</div>",
           link: function(scope, element, attr) {

    			// scope.check = function(customer) {
				// 	var is_check = false;
				// 	scope.deletecustomer.forEach(function(c) {
				// 		if(c.id ==  customer.id) {
				// 			var index = scope.deletecustomer.indexOf(customer);
				// 			scope.deletecustomer.splice(index, 1); 
				// 			is_check = true;
				// 		} 
				// 	});
				// 	if(!is_check) scope.deletecustomer.push(customer);
				// 	console.log(scope.deletecustomer);
				// }

           	}
        };
});