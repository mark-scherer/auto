import React, { Component } 					from 'react';
import { Typography, Slider } 				from '@material-ui/core';
import _                              from 'lodash';

import * as CONFIG                    from '../incl/config'
import * as misc                      from '../utils/misc'

class RGBStripController extends Component {

  updateColor(channel, value) {
    const colors = {
      red     : this.props.intensityValues.red    || 0,
      green   : this.props.intensityValues.green  || 0,
      blue    : this.props.intensityValues.blue   || 0,
    }
    colors[channel] = value
    
    const full_url = `${CONFIG.BASE_URL}/${CONFIG.RGB_CONTROL_ENDPOINT}?${_.map(colors, (value, color) => `${color}=${value/100}`).join('&')}`
    misc.makeRequest(full_url)
      .then(response => console.log(`updated rgb colors: ${JSON.stringify({ colors })}`))
      .catch(error => console.error(`error updating rgb colors: ${JSON.stringify({ colors, error: String(error) })}`))
    
    this.props.updateIntensity(channel, value)
  }

  render() {
    const {
    	red,
    	green,
    	blue
    } = this.props.intensityValues

    console.log(`rgb controller, got this.props.intensityValues: ${JSON.stringify({ red, green, blue })}`)

    return (
      <div className="RGBStripController controls">
      	<Typography variant="h6">
          RGB Strip
        </Typography>
        <div className="colorControls">
      		<div id="red-control" key={this.props.intensityValues.red}>
      			<Typography gutterBottom>
	        		Red
	      		</Typography>
	      		<Slider value={red} onChange={(event, newValue) => { this.updateColor('red', newValue) }} aria-labelledby="continuous-slider" />
      		</div>

      		<div id="green-control" key={this.props.intensityValues.green}>
      			<Typography gutterBottom>
	        		Green
	      		</Typography>
	      		<Slider value={green} onChange={(event, newValue) => { this.updateColor('green', newValue) }} aria-labelledby="continuous-slider" />
      		</div>

      		<div id="blue-control" key={this.props.intensityValues.blue}>
      			<Typography gutterBottom>
	        		Blue
	      		</Typography>
	      		<Slider value={blue} onChange={(event, newValue) => { this.updateColor('blue', newValue) }} aria-labelledby="continuous-slider" />
      		</div>

      	</div>
      </div>
    );
  }
}

class WhiteStripController extends Component {

  updateColor(channel, value) {
    const colors = {
      white     : this.props.intensityValues.white  || 0
    }
    colors[channel] = value
    
    const full_url = `${CONFIG.BASE_URL}/${CONFIG.WHITE_CONTROL_ENDPOINT}?${_.map(colors, (value, color) => `${color}=${value/100}`).join('&')}`
    misc.makeRequest(full_url)
      .then(response => console.log(`updated white colors: ${JSON.stringify({ colors })}`))
      .catch(error => console.error(`error updating white colors: ${JSON.stringify({ colors, error: String(error) })}`))
    
    this.props.updateIntensity(channel, value)
  }

  render() {
    const {
      white
    } = this.props.intensityValues

    return (
      <div className="WhiteStripController controls">
        <Typography variant="h6">
          White Strip
        </Typography>
        <div className="colorControls">
          <div id="white-control" key={this.props.intensityValues.white}>
            <Typography gutterBottom>
              White
            </Typography>
            <Slider value={white} onChange={(event, newValue) => { this.updateColor('white', newValue) }} aria-labelledby="continuous-slider" />
          </div>
        </div>
      </div>
    );
  }
}

export  { RGBStripController, WhiteStripController };
