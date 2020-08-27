import React, { Component } 					from 'react';
import { Typography, Slider } 				from '@material-ui/core';
import _                              from 'lodash';

import * as CONFIG                    from '../incl/config'
import * as misc                      from '../utils/misc'

class StripController extends Component {
  label     = 'strip'
  endpoint  = null

  constructor(props) {
    super(props)
    this.state = {
      intensities : {},
    }
  }

  updateIntensity(channel, value) {
    const {
      intensities,
    } = this.state

    intensities[channel] = value

    const full_url = `${CONFIG.BASE_URL}/${this.endpoint}?${_.map(intensities, (value, channel) => `${channel}=${value/100}`).join('&')}`
    misc.makeRequest(full_url)
      .then(response => console.log(`updated ${this.label} intensities: ${JSON.stringify({ intensities })}`))
      .catch(error => console.error(`error updating ${this.label} intensities: ${JSON.stringify({ intensities, error: String(error) })}`))

    this.setState({
      intensities
    })
  }

  render() {
    const {
      intensities
    } = this.state

    console.log(`StripController: running render: ${JSON.stringify({ label: this.label, intensities })}`)

    return (
      <div className="controls">
        <Typography variant="h6">{this.label}</Typography>
        <div className="colorControls">
          {
            _.map(intensities, (intensity, channel) => {
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
  label     = 'rgb strip'
  endpoint  = CONFIG.RGB_CONTROL_ENDPOINT

  constructor(props) {
    super(props)
    this.state = {
      intensities : {
        red         : 0,
        green       : 0,
        blue        : 0
      }
    }
  }
}

class WhiteStripController extends StripController {
  label     = 'white strip'
  endpoint  = CONFIG.WHITE_CONTROL_ENDPOINT

  constructor(props) {
    super(props)
    this.state = {
      intensities : {
        white       : 0,
      }
    }
  }
}

export  { RGBStripController, WhiteStripController };
