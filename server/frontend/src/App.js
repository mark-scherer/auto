import React, { Component }                         from 'react';
import './App.css';

import * as CONFIG                                  from './incl/config'
import * as misc                                    from './utils/misc'

import { RGBStripController, WhiteStripController } from './components/LEDStripControllers';

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      intensityValues : {}
    }

    this.updateIntensity=this.updateIntensity.bind(this);
  }

  componentDidMount() {
    const full_url = `${CONFIG.BASE_URL}/${CONFIG.CURRENT_VALUES_ENDPOINT}`
    misc.makeRequest(full_url)
      .then(response => {
        console.log(`componentDidMount: got response: ${JSON.stringify({ response })}`)
        const original_intensities = 
        this.setState({
          intensityValues : _.fromPairs(_.map(JSON.parse(response.body), (channel, intensity) => [ channel, intensity*100 ])
        })
      })
      .catch(error => console.error(`error getting original intensityValues: ${JSON.stringify({ error: String(error) })}`))
  }

  updateIntensity(channel, newValue) {
    const {
      intensityValues
    } = this.state

    intensityValues[channel] = newValue

    this.setState({
      intensityValues
    })
  }

  render() {
    const {
      intensityValues
    } = this.state

    return (
      <div className="App">
        <RGBStripController
          intensityValues={intensityValues}
          updateIntensity={this.updateIntensity}
        />
        <WhiteStripController
          intensityValues={intensityValues}
          updateIntensity={this.updateIntensity}
        />
      </div>
    );
  }
}

export default App;
