import React, { Component } 					from 'react';
import { Typography, Slider } 				from '@material-ui/core';
import _                              from 'lodash';

import * as CONFIG                    from '../incl/config'
import * as misc                      from '../utils/misc'

class StripController extends Component {
  constructor(props) {
    super(props)
    this.state = {
      label       : 'strip',
      intensities : {},
      endpoint    : null
    }
  }

  updateIntensity(channel, value) {
    const {
      intensities
    } = this.state

    intensities[channel] = value

    const full_url = `${CONFIG.BASE_URL}/${self.endpoint}?${_.map(intensities, (value, channel) => `${channel}=${value/100}`).join('&')}`
    misc.makeRequest(full_url)
      .then(response => console.log(`updated ${self.label} intensities: ${JSON.stringify({ intensities })}`))
      .catch(error => console.error(`error updating ${self.label} intensities: ${JSON.stringify({ intensities, error: String(error) })}`))

    this.setState({
      intensities
    })
  }

  render() {
    const {
      intensities
    } = this.state

    return (
      <div className="controls">
        <Typography variant="h6">{self.label}</Typography>
        <div className="colorControls">
          {
            _.map(self.intensities, (intensity, channel) => {
              return (
                <div id="red-control">
                  <Typography gutterBottom>{channel}</Typography>
                  <Slider value={intensity} onChange={(event, newValue) => { this.updateIntensity(channel, newValue) }} aria-labelledby="continuous-slider" />
                </div>
              )
            })
          }
        </div>
      </div>
    );
  }
}

class RGBStripController extends StripController {
  constructor(props) {
    super(props)
    this.state = {
      label       : 'rgb strip',
      intensities : {
        red         : 0,
        green       : 0,
        blue        : 0
      },
      endpoint    : CONFIG.RGB_CONTROL_ENDPOINT
    }
  }
}

class WhiteStripController extends StripController {
  constructor(props) {
    super(props)
    this.state = {
      label       : 'white strip',
      intensities : {
        white       : 0,
      },
      endpoint    : CONFIG.WHITE_CONTROL_ENDPOINT
    }
  }
}

export  { RGBStripController, WhiteStripController };
