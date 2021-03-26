import React, { Component }                         from 'react';
import _                                            from 'lodash';
import './App.css';

import * as config_public                           from '../../configs/config_public.json'
import * as config_private                          from '../../configs/config_private.json'
import * as misc                                    from './utils/misc'

import { StripController }                          from './components/Controllers';

const CONFIG = Object.assign({}, config_public, config_private)
const SERVER_UPDATE_INTERVAL = 5000   // ms

class App extends Component {
  constructor(props) {
    super(props)
    this.getUpdatedStatus = this.getUpdatedStatus.bind(this)
    this.updateStatus = this.updateStatus.bind(this)

    this.state = {
      status: null,     // status for all controls elevated so an the response to any cmd will update the state of all
      updateIntervalID: setInterval(this.getUpdatedStatus, SERVER_UPDATE_INTERVAL)    // status checked periodically to reflect cmds from other users
    }
  }

  updateStatus(status) {
    this.setState({
      status
    })
  }

  getUpdatedStatus() {
    const full_url = `http://${CONFIG.server.host}:${CONFIG.server.port}/status`
    misc.makeRequest(full_url)
      .then(response => {
        const status = JSON.parse(response.body).status
        this.updateStatus(status)
      })
      .catch(error => console.error(`App: error getting status: ${JSON.stringify({ error: String(error) })}`))
  }

  componentDidMount() {
    this.getUpdatedStatus()
  }

  componentWillUnmount() {
    const {
      updateIntervalID
    } = this.state

    clearInterval(updateIntervalID)
  }

  render() {
    const {
      status
    } = this.state

    // use intensity field to see all possible outputs
    const serverIntensityOutputs = status && status.intensities ? Object.keys(status.intensities) : null
    
    return (
      <div className="App">
      {
        _.map(serverIntensityOutputs, outputName => {
          
          // narrow down status to just this output
          const availableSequences = _.chain(status.available_sequences)
            .toPairs()
            .filter(sequenceEntry => {
              const sequenceInfo = sequenceEntry[1]
              return sequenceInfo.eligible_outputs.length === 1 && sequenceInfo.eligible_outputs.includes(outputName)
            })
            .fromPairs()
            .value()
          const activeSequences = _.chain(status.active_sequences)
            .toPairs()
            .filter(sequenceEntry => {
              const sequenceInfo = sequenceEntry[1]
              const sequenceOutputs = Object.keys(sequenceInfo.sequence_args.outputs_guide)
              return sequenceOutputs.length === 1 && sequenceOutputs.includes(outputName)
            })
            .fromPairs()
            .value()
          
          const outputStatus = {
            intensities         : status.intensities[outputName],
            availableSequences, 
            activeSequences
          }

          return <StripController outputName={outputName} outputStatus={outputStatus} updateStatus={this.updateStatus}/>
        })
      }
      </div>
    );
  }
}

export default App;
