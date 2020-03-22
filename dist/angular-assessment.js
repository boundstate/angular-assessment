/**
 * angular-assessment - v0.0.14 - 2020-03-22
 *
 * Copyright (c) 2020 Bound State Software
 */


(function (window, angular, undefined) {
angular.module('boundstate.assessment', [
  'ngSanitize',
  'templates-main',
  'boundstate.scrollToMe'
])

;
angular.module('boundstate.assessment')

.directive('assessment', ["assessment", function(assessment) {
  return {
    restrict: 'AE',
    scope: {
      offset: '='
    },
    link: function(scope, el, attrs) {
      scope.questions = assessment.getQuestions();
    },
    templateUrl: 'directive/assessment.tpl.html',
    replace: true
  };
}])

;

angular.module('boundstate.assessment')

.directive('question', ["$rootScope", "assessment", function($rootScope, assessment) {
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
}])

;

angular.module('boundstate.assessment')

.factory('Question', ["$window", function ($window) {
  var _ = $window._;

  var Question = function(config) {
    if (angular.isUndefined(config.id)) {
      throw new Error('Question id must be specified');
    }
    if (angular.isUndefined(config.label)) {
      throw new Error('Question label must be specified');
    }
    this.id = config.id;
    this.type = config.type || 'choice';
    this.label = config.label;
    this.hint = config.hint;
    this.linkTitle = config.linkTitle;
    this.config = config;
    this.isEnabled = false;
  };

  Question.prototype.getSelectedOption = function() {
    if (!angular.isDefined(this.answer)) {
      return undefined;
    } else {
      return _.find(this.options, { value: this.answer });
    }
  };

  Question.prototype.isAnswered = function() {
    if (this.type == 'choice') {
      return angular.isDefined(this.getSelectedOption());
    } else if (this.type == 'multi-choice') {
      // multi-choice can be answered without selecting any choices
      return angular.isDefined(this.answer);
    } else {
      return angular.isDefined(this.answer) && this.answer.length > 0;
    }
  };

  Question.prototype.reload = function(score, assessment) {
    if (this.type == 'choice' || this.type == 'multi-choice') {
      this._reloadOptions(score, assessment);
    }
    this._reloadIsApplicable(score, assessment);
    this._reloadScore(score, assessment);
  };

  Question.prototype._reloadOptions = function(score, assessment) {
    var options = angular.isFunction(this.config.options) ? this.config.options(score, assessment) : this.config.options;
    // Convert simple options (e.g. ['a', 'b', 'c']) to complex (e.g. [ { label: 'a', value: 'a' } ...])
    for (var j=0; j<options.length; j++) {
      if (!angular.isObject(options[j])) {
        options[j] = { label: options[j], value: options[j] };
      }
    }
    this.options = options;
  };

  Question.prototype._reloadIsApplicable = function(score, assessment) {
    if (angular.isDefined(this.config.isApplicable)) {
      this.isApplicable = this.config.isApplicable(score, assessment);
    } else {
      this.isApplicable = true;
    }
  };

  Question.prototype._reloadScore = function(score, assessment) {
    this.score = score;
    if (this.isAnswered()) {
      var selectedOption = this.type == 'choice' ? this.getSelectedOption() : undefined;
      if (angular.isDefined(selectedOption) && angular.isDefined(selectedOption.score)) {
        // score is specified explicitly in question option
        this.score = selectedOption.score;
      } else if (angular.isDefined(this.config.score)) {
        // score is specified as a function
        this.score = this.config.score(this.answer, score, assessment);
      }
    }
  };

  return Question;
}])

;

angular.module('boundstate.assessment')

.provider('assessment', function AssessmentProvider() {

  var _defaultQuestionOptions = [
    { label: 'Yes', value: 'y' },
    { label: 'No', value: 'n' }
  ];
  var _questionsConfig = [];

  this.setDefaultQuestionOptions = function(value) {
    _defaultQuestionOptions = value;
  };

  this.setQuestions = function (config) {
    if (!angular.isArray(config)) {
      throw new Error('Questions must be an array');
    }
    _questionsConfig = config;
  };

  this.$get = ["$rootScope", "$window", "Question", function ($rootScope, $window, Question) {
    var _score = null;
    var _isComplete = false;
    var _questions = [];
    var _currentQuestion = null;
    var _previousQuestion = null;
    var _ = $window._;

    angular.forEach(_questionsConfig, function(config) {
      if (_.find(_questions, { id: config.id })) {
        throw new Error('A question with the id "' + config.id + '" is already defined');
      }
      if ((angular.isUndefined(config.type) || config.type == 'text') && angular.isUndefined(config.options)) {
        config.options = _defaultQuestionOptions;
      }
      _questions.push(new Question(config));
    });

    var assessmentFactory = {
      getScore: function () {
        return _score;
      },
      isComplete: function () {
        return _isComplete;
      },
      getCurrentQuestion: function() {
        return _currentQuestion;
      },
      getQuestions: function() {
        return _questions;
      },
      getQuestion: function(questionId) {
        return _.find(_questions, { id: questionId });
      },
      getQuestionIndex: function(questionId) {
        return _.findIndex(_questions, { id: questionId });
      },
      isQuestionApplicable: function(questionId) {
        var question = this.getQuestion(questionId);
        return angular.isDefined(question) ? question.isApplicable : false;
      },
      isQuestionEnabled: function(questionId) {
        var question = this.getQuestion(questionId);
        return angular.isDefined(question) ? question.isEnabled : false;
      },
      setAnswer: function(questionId, value) {
        var question = this.getQuestion(questionId);
        question.answer = value;
        this.reload();
        $rootScope.$broadcast('boundstate.assessment:answer_changed');
      },
      getAnswer: function(questionId) {
        var question = this.getQuestion(questionId);
        return question.isAnswered() ? question.answer : undefined;
      },
      getAnswers: function() {
        var answers = {};
        _(_questions)
          .filter(function(question) {
            return question.isAnswered();
          })
          .forEach(function(question) {
            answers[question.id] = question.answer;
          });
        return answers;
      },
      clearAnswers: function() {
        for (var i=0; i<_questions.length; i++) {
          delete _questions[i].answer;
        }
        this.reload();
        $rootScope.$broadcast('boundstate.assessment:answer_changed');
      },
      reload: function() {
        var self = this;
        var arePreviousQuestionsAnswered = true;
        _score = null;
        // Evaluate questions in the order they were defined
        angular.forEach(_questions, function (question) {
          question.reload(_score, self);
          if (arePreviousQuestionsAnswered && question.isApplicable) {
            question.isEnabled = true;
            _score = question.score;
            _currentQuestion = question;
            arePreviousQuestionsAnswered = question.isAnswered();
          } else {
            question.isEnabled = false;
          }
        });
        // If the current question is answered the assessment must be complete
        _isComplete = _currentQuestion.isAnswered();
      }
    };

    assessmentFactory.reload();

    return assessmentFactory;
  }];

})

;
angular.module('templates-main', ['directive/assessment.tpl.html', 'directive/question.tpl.html']);

angular.module("directive/assessment.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("directive/assessment.tpl.html",
    "<div class=\"assessment\">\n" +
    "  <div question ng-repeat=\"question in questions\" question-id=\"{{question.id}}\" offset=\"{{offset}}\"></div>\n" +
    "</div>");
}]);

