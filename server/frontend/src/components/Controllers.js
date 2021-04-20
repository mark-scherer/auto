import React, { Component } 					from 'react'
import { Typography, Slider, Button, IconButton } from '@material-ui/core'
import { TableContainer, Table, TableBody, TableRow, TableCell } from '@material-ui/core'
import { Accordion, AccordionSummary, AccordionDetails } from '@material-ui/core'
import { FormControl, InputLabel, Select, MenuItem } from '@material-ui/core'
import { TextField }                  from '@material-ui/core'
import { Paper }                      from '@material-ui/core'
import ExpandMoreIcon                 from '@material-ui/icons/ExpandMore';
import ArrowForwardIosIcon            from '@material-ui/icons/ArrowForwardIos';
import DeleteIcon                     from '@material-ui/icons/Delete';
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
      toggleSequenceClick
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
              <Button className="controls-button" variant={variant} color="default" size="small" onClick={() => toggleSequenceClick(sanitizedName, sequenceId, !isActive)}>
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

    this.outputName = props.outputName

    const {
      availableSequences
    } = props

    this.state = {
      selectedSequence: Object.keys(availableSequences)[0],
      selectedTime: '07:00'
    }
  }

  render() {
    const {
      selectedSequence,
      selectedTime
    } = this.state

    const {
      scheduledSequences,
      availableSequences,
      scheduleSequence,
      unscheduleSequence
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
                      <TableCell>
                        <IconButton aria-label="delete" onClick={() => { unscheduleSequence(job.job_id) }}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })
              }
            </TableBody>
          </Table>
        </TableContainer>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            add sequence
          </AccordionSummary>
          <AccordionDetails style={{display: 'block'}}>
            <div className="schedule-block">
              <FormControl>
                <InputLabel id="demo-simple-select-label">sequence</InputLabel>
                <Select
                  value={selectedSequence}
                  onChange={(event) => { this.setState({ selectedSequence: event.target.value }) }}
                >
                  {
                    _.map(availableSequences, (sequence_info, sequence) => {
                      return (
                        <MenuItem value={sequence}>{sequence}</MenuItem>
                      )
                    })
                  }
                </Select>
              </FormControl>
            </div>
            <div className="schedule-block">
              <div className="schedule-block">
                <form noValidate>
                  <TextField
                    label="time"
                    type="time"
                    defaultValue={selectedTime}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      step: 300, // 5 min
                    }}
                    onChange={(event) => this.setState({ selectedTime: event.target.value })}
                  />
                </form>
              </div>
              <div className="schedule-block">
                <Button
                  variant="contained"
                  color="primary"
                  endIcon={<ArrowForwardIosIcon/>}
                  size="small"
                  style={{margin: '5px'}}
                  onClick={() => { scheduleSequence(this.state.selectedSequence, this.state.selectedTime.split(':')[0], this.state.selectedTime.split(':')[1], '00') }}
                >
                  schedule recurring
                </Button>
              </div>
            </div>
          </AccordionDetails>
        </Accordion>
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

  scheduleSequence(selectedSequence, selectedHours, selectedMins, selectedSeconds) {
    const scheduled_time = new Date()
    scheduled_time.setHours(parseInt(selectedHours))
    scheduled_time.setMinutes(parseInt(selectedMins))
    scheduled_time.setSeconds(parseInt(selectedSeconds))
    const utc_time_str = `${String(scheduled_time.getUTCHours()).padStart(2, '0')}:${String(scheduled_time.getUTCMinutes()).padStart(2, '0')}:${String(scheduled_time.getUTCSeconds()).padStart(2, '0')}`

    const full_url = `http://${CONFIG.server.host}:${CONFIG.server.port}/control/scheduleSequence?outputs=${this.outputName}&sequence=${selectedSequence}&trigger_time=${utc_time_str}`
    const cmd_id = this.getCmdID()
    misc.makeRequest(full_url)
      .then(response => this.handleCmdResponse(response, cmd_id))
      .catch(error => console.error(`error in scheduleSequence: ${JSON.stringify({ outputName: this.outputName, selectedSequence, selectedHours, selectedMins, selectedSeconds, utc_time_str, error: String(error) })}`))
  }

  unscheduleSequence(sequenceId) {
    const full_url = `http://${CONFIG.server.host}:${CONFIG.server.port}/control/unscheduleSequence?job_id=${sequenceId}`
    const cmd_id = this.getCmdID()
    misc.makeRequest(full_url)
      .then(response => this.handleCmdResponse(response, cmd_id))
      .catch(error => console.error(`error in unscheduleSequence: ${JSON.stringify({ sequenceId, error: String(error) })}`))
  }

  render() {
    const {
      outputStatus
    } = this.props

    const sequenceControl = (
      <SequenceController 
        availableSequences={outputStatus.availableSequences} 
        activeSequences={outputStatus.activeSequences}
        toggleSequenceClick={this.toggleSequence.bind(this)}
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
        scheduleSequence={this.scheduleSequence.bind(this)}
        unscheduleSequence={this.unscheduleSequence.bind(this)}
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
