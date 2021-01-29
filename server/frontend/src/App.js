import React, { Component }                         from 'react';
import _                                            from 'lodash';
import './App.css';

import * as config_public                           from '../../config/config_public.json'
import * as config_private                          from '../../config/config_private.json'
import * as misc                                    from './utils/misc'

import { RGBStripController, WhiteStripController } from './components/LEDStripControllers';

const CONFIG = Object.assign({}, config_public, config_private)

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      initialIntensities   : {}
    }
  }

  componentDidMount() {
    const full_url = `http://${CONFIG.server.host}:${CONFIG.server.port}/${CONFIG.endpoints.INITIAL_INTENSITIES_ENDPOINT}`
    misc.makeRequest(full_url)
      .then(response => {
        const initialIntensities = _.fromPairs(_.map(JSON.parse(response.body), (value, channel) => [ channel, value*100 ]))
        console.log(`App: got initial intensities : ${JSON.stringify({ initialIntensities })}`)
        this.setState({
          initialIntensities
        })
      })
      .catch(error => console.error(`App: error getting initial intensities: ${JSON.stringify({ error: String(error) })}`))
  }

  render() {
    const {
      initialIntensities
    } = this.state

    return (
      <div className="App">
        <RGBStripController
          initialIntensities={initialIntensities}
        />
        <WhiteStripController
          initialIntensities={initialIntensities}
        />
      </div>
    );
  }
}

export default App;
