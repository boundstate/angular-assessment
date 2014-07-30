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
