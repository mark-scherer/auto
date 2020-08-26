import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { RGBStripController, WhiteStripController } from './components/LED_Strip_Controller';

class App extends Component {
  render() {
    return (
      <div className="App">
        <RGBStripController/>
        <WhiteStripController/>
      </div>
    );
  }
}

export default App;
