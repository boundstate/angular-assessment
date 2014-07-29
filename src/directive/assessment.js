angular.module('boundstate.assessment')

.directive('assessment', function(assessment) {
  return {
    restrict: 'AE',
    scope: {},
    link: function(scope, el, attrs) {
      scope.questions = assessment.getQuestions();
    },
    templateUrl: 'directive/assessment.tpl.html',
    replace: true
  };
})

;