angular.module("directive/question.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("directive/question.tpl.html",
    "<div id=\"question-{{question.id}}\" class=\"question question-{{ question.type }}\" ng-show=\"question.isEnabled\" ng-class=\"{ current: isCurrent && !question.isAnswered() }\" scroll-to-me=\"isCurrent\">\n" +
    "  <div class=\"question-label\" ng-bind-html=\"question.label\"></div>\n" +
    " <a class=\"question-link\" ng-click=\"clickLink($event)\" ng-bind-html=\"question.linkTitle\"></a>\n" +
    "  <div class=\"question-hint\" ng-if=\"question.hint\" ng-bind-html=\"question.hint\"></div>\n" +
    "  <div ng-if=\"question.type == 'multi-choice'\">\n" +
    "    <div class=\"multi-choice\" ng-repeat=\"option in question.options\" ng-class=\"{ active: isMultiOptionSelected(option.value) }\">\n" +
    "      <label>\n" +
    "        <input type=\"checkbox\" ng-model=\"form.choices['choice-' + $index]\" ng-change=\"toggleMultiOption(option.value)\"> {{ option.label }}\n" +
    "        <a class=\"question-option-link\" ng-click=\"clickLink($event, option.value)\" ng-bind-html=\"option.linkTitle\"></a>\n" +
    "      </label>\n" +
    "    </div>\n" +
    "    <button type=\"button\" ng-show=\"!question.isAnswered()\" ng-click=\"setAnswer(form.answer)\">Done</button>\n" +
    "  </div>\n" +
    "  <div ng-if=\"question.type == 'choice'\">\n" +
    "    <div class=\"choice\" ng-repeat=\"option in question.options\" ng-class=\"{ active: option.value === form.answer }\">\n" +
    "      <label>\n" +
    "        <input type=\"radio\" ng-model=\"form.answer\" ng-value=\"option.value\" ng-change=\"setAnswer(form.answer)\"> {{ option.label }}\n" +
    "        <a class=\"question-option-link\" ng-click=\"clickLink($event, option.value)\"  ng-bind-html=\"option.linkTitle\"></a>\n" +
    "      </label>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "  <div class=\"text\" ng-if=\"question.type == 'text'\">\n" +
    "    <form ng-submit=\"setAnswer(form.answer);\">\n" +
    "      <input type=\"text\" placeholder=\"{{ question.config.placeholder }}\" ng-model=\"form.answer\" ng-focus=\"hasFocus = true\" ng-blur=\"setAnswer(form.answer); hasFocus = false\">\n" +
    "      <button type=\"submit\" ng-show=\"hasFocus\">Done</button>\n" +
    "    </form>\n" +
    "  </div>\n" +
    "  <div class=\"text\" ng-if=\"question.type == 'textarea'\">\n" +
    "    <form ng-submit=\"setAnswer(form.answer);\">\n" +
    "      <textarea placeholder=\"{{ question.config.placeholder }}\" ng-model=\"form.answer\" ng-focus=\"hasFocus = true\" ng-blur=\"setAnswer(form.answer); hasFocus = false\"></textarea>\n" +
    "      <button type=\"submit\" ng-show=\"hasFocus\">Done</button>\n" +
    "    </form>\n" +
    "  </div>\n" +
    "</div>\n" +
    "");
}]);
})(window, window.angular);