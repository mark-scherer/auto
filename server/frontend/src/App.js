import React, { Component }                         from 'react';
import _                                            from 'lodash';
import './App.css';

import * as CONFIG                                  from './incl/config'
import * as misc                                    from './utils/misc'

import { RGBStripController, WhiteStripController } from './components/LEDStripControllers';

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      initialIntensities   : null
    }
  }

  getInitialIntensities() {
    const {
      initialIntensities
    } = this.state

    if (initialIntensities) return initialIntensities
    else {
      const full_url = `${CONFIG.BASE_URL}/${CONFIG.INITIAL_INTENSITIES_ENDPOINT}`
      misc.makeRequest(full_url)
        .then(response => {
          const intensities = JSON.parse(response.body)
          console.log(`got initial intensities : ${JSON.stringify({ intensities })}`)
          return intensities
        })
        .catch(error => console.error(`error getting current values: ${JSON.stringify({ error: String(error) })}`))
    }
  }

  render() {
    return (
      <div className="App">
        <RGBStripController
          getInitialIntensities={this.getInitialIntensities}
        />
        <WhiteStripController
          getInitialIntensities={this.getInitialIntensities}
        />
      </div>
    );
  }
}

export default App;
