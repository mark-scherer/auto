import React, { Component }                         from 'react';
import _                                            from 'lodash';
import './App.css';

import * as config_public                           from '../../configs/config_public.json'
import * as config_private                          from '../../configs/config_private.json'
import * as misc                                    from './utils/misc'

import { StripController }                          from './components/Controllers';

const CONFIG = Object.assign({}, config_public, config_private)

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      serverState
    }
  }

  updateServerState() {
    const full_url = `http://${CONFIG.server.host}:${CONFIG.server.port}/status`
    misc.makeRequest(full_url)
      .then(response => {
        const serverState = response
        console.log(`App: got serverState : ${JSON.stringify({ serverState })}`)
        this.setState({
          serverState
        })
      })
      .catch(error => console.error(`App: error getting serverState: ${JSON.stringify({ error: String(error) })}`))
  }

  componentDidMount() {
    this.updateServerState()
  }

  render() {
    const {
      serverState
    } = this.state

    return (
      <div className="App">
      {
        _.map(serverState.intensities || [], (outputState, outputName) => {
          return <StripController outputName={outputName} outputState={outputState} />
        })
      }
      </div>
    );
  }
}

export default App;
