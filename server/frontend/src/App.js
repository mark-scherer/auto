import React, { Component }                         from 'react';
import _                                            from 'lodash';
import './App.css';

import * as CONFIG                                  from './incl/config'
import * as misc                                    from './utils/misc'

import { RGBStripController, WhiteStripController } from './components/LEDStripControllers';

class App extends Component {
  render() {
    const {
      intensityValues
    } = this.state

    return (
      <div className="App">
        <RGBStripController/>
        <WhiteStripController/>
      </div>
    );
  }
}

export default App;
