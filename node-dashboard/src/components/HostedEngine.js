import React, { Component } from 'react'
import update from 'react-addons-update'
import RunSetup from '../helpers/HostedEngineSetup'
var classNames = require('classnames')

const setup = new RunSetup()

class HostedEngine extends Component {
  constructor(props) {
    super(props)
      this.state = {
        hidden: true,
        foo: "bar"
      }
    this.onClick = this.onClick.bind(this)
  }
  onClick () {
    this.setState({hidden: false})
  }
  render() {
    return (
      <div>
        {this.state.hidden ?
          <Curtains callback={this.onClick} />
          :
          <Setup />
        }
      </div>
    )
  }
}

class Setup extends Component {
  // TODO: move all of the I/O and event stuff to Redux instead of
  // passing state
  constructor(props) {
    super(props)
    this.state = {
      question: null,
      output: null
    }
    this.resetState = this.resetState.bind(this)
    this.parseOutput = this.parseOutput.bind(this)
    this.passInput = this.passInput.bind(this)
  }
  resetState() {
    var question = {
      prompt: [],
      suggested: ''
    }

    var output = {
      infos: [],
      warnings: [],
      errors: [],
      lines: []
    }
    this.setState({question: question})
    this.setState({output: output})
  }
  componentWillMount() {
    this.resetState()
    this.setState({setup: setup.start(this.parseOutput)})
  }
  passInput(input) {
    if (this.state.question.prompt.length > 0) {
      setup.handleInput(input)
      this.resetState()
    }
  }
  parseOutput(ret) {
    var question = this.state.question
    question.suggested = ret.question.suggested

    question.prompt = question.prompt.concat(ret.question.prompt)

    this.setState({question: question})

    for (var key in ret.output) {
      var value = this.state.output
      value[key] = value[key].concat(ret.output[key])
      this.setState({output: value })
    }
  }
  render() {
    return (
      <div className="ovirt-input">
        {this.state.output.infos.length > 0 ?
          <Message messages={this.state.output.infos}
            type="info"
            icon="info"/>
        : null }
        {this.state.output.warnings.length > 0 ?
          <Message messages={this.state.output.warnings}
            type="warning"
            icon="warning-triangle-o"/>
        : null }
        <HostedEngineOutput output={this.state.output}/>
        {this.state.question.prompt.length > 0 ?
          <HostedEngineInput
            question={this.state.question}
            passInput={this.passInput}
            errors={this.state.output.errors}/>
          : <div className="spinner"/> }
      </div>
    )
  }
}

class HostedEngineInput extends Component {
  constructor(props) {
    super(props)
    this.state = {
      input: ''
    }
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleInput = this.handleInput.bind(this)
  }
  handleInput(e) {
    this.setState({input: e.target.value})
  }
  handleSubmit(e) {
    e.preventDefault()
    this.props.passInput(this.state.input)
  }
  componentWillReceiveProps(nextProps) {
    var suggested = nextProps.question.suggested
    this.setState({input: suggested})
  }
  render() {
    var inputClass = classNames({
      'col-xs-7': true,
      'has-error': this.props.errors.length > 0
    })
    var prompt = this.props.question.prompt.map(function(line, i) {
      return <span key={i}>
        {line}<br />
        </span>
    })
    var err_text = this.props.errors.length > 0 ?
      this.props.errors.map(function(err, i) {
        return <span key={i} className="help-block">{err}</span>
    }) : null
    return (
      <form
        onSubmit={this.handleSubmit}>
        <div className={inputClass}>
          <label
            className="control-label he-input"
            htmlFor="input">
            {prompt}
          </label>
          <input
            type="text"
            className="form-control"
            onChange={this.handleInput}
            value={this.state.input} />
          {err_text}
        </div>
      </form>
    )
  }
}

const HostedEngineOutput = ({output}) => {
  var output_div = output.lines.map(function(line, i) {
    return <span key={i}>
      {line}<br />
    </span>
  })
  return (
    <div className="panel panel-default viewport">
      <div className="he-input">
        {output_div}
      </div>
    </div>
  )
}

const Curtains = ({callback}) => {
  return (
    <div className="curtains blank-slate-pf">
      <div className="blank-slate-pf-main-action container-center">
        <h1>
          Hosted Engine Setup
        </h1>
        <button
          className="btn btn-lg btn-primary"
          onClick={callback}>Start</button>
      </div>
    </div>
  )
}

const Message = ({messages, type, icon}) => {
  var type = "alert alert-" + type
  var icon = "pficon pficon-" + icon
  var output = messages.map(function(message, i) {
      return <div key={i}>
          <span className={icon}></span>
          {message}
      </div>
  }, this)
  return (
      <div className={type}>{output}</div>
  )
}

export default HostedEngine
