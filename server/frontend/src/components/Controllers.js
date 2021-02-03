import React, { Component } 					from 'react';
import { Typography, Slider } 				from '@material-ui/core';
import _                              from 'lodash';

import * as config_public             from '../../../configs/config_public.json'
import * as config_private            from '../../../configs/config_private.json'
import * as misc                      from '../utils/misc'

const CONFIG = Object.assign({}, config_public, config_private)
const SELF_UPDATE_HOLD = 3000   // ms

class StripController extends Component {
  constructor(props) {
    super(props)

    this.outputName = props.outputName
    this.lastSelfUpdates = {}
    this.state = {
      outputState : _.cloneDeep(props.serverOutputState)
    }
  }

  updateIntensity(channel, value) {
    const {
      outputState
    } = this.state

    const full_url = `http://${CONFIG.server.host}:${CONFIG.server.port}/control/updateIntensity?output=${this.outputName}&channel=${channel}&value=${value}`
    misc.makeRequest(full_url)
      // .then(response => console.log(`updated ${this.outputName}/${channel} intensity: ${JSON.stringify({ value })}`))
      .catch(error => console.error(`error updating ${this.outputName}/${channel} intensity: ${JSON.stringify({ value, error: String(error) })}`))

    outputState[channel] = value
    this.lastSelfUpdates[channel] = new Date()

    this.setState({
      outputState
    })
  }

  render() {
    const {
      outputState
    } = this.state

    const {
      serverOutputState
    } = this.props

    const mergedOutputState = {}
    _.forEach(outputState, (selfIntensity, channel) => {
      if (this.lastSelfUpdates[channel] && (new Date() - this.lastSelfUpdates[channel]) < SELF_UPDATE_HOLD) mergedOutputState[channel] = selfIntensity
      else mergedOutputState[channel] = serverOutputState[channel]
    })

    return (
      <div className="controls">
        <Typography variant="h6">{this.outputName}</Typography>
        <div className="colorControls">
          {
            _.map(mergedOutputState, (intensity, channel) => {
              const _id = `colorControl-{this.outputName}-{this.channel}`
              return (
                <div id={_id}>
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

export  { StripController };
