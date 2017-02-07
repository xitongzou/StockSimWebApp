import React, { Component } from 'react';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Main from '../Main';
import Footer from '../Footer';
import logo from './logo.svg';
import './style.css';

class App extends Component {
  render() {

    return (
    <MuiThemeProvider>
      <div className='App'>
        <div className='App-header'>
          <img src={logo} className='App-logo' alt='logo' />
          <h2>Welcome to Tong's Stock Simulator App</h2>
        </div>

        <div className='Main'>
            <Main/>
        </div>

        <Footer/>
      </div>
    </MuiThemeProvider>
    );
  }
}

export default App;
