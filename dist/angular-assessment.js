/**
 * angular-assessment - v0.0.12 - 2015-06-22
 *
 * Copyright (c) 2015 Bound State Software
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
    scope: {},
    link: function(scope, el, attrs) {
      scope.questions = assessment.getQuestions();
      scope.offset = el[0].getBoundingClientRect().top;
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
    } else {
      return angular.isDefined(this.answer) && this.answer.length > 0;
    }
  };

  Question.prototype.reload = function(score, assessment) {
    if (this.type == 'choice') {
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
    "<div id=\"question-{{question.id}}\" class=\"question\" ng-show=\"question.isEnabled\" ng-class=\"{ current: isCurrent && !question.isAnswered() }\" scroll-to-me=\"isCurrent\">\n" +
    "  <div class=\"question-label\" ng-bind-html=\"question.label\"></div>\n" +
    "  <div class=\"question-link\" ng-if=\"question.linkTitle\"><a ng-click=\"clickLink()\">{{ question.linkTitle }}</a></div>\n" +
    "  <div class=\"question-hint\" ng-if=\"question.hint\" ng-bind-html=\"question.hint\"></div>\n" +
    "  <div ng-if=\"question.type == 'choice'\">\n" +
    "    <div class=\"choice\" ng-repeat=\"option in question.options\" ng-class=\"{ active: option.value === form.answer }\">\n" +
    "      <label>\n" +
    "        <input type=\"radio\" ng-model=\"form.answer\" ng-value=\"option.value\" ng-change=\"setAnswer(form.answer)\"> {{ option.label }}\n" +
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
    "</div>");
}]);
})(window, window.angular);