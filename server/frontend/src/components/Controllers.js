import React, { Component } 					from 'react';
import { Typography, Slider, Button } from '@material-ui/core';
import _                              from 'lodash';

import * as config_public             from '../../../configs/config_public.json'
import * as config_private            from '../../../configs/config_private.json'
import * as misc                      from '../utils/misc'

/*
  To do:
  - add section for buttons across multiple outputs
  - add more sequences
  - make starting an output kill other active sequences
*/

const CONFIG = Object.assign({}, config_public, config_private)
const SELF_UPDATE_HOLD = 3000   // ms

// control for single slider
class SliderController extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    const {
      id,
      name,
      value,
      onchange
    } = this.props

    return (
      <div id={id}>
        <Typography gutterBottom>{name}</Typography>
        <Slider value={value} onChange={onchange} aria-labelledby="continuous-slider" />
      </div>
    )
  }
}

// control for multiple sequences
class SequenceController extends Component{
  constructor(props) {
    super(props)
  }
  render() {
    const {
      availableSequences,
      activeSequences,
      onButtonClick
    } = this.props

    return (
      <div className="controls-component">
        {
          _.map(availableSequences, (sequenceConfig, sanitizedName) => {
            const activeMatchIds = _.map(_.filter(_.toPairs(activeSequences), sequenceEntry => sequenceEntry[1].name === sanitizedName), match => match[0])
            const isActive = activeMatchIds.length > 0
            const sequenceId = isActive ? activeMatchIds[0] : null
            // const anyActive = Object.keys(activeSequences).length > 0
            const variant = isActive ? 'outlined' : 'text'

            return (
              <Button className="controls-button" variant={variant} color="default" size="small" onClick={() => onButtonClick(sanitizedName, sequenceId, !isActive)}>
                {sequenceConfig.name}
              </Button>
            )
          })
        }
      </div>
    )
  }
}

class StripController extends Component {
  constructor(props) {
    super(props)

    this.outputName = props.outputName
    this.lastSelfUpdate = -1
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
      .catch(error => console.error(`error in updateIntensity: ${JSON.stringify({ outputName: this.outputName, channel, value, error: String(error) })}`))

    // since slider updates happen in rapid succession, don't want server to update with stale value
    outputState.intensities[channel] = value
    this.lastSelfUpdate = new Date()

    this.setState({
      outputState
    })
  }

  startSequence(sanitizedSequenceName, arg2, arg3) {
    const full_url = `http://${CONFIG.server.host}:${CONFIG.server.port}/control/startSequence?outputs=${this.outputName}&sequence=${sanitizedSequenceName}`
    misc.makeRequest(full_url)
      .catch(error => console.error(`error in startSequence: ${JSON.stringify({ outputName: this.outputName, sanitizedSequenceName, error: String(error) })}`))
  }

  stopSequence(sequenceId) {
    const full_url = `http://${CONFIG.server.host}:${CONFIG.server.port}/control/stopSequence?outputs=${this.outputName}&sequence_id=${sequenceId}`
    misc.makeRequest(full_url)
      .then(response => {
        // let main App update server state here
        this.props.updateServerState()
        this.lastSelfUpdate = -1
      })
      .catch(error => console.error(`error in stopSequence: ${JSON.stringify({ outputName: this.outputName, sequenceId, error: String(error) })}`))
  }

  toggleSequence(sanitizedSequenceName, sequenceId, newState) {
    console.log(`toggleSequence called with ${JSON.stringify({sanitizedSequenceName, newState})}`)
    if (newState) this.startSequence(sanitizedSequenceName)
    else this.stopSequence(sequenceId)
  }

  render() {
    const {
      outputState
    } = this.state

    const {
      serverOutputState
    } = this.props

    const mergedOutputState = (new Date() - this.lastSelfUpdate) < SELF_UPDATE_HOLD ? outputState : serverOutputState

    const sequenceControl = (
      <SequenceController 
        availableSequences={mergedOutputState.availableSequences} 
        activeSequences={mergedOutputState.activeSequences} 
        onButtonClick={this.toggleSequence.bind(this)}
      />
    )

    const sliderControl = (
      <div className="controls-component" >
        {
          _.map(mergedOutputState.intensities, (intensity, channel) => {
            const slider_id = `colorControl-{this.outputName}-{this.channel}`
            const slider_onchange = (event, newValue) => { this.updateIntensity(channel, newValue) }
            return (
              <SliderController id={slider_id} name={channel} value={intensity} onchange={slider_onchange} />
            )
          })
        }
      </div>
    )

    return (
      <div className="controls-container">
        <Typography variant="h6">{this.outputName}</Typography>
        <div className="colorControls">
          {sequenceControl}
          {sliderControl}
        </div>
      </div>
    );
  }
}

export  { StripController, SliderController };
