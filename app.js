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

app.factory('UserKey', function() {
    var factory = {};
  	
  	factory.key = ''; 
  	factory.row = '';
    
    factory.setKey = function(value) {
            factory.key = value;
    }

    factory.setRow = function(value) {
            factory.row = value;
    }

    return factory;
});


app.factory('AIanswer', function(TestPaper) {
    var factory = {};
  	
  	factory.choices = ["a","b","c","d"];

    factory.incorrect = function(testpaper) {
    	    var answers = []
            testpaper.forEach(function(test) {
            	var ans = factory.randomAnswer(test);
            	answers.push(ans);
            });

            return answers;
    }


    factory.randomAnswer = function(test) {
    	var a = factory.choices[Math.floor(Math.random() * 4)];
    	if(test.correct == a) {
            a = factory.randomAnswer(test);
            console.log(a+"="+test.correct);
        }
    	return a;
    }

    return factory;
});



app.factory('TestPaper', function() {
    var factory = {};
  	
  	factory.testpaper = [];

    factory.generateTest = function(testpaper) {
		var qid = [];
		var x=1;

		while(x <= 5) {	
			var e = testpaper[Math.floor(Math.random() * testpaper.length)];
			var index = qid.indexOf(e.$id);
			if(index<=-1) {
				factory.testpaper.push(e);
				qid.push(e.$id)
				x++;
			}
		}	
    }

    return factory;
});



app.controller('signupController', function($scope,$location,$firebaseObject,UserKey) {


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

			  UserKey.setKey(snapshot.key());	
			  name = newPost.name;
			  console.log(UserKey.key);
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
						UserKey.setRow(row);		
					}
				});	
			});
		});

		$location.path('/classroom');
	}

});

app.controller('classroomController', function($scope,$mdDialog,$firebaseObject,$firebaseArray,UserKey,TestPaper) {

	var chairsRef = new Firebase("https://kopyahan.firebaseio.com/sits");
	$scope.chairs = $firebaseObject(chairsRef);

	var studentRef = new Firebase("https://kopyahan.firebaseio.com/students/"+UserKey.key);
	var student = $firebaseObject(studentRef);
	
  	var qRef = new Firebase("https://kopyahan.firebaseio.com/questions");
	$scope.qs = $firebaseArray(qRef);

	$scope.qs.$loaded(function(test) {
		TestPaper.generateTest(test);
	});

	// console.log(student.name);
});

function examController($scope,$firebaseObject,$firebaseArray) {

	var ref = new Firebase("https://kopyahan.firebaseio.com/questions");
	var correct = [];

	$scope.qs = $firebaseArray(ref);
	console.log($scope.qs);

	$scope.answer = function(q,ans) {
		
		angular.forEach($scope.qs, function(question) { 
			if(question.$id == q) {
				console.log(question.content);
				if(question.correct == ans) {
					correct.push(question.$id);
					console.log("Correct!");
				} else {
					var index = correct.indexOf(question.$id);
					if(index!=-1){
					   correct.splice(index, 1);
					}
				}
			}
		});

		console.log(correct);
		console.log(scorePercentage());
	}


	var scorePercentage = function () {
		return Math.floor((correct.length/$scope.qs.length) * 100);
	}

	$scope.checkAnswer = function() {
		
	}

}

app.directive('studentList', function ($firebaseObject,UserKey,$mdDialog) {
        return {
           restrict: 'E',
           scope: {
           		data: "=",
           },
           template: "<div>"+
			    		"<div style='font-size:11px;margin-bottom:5px;'>Student {{data.value}}</div>"+
			    		"<div ng-if='data.sitted'>{{data.sitted}}</div>"+
						"<md-button ng-if='data.sitted' class='md-fab md-primary md-hue-2' ng-click='showExam();' aria-label='Profile'>"+
				            "<md-icon md-svg-src='img/icons/android-content-copy-512px.svg'></md-icon>"+
				        "</md-button>"+
				        // "<md-button ng-if='data.sitted' class='md-fab ' ng-click='logout();' aria-label='Profile'>"+
				        //     "<md-icon md-svg-src='img/icons/log-out-512px.svg'></md-icon>"+
				        // "</md-button>"+
			    	  "</div>",
           link: function(scope, element, attr) {
           	    scope.key = UserKey.key;
           	    scope.row = UserKey.row;

				scope.showExam = function(ev) {
				    $mdDialog.show({
				      controller: examController,
				      templateUrl: 'views/exam.tmp.html',
				      parent: angular.element(document.body),
				      targetEvent: ev,
				      clickOutsideToClose:true
				    });
			 	};

				scope.logout = function() {
					
					var studentRef = new Firebase("https://kopyahan.firebaseio.com/students/"+scope.key);
					var student = $firebaseObject(studentRef);

					student.$loaded(function(data) {
						console.log(data.sit);
						var sitRef = new Firebase("https://kopyahan.firebaseio.com/sits/row"+scope.row+"/sit"+data.sit);
						sitRef.update({
							  "sitted": 0
						});

						studentRef.update({
				  			"sit": 0
			  			});

					});

					
				}

           	}
        };
});


app.directive('aiStudent', function ($firebaseObject,UserKey,$mdDialog) {
        return {
           restrict: 'E',
           scope: {
           		data: "=",
           },
           template: "<div>"+
			    		"<div style='font-size:11px;margin-bottom:5px;'>AI Student {{data.value}}</div>"+
			    		"<div ng-if='data.sitted'>AI</div>"+
						"<md-button class='md-fab md-primary md-hue-2' ng-click='showExam();' aria-label='Profile'>"+
				            "<md-icon md-svg-src='img/icons/android-content-copy-512px.svg'></md-icon>"+
				        "</md-button>"+
				        // "<md-button ng-if='data.sitted' class='md-fab ' ng-click='logout();' aria-label='Profile'>"+
				        //     "<md-icon md-svg-src='img/icons/log-out-512px.svg'></md-icon>"+
				        // "</md-button>"+
			    	  "</div>",
           link: function(scope, element, attr) {
           	    scope.key = UserKey.key;
           	    scope.row = UserKey.row;

				scope.showExam = function(ev) {
				    $mdDialog.show({
				      $scope: scope,
				      template: '<exam></exam>',
				      parent: angular.element(document.body),
				      targetEvent: ev,
				      clickOutsideToClose:true,
				      controller: function aiexamController($scope, $mdDialog) {
                     		$scope.aidata = scope.data;
                     			

                     		console.log(scope.data);
	                  }
				    });
			 	};



           	}
        };
});



app.directive('exam', function ($firebaseArray,$mdDialog,AIanswer,TestPaper) {
        return {
           restrict: 'E',
           scope: {
           		data: "=",
           },
           templateUrl: "views/randomexam.html",
           link: function(scope, element, attr) {
				
				scope.testpaper = TestPaper.testpaper;
				
				// scope.answers = AIanswer.incorrect(scope.testpaper);
				// var y = 0;	
				// angular.forEach(scope.testpaper, function(test) {
				// 	test["ans"] = scope.answers[y];
				// 	y++;
				// });

				console.log(scope.testpaper);			
           	}
        };
});