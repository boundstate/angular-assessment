angular.module('boundstate.assessment')

.directive('assessment', function(assessment) {
  return {
    restrict: 'AE',
    scope: {},
    link: function(scope, el, attrs) {
      scope.questions = assessment.getQuestions();
      scope.offset = el[0].getBoundingClientRect().top;
    },
    templateUrl: 'directive/assessment.tpl.html',
    replace: true
  };
})

;