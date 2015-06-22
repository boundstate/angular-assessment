# Angular Assessment

Assessment service and directives for AngularJS.
An assessment is an ordered set of multiple-choice questions, which can affect the assessment score.

[![Build Status](https://travis-ci.org/boundstate/angular-assessment.svg)](https://travis-ci.org/boundstate/angular-assessment)

## Installation

Include `angular-assessment.js` and the libraries it depends on in your HTML:

    <script src="bower_components/lodash/dist/lodash.js"></script>
    <script src="bower_components/smooth-scroll/dist/js/smooth-scroll.js"></script>
    <script src="bower_components/angular-sanitize/angular-sanitize.js"></script>
    <script src="bower_components/angular-scroll-to-me/angular-scroll-to-me.js"></script>
    <script src="bower_components/angular-assessment/dist/angular-assessment.js"></script>
    
Then load the module in your application by adding it as a dependent module:

    angular.module('app', ['boundstate.assessment']);

## Usage

### Configuration

Configure the questions:

    assessmentProvider.setQuestions([
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
      }
    ])
    
You can optionally specify default options for questions:

    assessmentProvider.setDefaultQuestionOptions([
      { label: 'Yes', value: 'y' },
      { label: 'No', value: 'n' }
    ]);
    
Question have the following properties:

-  `id`: unique question ID (required).
-  `label`: question label to display in the `question` directive.
-  `hint`: question hint to display after the label (optional).
-  `options`: an array of options to display, or a function with signature `(score, assessment)` that returns an array of options (optional).  
    The array may contain strings or objects with the following properties:
    -  `label`: option label (required).
    -  `value`: option value (required).
    -  `score`: the new score if this option is selected (optional).    
-  `isApplicable`: a function with signature `(score, assessment)` that returns whether the question should be displayed (optional).
-  `score`: a function with signature `(value, score, assessment)` that returns a new score. (If the selected option has a `score` property it will override this function.)

The `isApplicable` and `score` functions are evaluated in the order the questions are defined, so you can safely reference previous question answers.
The assessment score is determined by evaluating the `score` for all applicable questions in the order they are defined.

### Directives

Display the assessment using the `assessment` directive:

    <assessment></assessment>
    
You can also manually render each question using the `question` directive:

    <question question-id="cats"></question>
    <question question-id="gender"></question>
    
### Service
    
Access the current assessment score in a controller:

    $scope.$on('boundstate.assessment:answer_changed', function () {
      $scope.score = assessment.score;
    });
    
You can also get the answer to a question using `assessment.getAnswer(questionId)`.