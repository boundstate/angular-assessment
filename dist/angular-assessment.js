/**
 * angular-assessment - v0.0.1 - 2014-07-29
 *
 * Copyright (c) 2014 Bound State Software
 */


(function (window, angular, undefined) {
angular.module('boundstate.assessment', [
  'templates-main'
])

;
angular.module('boundstate.assessment')

.directive('assessment', ["assessment", function(assessment) {
  return {
    restrict: 'AE',
    scope: {},
    link: function(scope, el, attrs) {
      scope.questions = assessment.getQuestions();
    },
    templateUrl: 'directive/assessment.tpl.html',
    replace: true
  };
}])

;
angular.module('boundstate.assessment')

.directive('question', ["assessment", function(assessment) {
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
    if (angular.isUndefined(config.options)) {
      throw new Error('Question options must be specified');
    }
    this.id = config.id;
    this.label = config.label;
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
    return angular.isDefined(this.getSelectedOption());
  };

  Question.prototype.reload = function(score, assessment) {
    this._reloadOptions(score, assessment);
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
      var selectedOption = this.getSelectedOption();
      if (angular.isDefined(selectedOption.score)) {
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
    var _questions = [];
    var _ = $window._;

    angular.forEach(_questionsConfig, function(config) {
      if (_.find(_questions, { id: config.id })) {
        throw new Error('A question with the id "' + config.id + '" is already defined');
      }
      if (angular.isUndefined(config.options)) {
        config.options = _defaultQuestionOptions;
      }
      _questions.push(new Question(config));
    });

    var assessmentFactory = {
      score: null,
      getQuestions: function() {
        return _questions;
      },
      getQuestion: function(questionId) {
        return _.find(_questions, { id: questionId });
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
        return question.answer;
      },
      reload: function() {
        var arePreviousQuestionsAnswered = true;
        this.score = null;
        // Evaluate questions in the order they were defined
        for (var i=0; i<_questions.length; i++) {
          var question = _questions[i];
          var previousQuestion = i > 0 ? _questions[i-1] : null;
          var previousQuestionScore = previousQuestion ? previousQuestion.score : null;

          question.reload(previousQuestionScore, this);

          if (arePreviousQuestionsAnswered && question.isApplicable) {
            question.isEnabled = true;
            this.score = question.score;
            arePreviousQuestionsAnswered = question.isAnswered();
          } else {
            question.isEnabled = false;
          }
        }
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
    "  <question ng-repeat=\"question in questions\" question-id=\"{{question.id}}\"></question>\n" +
    "</div>");
}]);

angular.module("directive/question.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("directive/question.tpl.html",
    "<div class=\"question\" ng-show=\"question.isEnabled\" ng-class=\"{ focus: !answer }\">\n" +
    "  {{ question.label }}\n" +
    "  <div class=\"question-hint\" ng-if=\"question.hint\">{{ question.hint }}</div>\n" +
    "  <div class=\"radio\" ng-repeat=\"option in question.options\" ng-class=\"{ active: option.value === answer }\">\n" +
    "    <label>\n" +
    "      <input type=\"radio\" ng-model=\"$parent.answer\" ng-value=\"option.value\" ng-change=\"changeAnswer()\"> {{ option.label }}\n" +
    "    </label>\n" +
    "  </div>\n" +
    "</div>");
}]);
})(window, window.angular);