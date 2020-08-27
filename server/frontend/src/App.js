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
      initialIntensities   : {}
    }
  }

  componentDidMount() {
    const full_url = `${CONFIG.BASE_URL}/${CONFIG.INITIAL_INTENSITIES_ENDPOINT}`
    misc.makeRequest(full_url)
      .then(response => {
        const initialIntensities = JSON.parse(response.body)
        console.log(`App: got initial intensities : ${JSON.stringify({ intensities })}`)
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
