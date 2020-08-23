import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import LEDStripController from './components/LED_Strip_Controller';

class App extends Component {
  render() {
    return (
      <div className="App">
        <LEDStripController/>
      </div>
    );
  }
}

export default App;
