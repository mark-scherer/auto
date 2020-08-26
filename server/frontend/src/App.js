import React, { Component }             from 'react';
import './App.css';

import * as CONFIG                            from '../incl/config'
import * as misc                              from '../utils/misc'

import { RGBStripController, WhiteStripController } from './components/LED_Strip_Controller';

class App extends Component {
  render() {
    const full_url = `${CONFIG.BASE_URL}/${CONFIG.CURRENT_VALUES_ENDPOINT}`
    misc.makeRequest(full_url)
      .then(response => {
        return (
          <div className="App">
            <RGBStripController
              currentValues={response}
            />
            <WhiteStripController
              currentValues={response}
            />
          </div>
        );
      })
      .catch(error => console.error(`error updating colors: ${JSON.stringify({ colors, error: String(error) })}`))
  }
}

export default App;
