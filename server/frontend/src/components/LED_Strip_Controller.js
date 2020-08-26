import React, { Component } 					from 'react';
import { Typography, Slider } 				from '@material-ui/core';
import _                              from 'lodash';
import request 												from 'request';

const BASE_URL 										= 'http://192.168.0.194:8080'
const LED_STRIP_CONTROL_ENDPOINT 	= 'update_led_strip'

class LEDStripController extends Component {
	constructor(props) {
    super(props)
    this.state = {
      colors : {
      	red 	: 0,
      	green : 0,
      	blue 	: 0
      }
    }
  }

  makeRequest(url) {
  	console.log(`making request: ${url}`)
  	return new Promise((resolve, reject) => {
  		request(url, function (error, response, body) {
  			if (error) 												return reject(error)
  			// if (response.statusCode !== 200) 	return reject(`bad status code (${response.statusCode}): ${JSON.stringify(response)}`)

  			return resolve(response)
			})
  	})
  }

  updateColor(color, value) {
  	const {
  		colors
  	} = this.state

  	colors[color] = value
  	
    // request in callback to reduce unnecessary back-to-back requests
  	this.setState({
  		colors
  	}, () => {
      const full_url = `${BASE_URL}/${LED_STRIP_CONTROL_ENDPOINT}?${_.map(colors, (value, color) => `${color}=${value/100}`).join('&')}`
      this.makeRequest(full_url)
        .then(response => console.log(`updated colors: ${JSON.stringify({ colors })}`))
        .catch(error => console.error(`error updating colors: ${JSON.stringify({ colors, error: String(error) })}`))
    })
  }

  render() {
    const {
    	red,
    	green,
    	blue
    } = this.state.colors

    return (
      <div className="LEDStripController">
      	<div className="colorControls controls">
      		<div id="red-control">
      			<Typography gutterBottom>
	        		Red
	      		</Typography>
	      		<Slider value={red} onChange={(event, newValue) => { this.updateColor('red', newValue) }} aria-labelledby="continuous-slider" />
      		</div>

      		<div id="green-control">
      			<Typography gutterBottom>
	        		Green
	      		</Typography>
	      		<Slider value={green} onChange={(event, newValue) => { this.updateColor('green', newValue) }} aria-labelledby="continuous-slider" />
      		</div>

      		<div id="blue-control">
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

export default LEDStripController;
