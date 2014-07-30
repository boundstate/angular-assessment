angular.module('boundstate.assessment')

.directive('question', function(assessment) {
  return {
    restrict: 'AE',
    scope: {},
    link: function(scope, el, attrs) {
      scope.question = assessment.getQuestion(attrs.questionId);
      scope.changeAnswer = function() {
        assessment.setAnswer(scope.question.id, scope.answer);
      };

      var update = function() {
        scope.isCurrent = scope.question.id == assessment.getCurrentQuestion().id;
        scope.answer = assessment.getAnswer(scope.question.id);
      };
      scope.$on('boundstate.assessment:answer_changed', update);
      update();
    },
    templateUrl: 'directive/question.tpl.html',
    replace: true
  };
})

;