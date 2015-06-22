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

  this.$get = function ($rootScope, $window, Question) {
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
  };

})

;