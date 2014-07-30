describe('boundstate.assessment', function () {

  describe('Question', function () {
    var Question;

    beforeEach(module('boundstate.assessment'));

    beforeEach(inject(function (_Question_) {
      Question = _Question_;
    }));

    describe('Question', function() {

      it('should accept options defined as a simple array', inject(function () {
        var question = new Question({
          id: 'color',
          label: 'Favorite color:',
          options: ['blue', 'red', 'purple']
        });
        question.reload(null, {});
        expect(question.options).toEqual([
          { label: 'blue', value: 'blue' },
          { label: 'red', value: 'red' },
          { label: 'purple', value: 'purple' }
        ]);
      }));

      it('should accept options defined as a function that is passed the score and assessment', inject(function () {
        var mockAssessment = {
          getAnswer: function() {
            return 'y';
          }
        };
        var question = new Question({
          id: 'color',
          label: 'Favorite color:',
          options: function(score, assessment) {
            return ['blue' + score, 'red', assessment.getAnswer('q2') == 'y' ? 'purple' : 'pink'];
          }
        });
        question.reload(5, mockAssessment);
        expect(question.options).toEqual([
          { label: 'blue5', value: 'blue5' },
          { label: 'red', value: 'red' },
          { label: 'purple', value: 'purple' }
        ]);
      }));

    });

  });

});