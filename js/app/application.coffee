
inlineTemplate = (selector) -> _.template $(selector).html()

zeroPad = (x, length) ->
  (new Array(length + 1 - x.toString().length)).join('0') + x


class Transmission
  @fromString: (string) ->
    parts = string.split('-')
    command = parts[0]
    hours = parts[1]
    minutes = parts[2]
    debug = parts.length > 3 and parts[3] is 'debug'
    new Transmission(command, hours, minutes, debug)

  prefix: '10011001'

  commands:
    'time': '01'
    'alarm': '10'

  constructor: (command, hours, minutes, debug=no) ->
    @command = command
    @hours = parseInt(hours, 10)
    @minutes = parseInt(minutes, 10)
    @debug = Boolean(debug)

    @code = @prefix
    @code += @commands[@command]
    @code += zeroPad(@hours.toString(2), 5)
    @code += zeroPad(@minutes.toString(2), 6)

  toString: ->
    xs = [@command, zeroPad(@hours, 2), zeroPad(@minutes, 2)]
    if @debug
      xs.push(@debug)
    xs.join('-')


class Time
  patterns:
    "/^(0?[1-9]|1[0-2])[:.]([0-5][0-9])\\s*(am|pm)$/i": (exec) ->
      hours = parseInt(exec[1], 10)
      if exec[3].toLowerCase() == 'pm' and hours != 12
        hours += 12
      minutes = parseInt(exec[2], 10)
      hours: hours, minutes: minutes

    "/^([0-1]\\d|2[0-3])[:.]?([0-5]\\d)$/i": (exec) ->
      hours = parseInt(exec[1], 10)
      minutes = parseInt(exec[2], 10)
      hours: hours, minutes: minutes

  constructor: (text) ->
    @valid = @parse(text)
    @hours = @valid?.hours
    @minutes = @valid?.minutes

  parse: (text) ->
    for pattern, parser of @patterns
      split = pattern.split('/')
      re = new RegExp(split[1], split[2])
      if re.test(text)
        return parser(re.exec(text))
    return null


class Router extends Backbone.Router
  routes:
    '': 'home'
    'transmit/:transmission': 'transmit'

  home: ->
    (new HomeView()).render()

  transmit: (transmission) ->
    t = Transmission.fromString(transmission)
    (new TransmissionView(model: t)).render()


class HomeView extends Backbone.View
  el: '#container'

  template: inlineTemplate('#home-template')

  events:
    'change #time': 'validateTimeInput'
    'click #set-time': 'setTime'
    'click #set-alarm': 'setAlarm'

  render: ->
    @$el.html(@template)
    this

  validateTimeInput: (e) ->
    value = @$('#time').val()
    if !value
      @$('#time').parent().removeClass('error').removeClass('success')
    else
      @time = new Time(value)
      if @time.valid?
        @$('#time').parent().removeClass('error').addClass('success')
      else
        @$('#time').parent().removeClass('success').addClass('error')

  startTransmission: (command) ->
    if @time?.valid?
      transmission = new Transmission(command, @time.hours, @time.minutes)
      Backbone.history.navigate("transmit/#{transmission}", trigger: true)

  setTime: (e) ->
    e.preventDefault()
    @startTransmission('time')

  setAlarm: (e) ->
    e.preventDefault()
    @startTransmission('alarm')


class TransmissionView extends Backbone.View
  el: '#container'

  template: inlineTemplate('#transmission-template')

  waitTime: 3000
  flashFrequency: 200
  doneWaitTime: 2000

  render: ->
    @$el.html(@template(waitTime: @waitTime))
    setTimeout(@flash, @waitTime, @model.code, @model.debug)
    transmissionTime = @waitTime + (@model.code.length * @flashFrequency)
    this

  flash: (code, debug=no) =>
    if debug
      alert 'Flashing: ' + code

    @$el.empty()
    f = =>
      if debug
        alert 'Code = ' + code

      $('body').css(
        background: if code[0] is '1' then '#FFF' else '#000'
      )

      code = code.slice(1)
      if code == ''
        setTimeout(@renderFinished, @flashFrequency)
        setTimeout(@goHome, @flashFrequency + @doneWaitTime)
      else
        setTimeout(f, @flashFrequency)
    f()

  renderFinished: =>
    $('body').css(background: '#FFF')
    @$el.html(inlineTemplate('#transmission-finished-template'))

  goHome: ->
    Backbone.history.navigate('', trigger: true)


$ ->
  new Router()
  Backbone.history.start()

