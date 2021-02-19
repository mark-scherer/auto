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
    this.updateServerState = this.updateServerState.bind(this)

    this.state = {
      serverState: null,
      updateIntervalID: setInterval(this.updateServerState, SERVER_UPDATE_INTERVAL)
    }
  }

  updateServerState() {
    const full_url = `http://${CONFIG.server.host}:${CONFIG.server.port}/status`
    misc.makeRequest(full_url)
      .then(response => {
        const serverState = JSON.parse(response.body)
        this.setState({
          serverState
        })
      })
      .catch(error => console.error(`App: error getting serverState: ${JSON.stringify({ error: String(error) })}`))
  }

  componentDidMount() {
    this.updateServerState()
  }

  componentWillUnmount() {
    const {
      updateIntervalID
    } = this.state

    clearInterval(updateIntervalID)
  }

  render() {
    const {
      serverState
    } = this.state

    // use intensity field to see all possible outputs
    const serverIntensityOutputs = serverState && serverState.intensities ? Object.keys(serverState.intensities) : null
    
    return (
      <div className="App">
      {
        _.map(serverIntensityOutputs, outputName => {
          
          // narrow down state to just this output
          const serverOutputState = {
            intensities         : serverState.intensities[outputName],
            availableSequences  : _.fromPairs(_.filter(_.toPairs(serverState.available_sequences), sequenceEntry => {
              const sequenceInfo = sequenceEntry[1]
              return sequenceInfo.eligible_outputs.length === 1 && sequenceInfo.eligible_outputs.includes(outputName)
            })),
            activeSequences     : _.fromPairs(_.filter(_.toPairs(serverState.active_sequences), sequenceEntry => {
              const sequenceId = sequenceEntry[0]
              const sequenceInfo = sequenceEntry[1]
              const sequenceOutputs = Object.keys(sequenceInfo.args.outputs_guide)
              return sequenceOutputs.length === 1 && sequenceOutputs.includes(outputName)
            }))
          }

          return <StripController outputName={outputName} serverOutputState={serverOutputState} updateServerState={this.updateServerState}/>
        })
      }
      </div>
    );
  }
}

export default App;
