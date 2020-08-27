import React, { Component } 					from 'react';
import { Typography, Slider } 				from '@material-ui/core';
import _                              from 'lodash';

import * as CONFIG                    from '../incl/config'
import * as misc                      from '../utils/misc'

class StripController extends Component {
  label     = 'strip'
  endpoint  = null
  channels  = []

  constructor(props) {
    super(props)
    console.log(`${self.label} constructor, creating intensities: ${JSON.stringify({ channel: this.channels })}`)
    this.state = {
      intensities : _.fromPairs(_.map(this.channels), channel => [ channel, 0 ])
    }
  }

  componentDidUpdate(prevProps) {
    const {
      intensities
    } = this.state

    _.forEach(intensities, (value, channel) => {
      if (this.props.initialIntensities[channel] && 
          this.props.initialIntensities[channel] !== prevProps.initialIntensities[channel] &&
          this.props.initialIntensities[channel] !== value) {
        this.updateIntensity(channel, this.props.initialIntensities[channel])
      }
    })
  }

  updateIntensity(channel, value) {
    const {
      intensities,
    } = this.state

    intensities[channel] = value

    const full_url = `${CONFIG.BASE_URL}/${this.endpoint}?${_.map(intensities, (value, channel) => `${channel}=${value/100}`).join('&')}`
    misc.makeRequest(full_url)
      // .then(response => console.log(`updated ${this.label} intensities: ${JSON.stringify({ intensities })}`))
      .catch(error => console.error(`error updating ${this.label} intensities: ${JSON.stringify({ intensities, error: String(error) })}`))

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
  channels  = [ 'red', 'green', 'blue' ]
}

class WhiteStripController extends StripController {
  label     = 'white strip'
  endpoint  = CONFIG.WHITE_CONTROL_ENDPOINT
  channels  = [ 'white' ]
}

export  { RGBStripController, WhiteStripController };
