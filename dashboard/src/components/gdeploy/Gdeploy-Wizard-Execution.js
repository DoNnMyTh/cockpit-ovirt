import React, { Component } from 'react'
import GdeployUtil from '../../helpers/GdeployUtil'

class WizardExecutionStep extends Component {
    constructor(props) {
        super(props);
        this.state = {
            gdeployLog: "",
            gdeployStatus: 1
        }
        this.gdeployDone = this.gdeployDone.bind(this)
        this.gdeployStdout = this.gdeployStdout.bind(this)
        this.gdeployFail = this.gdeployFail.bind(this)
        this.runGdeploy = this.runGdeploy.bind(this)
        this.callBack = this.callBack.bind(this)
    }
    componentDidMount() {
        this.runGdeploy()
    }
    gdeployDone() {
        this.setState({ gdeployStatus: 0 })
    }
    gdeployStdout(data) {
        this.setState({ gdeployLog: this.state.gdeployLog + data })
    }
    gdeployFail(exception) {
        this.setState({ gdeployStatus: -1 })
    }
    runGdeploy() {
        if (this.props.gdeployWizardType === "expand_cluster") {
            GdeployUtil.runExpandCluster(this.props.expandClusterConfigFilePath, function (result) {
                if (result) {
                    GdeployUtil.runGdeploy(this.props.configFilePath, this.gdeployStdout, this.gdeployDone, this.gdeployFail)
                    this.setState({ gdeployStatus: 1 })
                }
                else {
                    console.log("Error while running expand cluster.");
                }
            })
        }
        else {
            GdeployUtil.runGdeploy(this.props.configFilePath, this.gdeployStdout, this.gdeployDone, this.gdeployFail)
            this.setState({ gdeployStatus: 1 })
        }
    }
    callBack() {
        if (this.props.gdeployWizardType === "setup") {
            this.props.onSuccess(
              [this.props.heAnsweFilePath,
                this.props.heCommanAnswer
              ]
            )
        }
        else {
            this.props.onSuccess()
        }
    }
    render() {
        if (this.state.gdeployStatus === 0) {
            return <SuccessPanel callBack={this.callBack} gdeployWizardType={this.props.gdeployWizardType} />
        }
        return (
            <div className="col-sm-12">
                <div className="panel panel-default">
                    <div className="panel-heading">
                        <Status status={this.state.gdeployStatus} reDeployCallback={this.props.reDeployCallback}/>
                    </div>
                    <div className="list-group">
                        <div className="list-group-item">
                            <textarea className="gdeploy-wizard-config-preview"
                                value={this.state.gdeployLog}>
                            </textarea>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

WizardExecutionStep.propTypes = {
    configFilePath: React.PropTypes.string.isRequired,
    onSuccess: React.PropTypes.func.isRequired,
    reDeployCallback: React.PropTypes.func.isRequired
}

const Status = ({ status, reDeployCallback }) => {
    let msg = "Deployment in progress"
    let statusIcon = <div className="spinner spinner-lg blank-slate-pf-icon"></div>
    if (status === -1) {
        msg = "Deployment failed"
        statusIcon = <span className="pficon-error-circle-o"></span>
    }
    return (
        <div>
            {statusIcon}
            <span>{msg}</span>
            <div className="pull-right">
                {status === -1 &&
                    <button className="btn btn-primary" onClick={reDeployCallback}>
                        <span className="pficon pficon-restart">&nbsp;</span>
                        Redeploy
                     </button>
                }
            </div>
        </div>
    )
}

const SuccessPanel = ({ callBack, gdeployWizardType }) => {
    // Message to display in SuccessPanel
    let message = ""
    if (gdeployWizardType === "setup") {
        message = "Successfully deployed Gluster"
    } else if (gdeployWizardType === "expand_cluster") {
        message = "Successfully expanded cluster"
    } else {
        message = "Successfully created volume"
    }
    // Button Label 
    let buttonLabel = ""
    if (gdeployWizardType === "setup") {
        buttonLabel = "Continue to Hosted Engine Deployment"
    } else {
        buttonLabel = "Close"
    }
    return (
        <div className="wizard-pf-complete blank-slate-pf">
            <div className="wizard-pf-success-icon">
                <span className="glyphicon glyphicon-ok-circle"></span>
            </div>
            <h5 className="blank-slate-pf-main-action">
                {message}
            </h5>
            <button type="button" className="btn btn-lg btn-primary"
                onClick={callBack}>
                {buttonLabel}
        </button>
        </div>
    )
}

export default WizardExecutionStep
