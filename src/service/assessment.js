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
  };

})

;