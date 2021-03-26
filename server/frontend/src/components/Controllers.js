import React, { Component } 					from 'react'
import { Typography, Slider, Button } from '@material-ui/core'
import { TableContainer, Table, TableBody, TableRow, TableCell } from '@material-ui/core'
import { Paper }                      from '@material-ui/core'
import _                              from 'lodash'
import { v4 as uuid }                 from 'uuid'

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

/*
  Component for direct slider for a given output
    Handles multiple channels
  Subcomponent of StripController (or other higher level output controllers)
*/
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

/*
  Component for sequence control for a given output
  Subcomponent of StripController (or other higher level output controllers)
*/
class SequenceController extends Component {
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
            const activeMatchIds = _.chain(activeSequences)
              .toPairs()
              .filter(sequenceEntry => sequenceEntry[1].sequence_name === sanitizedName)
              .map(match => match[0])
              .value()
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

/*
  Component for scheduled sequence control for a given output
  Subcomponent of StripController (or other higher level output controllers)
*/
class ScheduleController extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    const {
      scheduledSequences,
      availableSequences
    } = this.props

    const sortedScheduledSequences = _.chain(scheduledSequences)
      .toPairs()
      .map(job_entry => {
        const job_time = new Date()
        job_time.setUTCHours(job_entry[1].trigger_time.split(':')[0])
        job_time.setUTCMinutes(job_entry[1].trigger_time.split(':')[1])
        job_time.setUTCSeconds(job_entry[1].trigger_time.split(':')[2])
        const job_sort_value = 60*60*job_time.getHours() + 60*job_time.getMinutes() + job_time.getSeconds()

        return {
          job_id: job_entry[0],
          job_time,
          job_sort_value,
          ...job_entry[1]
        }
      })
      .sortBy(job => job.job_sort_value)
      .value()
      console.log(JSON.stringify({ sortedScheduledSequences }))

    return (
      <div className='controls-component'>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableBody>
              {
                _.map(sortedScheduledSequences, job => {
                  const sequence_name = job.sequence_config.sequence_name
                  const sequence_config = availableSequences[sequence_name]
    
                  return (
                    <TableRow>
                      <TableCell>
                        {job.job_time.toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        {sequence_config.name}
                      </TableCell>
                    </TableRow>
                  )
                })
              }
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    )
  }
}

/*
  Parent control component for a given strip output
*/
class StripController extends Component {
  constructor(props) {
    super(props)

    this.outputName = props.outputName
    this.lastCmdID = null
  }

  getCmdID() {
    const id = uuid()
    this.lastCmdID = id
    return id
  }

  handleCmdResponse(response, cmd_id) {
    const {
      updateStatus
    } = this.props

    if (cmd_id === this.lastCmdID) {
      const status = JSON.parse(response.body).status
      updateStatus(status)
    }
  }

  updateIntensity(channel, value) {
    const full_url = `http://${CONFIG.server.host}:${CONFIG.server.port}/control/updateIntensity?output=${this.outputName}&channel=${channel}&value=${value}`
    const cmd_id = this.getCmdID()
    misc.makeRequest(full_url)
      .then(response => this.handleCmdResponse(response, cmd_id))
      .catch(error => console.error(`error in updateIntensity: ${JSON.stringify({ outputName: this.outputName, channel, value, error: String(error) })}`))
  }

  startSequence(sanitizedSequenceName) {
    const full_url = `http://${CONFIG.server.host}:${CONFIG.server.port}/control/startSequence?outputs=${this.outputName}&sequence=${sanitizedSequenceName}`
    const cmd_id = this.getCmdID()
    misc.makeRequest(full_url)
      .then(response => this.handleCmdResponse(response, cmd_id))
      .catch(error => console.error(`error in startSequence: ${JSON.stringify({ outputName: this.outputName, sanitizedSequenceName, error: String(error) })}`))
  }

  stopSequence(sequenceId) {
    const full_url = `http://${CONFIG.server.host}:${CONFIG.server.port}/control/stopSequence?outputs=${this.outputName}&sequence_id=${sequenceId}`
    const cmd_id = this.getCmdID()
    misc.makeRequest(full_url)
      .then(response => this.handleCmdResponse(response, cmd_id))
      .catch(error => console.error(`error in stopSequence: ${JSON.stringify({ outputName: this.outputName, sequenceId, error: String(error) })}`))
  }

  toggleSequence(sanitizedSequenceName, sequenceId, newState) {
    if (newState) this.startSequence(sanitizedSequenceName)
    else this.stopSequence(sequenceId)
  }

  render() {
    const {
      outputStatus
    } = this.props

    const sequenceControl = (
      <SequenceController 
        availableSequences={outputStatus.availableSequences} 
        activeSequences={outputStatus.activeSequences}
        onButtonClick={this.toggleSequence.bind(this)}
      />
    )

    const sliderControl = (
      <div className="controls-component" >
        {
          _.map(outputStatus.intensities, (intensity, channel) => {
            const slider_id = `colorControl-{this.outputName}-{this.channel}`
            const slider_onchange = (event, newValue) => { this.updateIntensity(channel, newValue) }
            return (
              <SliderController id={slider_id} name={channel} value={intensity} onchange={slider_onchange} />
            )
          })
        }
      </div>
    )

    const scheduleControl = (
      <ScheduleController
      scheduledSequences={outputStatus.scheduledSequences}
        availableSequences={outputStatus.availableSequences} 
      />
    )

    return (
      <div className="controls-container">
        <Typography variant="h6">{this.outputName}</Typography>
        <div className="colorControls">
          {sequenceControl}
          {sliderControl}
          {scheduleControl}
        </div>
      </div>
    );
  }
}

export  { StripController, SliderController };
