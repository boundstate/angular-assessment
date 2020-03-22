angular.module('boundstate.assessment')

.directive('question', function($rootScope, assessment) {
  return {
    restrict: 'AE',
    scope: {},
    link: function(scope, el, attrs) {
      scope.question = assessment.getQuestion(attrs.questionId);
      scope.form = {
        choices: {}
      };

      var indexOf = function (arr, value) {
        for (var i = 0; i < arr.length; i++) {
          if (arr[i] === value) {
            return i;
          }
        }
        return false;
      } ;

      var update = function() {
        scope.isCurrent = scope.question.id == assessment.getCurrentQuestion().id;
        scope.form.answer = assessment.getAnswer(scope.question.id);
        if (scope.question.type == 'multi-choice' && angular.isUndefined(scope.form.answer)) {
          scope.form.answer = [];
        }
      };
      $rootScope.$on('boundstate.assessment:answer_changed', update);
      update();

      /**
       * Handles the question link click event.
       * Broadcasts a 'boundstate.assessment:link_clicked' event with the question id as the first argument.
       */
      scope.clickLink = function(event, optionValue) {
        $rootScope.$broadcast('boundstate.assessment:link_clicked', event, attrs.questionId, optionValue);
      };

      /**
       * Sets the assessment answer.
       * @param {string|Array} answer
       */
      scope.setAnswer = function(answer) {
        assessment.setAnswer(scope.question.id, answer);
      };

      /**
       * Toggles a multi-choice option.
       * @param {string} option
       */
      scope.toggleMultiOption = function(option) {
        var index = indexOf(scope.form.answer, option);
        if (index !== false) {
          scope.form.answer.splice(index, 1);
        } else {
          scope.form.answer.push(option);
        }
        // If the question has already been answered, update the question answer immediately.
        // (Otherwise setAnswer is triggered manually for muti-choice questions.)
        if (this.question.isAnswered()) {
          scope.setAnswer(scope.form.answer);
        }
      };

      /**
       * Returns true if a particular multi-choice option is selected.
       * @param {string} option
       * @returns {boolean}
       */
      scope.isMultiOptionSelected = function(option) {
        if (angular.isUndefined(scope.form.answer)) {
          return false;
        }
        return indexOf(scope.form.answer, option) !== false;
      };
    },
    templateUrl: 'directive/question.tpl.html',
    replace: true
  };
})

;
