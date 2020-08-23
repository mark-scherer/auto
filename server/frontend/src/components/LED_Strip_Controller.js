import React, { Component } 					from 'react';
import { Typography, Slider } 				from '@material-ui/core';

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

  updateColor(color, value) {
  	console.log(`updating color: ${color}, ${value}`)

  	let stateUpdates = {}
  	stateUpdates[color] = value
  	this.setState(stateUpdates)
  }

  render() {
    const {
    	red,
    	green,
    	blue
    } = this.state.colors

    return (
      <div className="LEDStripController">
      	<div className="colorControls"
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
