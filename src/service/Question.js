angular.module('boundstate.assessment')

.factory('Question', function ($window) {
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
})

;