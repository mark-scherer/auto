import React, { Component } 					from 'react';
import { Typography, Slider } 				from '@material-ui/core';
import _                              from 'lodash';
import request 												from 'request';

const BASE_URL 										= 'http://192.168.0.194:8080'
const RGB_CONTROL_ENDPOINT 	      = 'update_led_strip'
const WHITE_CONTROL_ENDPOINT      = 'update_white_strip'

class StripController extends Component {
  constructor(props) {
    super(props)
    this.state = {
      colors : {}
    }
  }

  makeRequest(url) {
    console.log(`making request: ${url}`)
    return new Promise((resolve, reject) => {
      request(url, function (error, response, body) {
        if (error)                        return reject(error)
        // if (response.statusCode !== 200)   return reject(`bad status code (${response.statusCode}): ${JSON.stringify(response)}`)

        return resolve(response)
      })
    })
  }

  updateColor(endpoint, color, value) {
    const {
      colors
    } = this.state

    colors[color] = value
    
    const full_url = `${BASE_URL}/${endpoint}?${_.map(colors, (value, color) => `${color}=${value/100}`).join('&')}`
      this.makeRequest(full_url)
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
      colors : {
      	red 	: 0,
      	green : 0,
      	blue 	: 0
      }
    }
  }

  render() {
    const {
    	red,
    	green,
    	blue
    } = this.state.colors

    return (
      <div className="RGBStripController">
      	<Typography gutterBottom>
          RGB Strip
        </Typography>
        <div className="colorControls controls">
      		<div id="red-control">
      			<Typography gutterBottom>
	        		Red
	      		</Typography>
	      		<Slider value={red} onChange={(event, newValue) => { this.updateColor(RGB_CONTROL_ENDPOINT, 'red', newValue) }} aria-labelledby="continuous-slider" />
      		</div>

      		<div id="green-control">
      			<Typography gutterBottom>
	        		Green
	      		</Typography>
	      		<Slider value={green} onChange={(event, newValue) => { this.updateColor(RGB_CONTROL_ENDPOINT, 'green', newValue) }} aria-labelledby="continuous-slider" />
      		</div>

      		<div id="blue-control">
      			<Typography gutterBottom>
	        		Blue
	      		</Typography>
	      		<Slider value={blue} onChange={(event, newValue) => { this.updateColor(RGB_CONTROL_ENDPOINT, 'blue', newValue) }} aria-labelledby="continuous-slider" />
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
      colors : {
        white   : 0
      }
    }
  }

  render() {
    const {
      white
    } = this.state.colors

    return (
      <div className="WhiteStripController">
        <Typography gutterBottom>
          White Strip
        </Typography>
        <div className="colorControls controls">
          <div id="white-control">
            <Typography gutterBottom>
              White
            </Typography>
            <Slider value={white} onChange={(event, newValue) => { this.updateColor(WHITE_CONTROL_ENDPOINT, 'white', newValue) }} aria-labelledby="continuous-slider" />
          </div>
        </div>
      </div>
    );
  }
}

export  { RGBStripController, WhiteStripController };
