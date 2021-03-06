// Generated by CoffeeScript 1.3.3
(function() {
  var HomeView, Router, Time, Transmission, TransmissionView, inlineTemplate, zeroPad,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  inlineTemplate = function(selector) {
    return _.template($(selector).html());
  };

  zeroPad = function(x, length) {
    return (new Array(length + 1 - x.toString().length)).join('0') + x;
  };

  Transmission = (function() {

    Transmission.fromString = function(string) {
      var command, debug, hours, minutes, parts;
      parts = string.split('-');
      command = parts[0];
      hours = parts[1];
      minutes = parts[2];
      debug = parts.length > 3 && parts[3] === 'debug';
      return new Transmission(command, hours, minutes, debug);
    };

    Transmission.prototype.prefix = '10011001';

    Transmission.prototype.commands = {
      'time': '01',
      'alarm': '10'
    };

    function Transmission(command, hours, minutes, debug) {
      if (debug == null) {
        debug = false;
      }
      this.command = command;
      this.hours = parseInt(hours, 10);
      this.minutes = parseInt(minutes, 10);
      this.debug = Boolean(debug);
      this.code = this.prefix;
      this.code += this.commands[this.command];
      this.code += zeroPad(this.hours.toString(2), 5);
      this.code += zeroPad(this.minutes.toString(2), 6);
    }

    Transmission.prototype.toString = function() {
      var xs;
      xs = [this.command, zeroPad(this.hours, 2), zeroPad(this.minutes, 2)];
      if (this.debug) {
        xs.push(this.debug);
      }
      return xs.join('-');
    };

    return Transmission;

  })();

  Time = (function() {

    Time.prototype.patterns = {
      "/^(0?[1-9]|1[0-2])[:.]([0-5][0-9])\\s*(am|pm)$/i": function(exec) {
        var hours, minutes;
        hours = parseInt(exec[1], 10);
        if (exec[3].toLowerCase() === 'pm' && hours !== 12) {
          hours += 12;
        }
        minutes = parseInt(exec[2], 10);
        return {
          hours: hours,
          minutes: minutes
        };
      },
      "/^([0-1]\\d|2[0-3])[:.]?([0-5]\\d)$/i": function(exec) {
        var hours, minutes;
        hours = parseInt(exec[1], 10);
        minutes = parseInt(exec[2], 10);
        return {
          hours: hours,
          minutes: minutes
        };
      }
    };

    function Time(text) {
      var _ref, _ref1;
      this.valid = this.parse(text);
      this.hours = (_ref = this.valid) != null ? _ref.hours : void 0;
      this.minutes = (_ref1 = this.valid) != null ? _ref1.minutes : void 0;
    }

    Time.prototype.parse = function(text) {
      var parser, pattern, re, split, _ref;
      _ref = this.patterns;
      for (pattern in _ref) {
        parser = _ref[pattern];
        split = pattern.split('/');
        re = new RegExp(split[1], split[2]);
        if (re.test(text)) {
          return parser(re.exec(text));
        }
      }
      return null;
    };

    return Time;

  })();

  Router = (function(_super) {

    __extends(Router, _super);

    function Router() {
      return Router.__super__.constructor.apply(this, arguments);
    }

    Router.prototype.routes = {
      '': 'home',
      'transmit/:transmission': 'transmit'
    };

    Router.prototype.home = function() {
      return (new HomeView()).render();
    };

    Router.prototype.transmit = function(transmission) {
      var t;
      t = Transmission.fromString(transmission);
      return (new TransmissionView({
        model: t
      })).render();
    };

    return Router;

  })(Backbone.Router);

  HomeView = (function(_super) {

    __extends(HomeView, _super);

    function HomeView() {
      return HomeView.__super__.constructor.apply(this, arguments);
    }

    HomeView.prototype.el = '#container';

    HomeView.prototype.template = inlineTemplate('#home-template');

    HomeView.prototype.events = {
      'change #time': 'validateTimeInput',
      'click #set-time': 'setTime',
      'click #set-alarm': 'setAlarm'
    };

    HomeView.prototype.render = function() {
      this.$el.html(this.template);
      return this;
    };

    HomeView.prototype.validateTimeInput = function(e) {
      var value;
      value = this.$('#time').val();
      if (!value) {
        return this.$('#time').parent().removeClass('error').removeClass('success');
      } else {
        this.time = new Time(value);
        if (this.time.valid != null) {
          return this.$('#time').parent().removeClass('error').addClass('success');
        } else {
          return this.$('#time').parent().removeClass('success').addClass('error');
        }
      }
    };

    HomeView.prototype.startTransmission = function(command) {
      var transmission, _ref;
      if (((_ref = this.time) != null ? _ref.valid : void 0) != null) {
        transmission = new Transmission(command, this.time.hours, this.time.minutes);
        return Backbone.history.navigate("transmit/" + transmission, {
          trigger: true
        });
      }
    };

    HomeView.prototype.setTime = function(e) {
      e.preventDefault();
      return this.startTransmission('time');
    };

    HomeView.prototype.setAlarm = function(e) {
      e.preventDefault();
      return this.startTransmission('alarm');
    };

    return HomeView;

  })(Backbone.View);

  TransmissionView = (function(_super) {

    __extends(TransmissionView, _super);

    function TransmissionView() {
      this.renderFinished = __bind(this.renderFinished, this);

      this.flash = __bind(this.flash, this);
      return TransmissionView.__super__.constructor.apply(this, arguments);
    }

    TransmissionView.prototype.el = '#container';

    TransmissionView.prototype.template = inlineTemplate('#transmission-template');

    TransmissionView.prototype.waitTime = 3000;

    TransmissionView.prototype.flashFrequency = 200;

    TransmissionView.prototype.doneWaitTime = 2000;

    TransmissionView.prototype.render = function() {
      var transmissionTime;
      this.$el.html(this.template({
        waitTime: this.waitTime
      }));
      setTimeout(this.flash, this.waitTime, this.model.code, this.model.debug);
      transmissionTime = this.waitTime + (this.model.code.length * this.flashFrequency);
      return this;
    };

    TransmissionView.prototype.flash = function(code, debug) {
      var f,
        _this = this;
      if (debug == null) {
        debug = false;
      }
      if (debug) {
        alert('Flashing: ' + code);
      }
      this.$el.empty();
      f = function() {
        if (debug) {
          alert('Code = ' + code);
        }
        $('body').css({
          background: code[0] === '1' ? '#FFF' : '#000'
        });
        code = code.slice(1);
        if (code === '') {
          setTimeout(_this.renderFinished, _this.flashFrequency);
          return setTimeout(_this.goHome, _this.flashFrequency + _this.doneWaitTime);
        } else {
          return setTimeout(f, _this.flashFrequency);
        }
      };
      return f();
    };

    TransmissionView.prototype.renderFinished = function() {
      $('body').css({
        background: '#FFF'
      });
      return this.$el.html(inlineTemplate('#transmission-finished-template'));
    };

    TransmissionView.prototype.goHome = function() {
      return Backbone.history.navigate('', {
        trigger: true
      });
    };

    return TransmissionView;

  })(Backbone.View);

  $(function() {
    new Router();
    return Backbone.history.start();
  });

}).call(this);
