import React, { PropTypes, Component } from 'react';
import fetchJsonp from 'fetch-jsonp';
import highcharts from 'highcharts';
import exporting from 'highcharts/modules/exporting';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';

import './style.css';

export default class Main extends Component {

    constructor(props) {
        super(props);

        // default values
        this.state = {
            startDate: '2000-01-01',
            endDate: '2017-01-01',
            stock: 'AAPL',
            buyingPower: 10000
        };

        this.handleInputChange = this.handleInputChange.bind(this);
        this.fetch = this.fetch.bind(this);
        this.simulate = this.simulate.bind(this);
    }

    handleInputChange(e) {
        const target = e.target;
        const value = target.value;
        const name = target.name;

        this.setState({
            [name]: value
        });
    }

    fetch() {
        const simulate = this.simulate;

        const url = 'http://dev.markitondemand.com/MODApis/Api/v2/InteractiveChart/jsonp?parameters=%7B%22Normalized%22%3Afalse%2C%22StartDate%22%3A%22' +
            this.state.startDate + 'T00%3A00%3A00-00%22%2C%22EndDate%22%3A%22' +
            this.state.endDate + 'T00%3A00%3A00-00%22%2C%22NumberOfDays%22%3A365%2C%22DataPeriod%22%3A%22Day%22%2CLabelPeriod%3A%22Day%22%2C%22Elements%22%3A%5B%7B%22Symbol%22%3A%22' +
            this.state.stock + '%22%2C%22Type%22%3A%22price%22%2C%22Params%22%3A%5B%22c%22%5D%7D%5D%7D';

        fetchJsonp(url)
            .then(function(response) {
                return response.json();
            }).then(function(json) {
                console.log('parsed json', json);
                simulate(json);
            }).catch(function(ex) {
                console.error('parsing failed', ex)
            });
    }

    simulate(data) {

        const dates = data.Dates || [];
        const prices = data.Elements ? data.Elements[0].DataSeries.close.values : [];

        highcharts.chart('container', {
            title: {
                text: 'Simulation for ' + this.state.stock + ' from ' + this.state.startDate + ' to ' + this.state.endDate,
                x: -20 //center
            },
            subtitle: {
                text: 'Source: dev.markitondemand.com',
                x: -20
            },
            xAxis: {
                categories: dates
            },
            yAxis: {
                title: {
                    text: 'Share Price (USD)'
                },
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }]
            },
            tooltip: {
                valuePrefix: '$'
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle',
                borderWidth: 0
            },
            series: [{
                name: this.state.stock,
                data: prices
            }]
        });
    }

    render() {
        return (
            <div class="Main">
                <form class="inputForm">
                    <label>Stock Symbol: </label>
                    <TextField name="stock" hintText="AAPL" onChange={this.handleInputChange} />
                    <label>Start Date: </label>
                    <TextField name="startDate" hintText="2000-01-01" onChange={this.handleInputChange} />
                    <label>End Date: </label>
                    <TextField name="endDate" hintText="2017-01-01" onChange={this.handleInputChange} />
                    <label>Buying Power: </label>
                    <TextField name="buyingPower" hintText="10000" onChange={this.handleInputChange} />
                    <FlatButton label="Simulate" onClick={this.fetch} />
                </form>
                <div id="container"></div>
            </div>
        );
    }
}