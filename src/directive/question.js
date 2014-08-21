angular.module('boundstate.assessment')

.directive('question', function($rootScope, assessment) {
  return {
    restrict: 'AE',
    scope: {},
    link: function(scope, el, attrs) {
      scope.question = assessment.getQuestion(attrs.questionId);
      scope.form = {};

      var update = function() {
        scope.isCurrent = scope.question.id == assessment.getCurrentQuestion().id;
        scope.form.answer = assessment.getAnswer(scope.question.id);
      };
      $rootScope.$on('boundstate.assessment:answer_changed', update);
      update();

      scope.clickLink = function() {
        $rootScope.$broadcast('boundstate.assessment:link_clicked', attrs.questionId);
      };

      scope.setAnswer = function(answer) {
        assessment.setAnswer(scope.question.id, answer);
      };
    },
    templateUrl: 'directive/question.tpl.html',
    replace: true
  };
})

;