describe('boundstate.assessment', function () {

  var testQuestions = [
    {
      id: 'cats',
      label: 'Do you like cats?'
    },
    {
      id: 'gender',
      label: 'What is your gender?',
      options: [
        { label: 'Male',   value: 'm', score: 'h' },
        { label: 'Female', value: 'f', score: 'l' }
      ]
    },
    {
      id: 'age',
      label: 'What is your age?',
      options: [
        { label: 'Under 20', value: 'under20' },
        { label: '20 - 30',  value: '20to30'  },
        { label: 'Over 30',  value: 'over30'  }
      ],
      score: function(value, score, assessment) {
        if (assessment.getAnswer('gender') == 'm') {
          return value == '20to30' ? 'h' : 'm';
        } else {
          return value == '20to30' ? 'm' : 'l';
        }
      }
    },
    {
      id: 'pregnant',
      label: 'Have you ever been pregnant?',
      isApplicable: function(score, assessment) {
        return assessment.getAnswer('gender') == 'f';
      },
      score: function(value, score) {
        return value == 'y' ? 'h' : score;
      }
    }
  ];

  var testDefaultQuestionOptions = [
    { label: 'Yes', value: 'y' },
    { label: 'No', value: 'n' }
  ];

  describe('assessmentProvider', function () {
    var assessmentProvider;

    beforeEach(module('boundstate.assessment', function (_assessmentProvider_) {
      assessmentProvider = _assessmentProvider_;
    }));

    describe('setQuestions', function() {

      it('should accept a valid configuration of questions with unique ids', inject(function () {
        var setValidQuestions = function() {
          assessmentProvider.setQuestions([
            { id: 'cats1', label: 'Do you like calico cats?' },
            { id: 'cats2', label: 'Do you like siamese cats?' }
          ]);
        };
        expect(setValidQuestions).not.toThrow();
      }));

      it('should throw an exception if not passed an array', inject(function () {
        var setInvalidQuestions = function() {
          assessmentProvider.setQuestions('me like cats');
        };
        expect(setInvalidQuestions).toThrow();
      }));

    });

  });

  describe('assessment', function () {
    var assessmentProvider, assessment;

    beforeEach(module('boundstate.assessment', function (_assessmentProvider_) {
      assessmentProvider = _assessmentProvider_;
      assessmentProvider.setDefaultQuestionOptions(testDefaultQuestionOptions);
      assessmentProvider.setQuestions(testQuestions);
    }));

    beforeEach(inject(function (_assessment_) {
      assessment = _assessment_;
    }));

    describe('getQuestion', function () {

      it('should return the question with specified id', inject(function () {
        expect(assessment.getQuestion('gender').label).toBe('What is your gender?');
        expect(assessment.getQuestion('age').label).toBe('What is your age?');
      }));

      it('should return default options if none are specified', inject(function () {
        expect(assessment.getQuestion('pregnant').options).toEqual(testDefaultQuestionOptions);
      }));

      it('should return undefined if passed an invalid question id', inject(function () {
        expect(assessment.getQuestion('city')).toBeUndefined();
      }));

    });

    describe('isQuestionApplicable', function () {

      it('should return true if has no "isApplicable" function', inject(function () {
        expect(assessment.isQuestionApplicable('gender')).toBe(true);
      }));

      it('should return false if it\'s "isApplicable" function is not satisfied', inject(function () {
        expect(assessment.isQuestionApplicable('pregnant')).toBe(false);
      }));

      it('should return true if it\'s "isApplicable" function is satisfied', inject(function () {
        assessment.setAnswer('gender', 'f');
        expect(assessment.isQuestionApplicable('pregnant')).toBe(true);
      }));

    });

    describe('isQuestionEnabled', function () {

      it('should return true for the first applicable question', inject(function () {
        expect(assessment.isQuestionEnabled('cats')).toBe(true);
      }));

      it('should return false for a question with a previous unanswered question', inject(function () {
        expect(assessment.isQuestionEnabled('gender')).toBe(false);
      }));

      it('should return true for a question with all previous applicable questions answered', inject(function () {
        assessment.setAnswer('cats', 'y');
        expect(assessment.isQuestionEnabled('gender')).toBe(true);
        expect(assessment.isQuestionEnabled('age')).toBe(false);
        assessment.setAnswer('gender', 'f');
        expect(assessment.isQuestionEnabled('age')).toBe(true);
      }));

      it('should return false if a question is not applicable', inject(function () {
        expect(assessment.isQuestionEnabled('pregnant')).toBe(false);
      }));

    });

    describe('score', function () {

      it('should return null if no answers are provided', inject(function () {
        expect(assessment.score).toBe(null);
      }));

      it('should remain unchanged by answers to questions with no score defined', inject(function () {
        assessment.setAnswer('cats', 'y');
        expect(assessment.score).toBe(null);
      }));

      it('should be affected by answers to questions with explicit scores defined in the options', inject(function () {
        assessment.setAnswer('cats', 'y');
        assessment.setAnswer('gender', 'm');
        expect(assessment.score).toBe('h');
        assessment.setAnswer('gender', 'f');
        expect(assessment.score).toBe('l');
      }));

      it('should be affected by answers to questions with a score function', inject(function () {
        assessment.setAnswer('cats', 'y');
        assessment.setAnswer('gender', 'm');
        assessment.setAnswer('age', '20to30');
        expect(assessment.score).toBe('h');
        assessment.setAnswer('age', 'over30');
        expect(assessment.score).toBe('m');
      }));

      it('should be affected by answers in the order the questions are defined', inject(function () {
        assessment.setAnswer('cats', 'y');
        assessment.setAnswer('age', '20to30');
        assessment.setAnswer('gender', 'f');
        expect(assessment.score).toBe('m');
        assessment.setAnswer('gender', 'm');
        expect(assessment.score).toBe('h');
      }));

      it('should only be affected by answers to questions that are applicable', inject(function () {
        assessment.setAnswer('cats', 'y');
        assessment.setAnswer('age', 'over30');
        assessment.setAnswer('gender', 'm');
        assessment.setAnswer('pregnant', 'y');
        expect(assessment.score).toBe('m');
      }));

    });

  });

  describe('question directive', function () {
    var $scope, $compile, assessmentProvider, assessment;

    beforeEach(module('boundstate.assessment', function (_assessmentProvider_) {
      assessmentProvider = _assessmentProvider_;
      assessmentProvider.setDefaultQuestionOptions(testDefaultQuestionOptions);
      assessmentProvider.setQuestions(testQuestions);
    }));

    beforeEach(inject(function (_$rootScope_, _$compile_, _assessment_) {
      $scope = _$rootScope_;
      $compile = _$compile_;
      assessment = _assessment_;
    }));

    var compileQuestion = function (markup, scope) {
      var el = $compile(markup)(scope);
      scope.$digest();
      return el;
    };

    it('should add the "question" class', function () {
      var question = compileQuestion('<question question-id="cats"></question>', $scope);
      expect(question).toHaveClass('question');
    });

    it('should display the question label', function () {
      var questions = compileQuestion('<question question-id="gender"></question><question question-id="age"></question>', $scope);
      expect(questions.eq(0)).toContainText('What is your gender?');
      expect(questions.eq(1)).toContainText('What is your age?');
    });

    it('should display the option labels', function () {
      var questions = compileQuestion('<question question-id="cats"></question><question question-id="age"></question>', $scope);
      angular.forEach(testDefaultQuestionOptions, function(option) {
        expect(questions.eq(0)).toContainText(option.label);
      });
      expect(questions.eq(1)).toContainText('Under 20');
      expect(questions.eq(1)).toContainText('Over 30');
    });

    it('should be hidden only if a question is enabled', function () {
      var questions = compileQuestion('<question question-id="cats"></question><question question-id="gender"></question><question question-id="age"></question><question question-id="pregnant"></question>', $scope);
      expect(questions.eq(0)).not.toHaveClass('ng-hide');
      expect(questions.eq(1)).toHaveClass('ng-hide');
      expect(questions.eq(2)).toHaveClass('ng-hide');
      expect(questions.eq(3)).toHaveClass('ng-hide');
      $scope.$apply(function() {
        assessment.setAnswer('cats', 'y');
        assessment.setAnswer('gender', 'm');
      });
      expect(questions.eq(0)).not.toHaveClass('ng-hide');
      expect(questions.eq(1)).not.toHaveClass('ng-hide');
      expect(questions.eq(2)).not.toHaveClass('ng-hide');
      expect(questions.eq(3)).toHaveClass('ng-hide');
      $scope.$apply(function() {
        assessment.setAnswer('age', '20to30');
      });
      expect(questions.eq(0)).not.toHaveClass('ng-hide');
      expect(questions.eq(1)).not.toHaveClass('ng-hide');
      expect(questions.eq(2)).not.toHaveClass('ng-hide');
      expect(questions.eq(3)).toHaveClass('ng-hide');
      $scope.$apply(function() {
        assessment.setAnswer('gender', 'f');
      });
      expect(questions.eq(0)).not.toHaveClass('ng-hide');
      expect(questions.eq(1)).not.toHaveClass('ng-hide');
      expect(questions.eq(2)).not.toHaveClass('ng-hide');
      expect(questions.eq(3)).not.toHaveClass('ng-hide');
    });

  });

});
