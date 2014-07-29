angular.module('boundstate.assessment')

.directive('question', function(assessment) {
  return {
    restrict: 'AE',
    scope: {},
    link: function(scope, el, attrs) {
      scope.question = assessment.getQuestion(attrs.questionId);
      scope.answer = assessment.getAnswer(scope.question.id);
      scope.changeAnswer = function() {
        assessment.setAnswer(scope.question.id, scope.answer);
      };
      scope.$on('boundstate.assessment:answer_changed', function () {
        scope.answer = assessment.getAnswer(scope.question.id);
      });
    },
    templateUrl: 'directive/question.tpl.html',
    replace: true
  };
})

;