import React, { Component } 					from 'react';
import { Typography, Slider } 				from '@material-ui/core';
import _                              from 'lodash';

import * as config_public             from '../../../configs/config_public.json'
import * as config_private            from '../../../configs/config_private.json'
import * as misc                      from '../utils/misc'

const CONFIG = Object.assign({}, config_public, config_private)

class StripController extends Component {
  static channels   = []
  label             = 'strip'
  endpoint          = null

  constructor(props) {
    super(props)

    this.outputName = props.outputName
    this.state = {
      outputState : props.outputState
    }
  }

  // componentDidUpdate(prevProps) {
  //   const {
  //     intensities
  //   } = this.state

  //   _.forEach(intensities, (value, channel) => {
  //     if (this.props.initialIntensities[channel] && 
  //         this.props.initialIntensities[channel] !== prevProps.initialIntensities[channel] &&
  //         this.props.initialIntensities[channel] !== value) {
  //       this.updateIntensity(channel, this.props.initialIntensities[channel])
  //     }
  //   })
  // }

  updateIntensity(channel, value) {
    const {
      outputState,
    } = this.state

    outputState[channel] = value

    const full_url = `http://${CONFIG.server.host}:${CONFIG.server.port}/control/updateIntensity?output=${this.outputName}&channel=${channel}&value=${value}`
    misc.makeRequest(full_url)
      .then(response => console.log(`updated ${this.outputName}/${channel} intensity: ${JSON.stringify({ value })}`))
      .catch(error => console.error(`error updating ${this.outputName}/${channel} intensity: ${JSON.stringify({ value, error: String(error) })}`))

    this.setState({
      outputState
    })
  }

  render() {
    const {
      outputState
    } = this.state

    return (
      <div className="controls">
        <Typography variant="h6">{this.outputName}</Typography>
        <div className="colorControls">
          {
            _.map(outputState, (intensity, channel) => {
              const _id = `colorControl-{this.outputName}-{this.channel}`
              return (
                <div id={_id}>
                  <Typography gutterBottom>{channel}</Typography>
                  <Slider max=1 value={intensity} onChange={(event, newValue) => { this.updateIntensity(channel, newValue) }} aria-labelledby="continuous-slider" />
                </div>
              )
            })
          }
        </div>
      </div>
    );
  }
}

export  { StripController };
