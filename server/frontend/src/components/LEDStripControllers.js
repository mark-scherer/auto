import React, { Component } 					from 'react';
import { Typography, Slider } 				from '@material-ui/core';
import _                              from 'lodash';

import * as CONFIG                    from '../incl/config'
import * as misc                      from '../utils/misc'

class StripController extends Component {
  constructor(props) {
    super(props)
    this.state = {
      colors : {}
    }
  }

  
  updateColor(endpoint, color, value) {
    const {
      colors
    } = this.state

    colors[color] = value
    
    const full_url = `${CONFIG.BASE_URL}/${endpoint}?${_.map(colors, (value, color) => `${color}=${value/100}`).join('&')}`
    misc.makeRequest(full_url)
      .then(response => console.log(`updated colors: ${JSON.stringify({ colors })}`))
      .catch(error => console.error(`error updating colors: ${JSON.stringify({ colors, error: String(error) })}`))
    
    this.setState({
      colors
    })
  }
}

class RGBStripController extends StripController {
	constructor(props) {
    super(props)
    this.state = {
      colors : _.pick(props.currentValues, ['red', 'blue', 'green'])
    }
  }

  render() {
    const {
    	red,
    	green,
    	blue
    } = this.state.colors

    return (
      <div className="RGBStripController controls">
      	<Typography variant="h6">
          RGB Strip
        </Typography>
        <div className="colorControls">
      		<div id="red-control">
      			<Typography gutterBottom>
	        		Red
	      		</Typography>
	      		<Slider value={red} onChange={(event, newValue) => { this.updateColor(CONFIG.RGB_CONTROL_ENDPOINT, 'red', newValue) }} aria-labelledby="continuous-slider" />
      		</div>

      		<div id="green-control">
      			<Typography gutterBottom>
	        		Green
	      		</Typography>
	      		<Slider value={green} onChange={(event, newValue) => { this.updateColor(CONFIG.RGB_CONTROL_ENDPOINT, 'green', newValue) }} aria-labelledby="continuous-slider" />
      		</div>

      		<div id="blue-control">
      			<Typography gutterBottom>
	        		Blue
	      		</Typography>
	      		<Slider value={blue} onChange={(event, newValue) => { this.updateColor(CONFIG.RGB_CONTROL_ENDPOINT, 'blue', newValue) }} aria-labelledby="continuous-slider" />
      		</div>

      	</div>
      </div>
    );
  }
}

class WhiteStripController extends StripController {
  constructor(props) {
    super(props)
    this.state = {
      colors : _.pick(props.currentValues, [ 'white' ])
    }
  }

  render() {
    const {
      white
    } = this.state.colors

    return (
      <div className="WhiteStripController controls">
        <Typography variant="h6">
          White Strip
        </Typography>
        <div className="colorControls">
          <div id="white-control">
            <Typography gutterBottom>
              White
            </Typography>
            <Slider value={white} onChange={(event, newValue) => { this.updateColor(CONFIG.WHITE_CONTROL_ENDPOINT, 'white', newValue) }} aria-labelledby="continuous-slider" />
          </div>
        </div>
      </div>
    );
  }
}

export  { RGBStripController, WhiteStripController };
