import React, { Component } from 'react';
import fetchJsonp from 'fetch-jsonp';
import highcharts from 'highcharts';
import RaisedButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import dowList from '../../data/djia.json';
import nasdaqList from '../../data/ixic.json';
import spList from '../../data/sp500.json';

import './style.css';

export default class Main extends Component {

    constructor(props) {
        super(props);

        // default values
        this.state = {
            startDate: '2000-01-01',
            endDate: '2017-01-01',
            stock: 'AAPL',
            buyingPower: 10000,
            stopLimit: 0.75,
            sellLimit: 1.05,
            fees: 9.95,
            spinnerVisible: false,
            analysisText: [],
            // TODO: I want this to be a HashMap in the future if I can get it working
            simulationPoints: []
        };

        this.handleInputChange = this.handleInputChange.bind(this);
        this.addToAnalysis = this.addToAnalysis.bind(this);
        this.addSimulationPoint = this.addSimulationPoint.bind(this);
        this.resetSimulationPoints = this.resetSimulationPoints.bind(this);
        this.renderChart = this.renderChart.bind(this);
        this.renderSimulation = this.renderSimulation.bind(this);
        this.showHideSpinner = this.showHideSpinner.bind(this);
        this.simulate = this.simulate.bind(this);
        this.fetch = this.fetch.bind(this, dowList, nasdaqList, spList);
    }

    handleInputChange(e) {
        const target = e.target;
        const value = target.value;
        const name = target.name;

        this.setState({
            [name]: value
        });
    }

    showHideSpinner(spinnerVisible) {
        this.setState({
            spinnerVisible: spinnerVisible
        });
    }

    addToAnalysis(text) {
        this.setState({
           analysisText: this.state.analysisText.concat(text)
        });
    }

    addSimulationPoint(name, date, action, numShares, price) {
        this.setState({
            simulationPoints: this.state.simulationPoints.concat({name, date, action, numShares, price})
        });
    }

    resetSimulationPoints() {
        this.setState({
            simulationPoints: []
        })
    }

    renderChart(stock, dates, prices) {
        highcharts.chart('chartContainer', {
            chart: {
                zoomType: 'x'
            },
            title: {
                text: 'Simulation for ' + stock + ' from ' + this.state.startDate + ' to ' + this.state.endDate,
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
            plotOptions: {
                area: {
                    fillColor: {
                        linearGradient: {
                            x1: 0,
                            y1: 0,
                            x2: 0,
                            y2: 1
                        },
                        stops: [
                            [0, highcharts.getOptions().colors[0]],
                            [1, highcharts.Color(highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                        ]
                    },
                    marker: {
                        radius: 2
                    },
                    lineWidth: 1,
                    states: {
                        hover: {
                            lineWidth: 1
                        }
                    },
                    threshold: null
                }
            },
            series: [{
                type: 'area',
                name: stock,
                data: prices
            }]
        });
    }

    renderSimulation(stock, dates, prices) {
        // stupid; highslideJS doesn't have an npm package so have to reference it client-side
        const hs = window.hs;
        const simulationPoints = this.state.simulationPoints;

        highcharts.chart('simulationContainer', {

            title: {
                text: 'Simulation data points for ' + stock
            },

            subtitle: {
                text: 'Click on each data point for information'
            },

            xAxis: {
                categories: dates
            },

            yAxis: [{ // left y axis
                title: {
                    text: 'Share price (USD)'
                },
                labels: {
                    align: 'left',
                    x: 3,
                    y: 16,
                    format: '{value:.,0f}'
                },
                showFirstLabel: false
            }, { // right y axis
                linkedTo: 0,
                gridLineWidth: 0,
                opposite: true,
                title: {
                    text: null
                },
                labels: {
                    align: 'right',
                    x: -3,
                    y: 16,
                    format: '{value:.,0f}'
                },
                showFirstLabel: false
            }],

            legend: {
                align: 'left',
                verticalAlign: 'top',
                y: 20,
                floating: true,
                borderWidth: 0
            },

            tooltip: {
                shared: true,
                crosshairs: true
            },

            plotOptions: {
                series: {
                    cursor: 'pointer',
                    point: {
                        events: {
                            click: function (e) {
                                hs.htmlExpand(null, {
                                    pageOrigin: {
                                        x: e.pageX || e.clientX,
                                        y: e.pageY || e.clientY
                                    },
                                    headingText: this.category.split('T')[0],
                                    maincontentText: simulationPoints[this.index].action + ' ' +
                                    simulationPoints[this.index].numShares + ' shares at $' + this.y,
                                    width: 200
                                });
                            }
                        }
                    },
                    marker: {
                        lineWidth: 1
                    }
                }
            },

            series: [{
                name: stock,
                data: prices
            }]
        });
    }

    fetch(dowList, nasdaqList, spList) {
        const simulate = this.simulate;
        const showHideSpinner = this.showHideSpinner;
        showHideSpinner(true);

        const url = 'http://dev.markitondemand.com/MODApis/Api/v2/InteractiveChart/jsonp?parameters=%7B%22Normalized%22%3Afalse%2C%22StartDate%22%3A%22' +
            this.state.startDate + 'T00%3A00%3A00-00%22%2C%22EndDate%22%3A%22' +
            this.state.endDate + 'T00%3A00%3A00-00%22%2C%22NumberOfDays%22%3A365%2C%22DataPeriod%22%3A%22Day%22%2CLabelPeriod%3A%22Day%22%2C%22Elements%22%3A%5B%7B%22Symbol%22%3A%22' +
            this.state.stock + '%22%2C%22Type%22%3A%22price%22%2C%22Params%22%3A%5B%22c%22%5D%7D%5D%7D';

        fetchJsonp(url)
            .then((response) => response.json())
            .then((json) => {
                console.log('parsed json', json);
                simulate(json, dowList, nasdaqList, spList);
                showHideSpinner(false);
            }).catch((ex) => {
                console.error('parsing failed', ex)
            });
    }

    simulate(data, dowList, nasdaqList, spList) {

        const dates = [];
        const dateFormat = (date) => date.split('T')[0];

        for (let i = 0; i < data.Dates.length; i++) {
            dates.push(dateFormat(data.Dates[i]));
        }

        const prices = data.Elements ? data.Elements[0].DataSeries.close.values : [];
        const stock = this.state.stock;
        const addToAnalysis = this.addToAnalysis;
        const renderChart = this.renderChart;
        const addSimulationPoint = this.addSimulationPoint;
        const simulationPoints = this.state.simulationPoints;
        const showHideSpinner = this.showHideSpinner;
        const sellLimit = this.state.sellLimit;
        const stopLimit = this.state.stopLimit;
        const fees = this.state.fees;
        const buyingPower = this.state.buyingPower;
        // TODO: I want these to be HashMaps in the future if I can get it working
        const dowJonesPer = [];
        const nasdaqPer = [];
        const spPer = [];

        // reset state
        this.resetSimulationPoints();

        addToAnalysis(<h3>Calculating Indices...</h3>);

        // calculate indices
        for (let i = 0; i < dowList.length; i++) {
            const date = dowList[i].Date;
            const open = dowList[i].Open;

            let num1;

            if (i > 0) {
                num1 = dowList[i-1].Open
            } else {
                num1 = open;
            }

            const num2 = open;
            const percentDiff = ((num2 - num1) / num2) * 100;
            dowJonesPer.push({date, open, percentDiff});
        }

        for (let i = 0; i < nasdaqList.length; i++) {
            const date = nasdaqList[i].Date;
            const open = nasdaqList[i].Open;

            let num1;

            if (i > 0) {
                num1 = nasdaqList[i-1].Open
            } else {
                num1 = open;
            }

            const num2 = open;
            const percentDiff = ((num2 - num1) / num2) * 100;
            nasdaqPer.push({date, open, percentDiff});
        }

        for (let i = 0; i < spList.length; i++) {
            const date = spList[i].Date;
            const open = spList[i].Open;

            let num1;

            if (i > 0) {
                num1 = spList[i-1].Open
            } else {
                num1 = open;
            }

            const num2 = open;
            const percentDiff = ((num2 - num1) / num2) * 100;
            spPer.push({date, open, percentDiff});
        }

        addToAnalysis(<h3>Analyzing predictions for {this.state.stock}...</h3>);

        if (dates.length > 0 && prices.length > 0) {

            let avg = 0.0;
            let buyPrice = 0.0;
            let support = prices[0];
            let resistance = 0.00;
            let sellLim = 0.0;
            let stopLim = 0.0;
            let profit = 0.0;
            let total = 0.0;
            let numShares = 0;
            let bought = false;
            let sold = false;
            let shortSell = false;
            let enableShortSell = false;
            let nextPrice = 0.0;
            let trades = 0;
            let success = 0;
            let variance = 0.0;
            let varAvg = 0.0;
            let stdDev = 0.0;
            let volatily = 0.0;
            let trendCount = 0;
            let prevAvg = 0.0;
            let downTrend = false;
            let upTrend = false;
            let avgList = [];

            // Calculate Support (lowest of 30 day avg)
            // Calculate Resistance (highest of 30 day avg)
            // Calculate 10-day moving average
            for (let i = 0; i < 30; i++) {
                let tempInt = prices[i];
                varAvg += tempInt;

                if (i < 10) {
                    support = Math.min(support, tempInt);
                    resistance = Math.max(resistance, tempInt);
                    avg += tempInt;
                }
            }

            avg = avg / 10;
            varAvg = varAvg / 30;

            // calc variance for 30 days
            for (let i = 0; i < 30; i++) {
                let tempInt = prices[i];
                variance += Math.pow((tempInt - varAvg), 2);
            }

            stdDev = Math.sqrt(variance / 29);
            volatily = stdDev / avg;

            // populate avgList
            for (let i = 0; i < 5; i++) {
                avgList.unshift(avg);
            }

            // Main loop
            for (let i = 10; i < prices.length; i++) {

                nextPrice = prices[i];

                // if it detects a downtrend
                if (downTrend) {

                    // stock is bearish
                    let cond = !bought && nextPrice <= support;

                    if (volatily > 0.2) {
                        cond = !bought;
                    }

                    // if short sell is enabled
                    // disabled this whole section for now. Short selling is complicated.
                    if (cond && enableShortSell) {

                        shortSell = true;
                        buyPrice = nextPrice;
                        bought = true;
                        sold = false;
                        sellLim = buyPrice * 1.1;
                        stopLim = buyPrice * 0.95;
                        addSimulationPoint(stock, dateFormat(dates[i]), 'Shorted', numShares, nextPrice);
                        trades++;

                    } else if (bought && !sold && enableShortSell) {

                        if (shortSell) {

                            if (nextPrice >= sellLim) {

                                profit = (numShares * buyPrice - numShares * nextPrice);
                                total += profit;
                                sold = true;
                                bought = false;
                                shortSell = false;
                                addSimulationPoint(stock, dateFormat(dates[i]), 'Covered', numShares, nextPrice);
                                trades++;

                            } else if (nextPrice <= stopLim) {

                                profit = (numShares * buyPrice - numShares * nextPrice);
                                total += profit;
                                sold = true;
                                bought = false;
                                shortSell = false;
                                addSimulationPoint(stock, dateFormat(dates[i]), 'Shorted', numShares, nextPrice);
                                trades++;
                                success++;

                            }
                        } else {

                            // if stock is above the sell limit
                            if (nextPrice >= sellLim) {

                                profit = (numShares * nextPrice - numShares * buyPrice);
                                total += profit;
                                sold = true;
                                bought = false;
                                addSimulationPoint(stock, dateFormat(dates[i]), 'Sold', numShares, nextPrice);
                                trades++;
                                success++;

                            }
                            // if stock falls below the stop limit, sell.
                            else if (nextPrice <= stopLim) {

                                profit = (numShares * nextPrice - numShares * buyPrice);
                                total += profit;
                                sold = true;
                                bought = false;
                                addSimulationPoint(stock, dateFormat(dates[i]), 'Sold', numShares, nextPrice);
                                trades++;

                            }
                        }
                    }

                } else {

                    // this is when it buys
                    // change to 0.95 to whatever your buy point is
                    if (!bought) {

                        const index1 = spPer[i].percentDiff;
                        const index2 = dowJonesPer[i].percentDiff;
                        const index3 = nasdaqPer[i].percentDiff;

                        let bearDay = false;
                        if (index1 != null && index2 != null && index3 != null) {
                            bearDay = (index1 <= -0.8 && index2 <= -0.8 && index3 <= -0.8);
                        }
                        let buyCond = upTrend && nextPrice <= avg;
                        if (volatily > 0.2) {
                            buyCond = upTrend;
                        }
                        // stock is bullish
                        if (buyCond && bearDay) {

                            buyPrice = nextPrice;
                            let num = buyingPower / nextPrice;
                            numShares = Math.floor(num);
                            bought = true;
                            sold = false;
                            if (volatily >= 0.3) {
                                sellLim = buyPrice * 1.1;
                            } else {
                                sellLim = buyPrice * sellLimit;
                            }
                            stopLim = buyPrice * stopLimit;
                            addSimulationPoint(stock, dateFormat(dates[i]), 'Bought', numShares, buyPrice);
                            trades++;

                        } else if (nextPrice <= avg * 0.95 && bearDay) {

                            // stock is neutral
                            buyPrice = nextPrice;
                            let num = buyingPower / nextPrice;
                            numShares = Math.floor(num);
                            bought = true;
                            sold = false;
                            sellLim = buyPrice * sellLimit;
                            stopLim = buyPrice * stopLimit;
                            addSimulationPoint(stock, dateFormat(dates[i]), 'Bought', numShares, buyPrice);
                            trades++;

                        }

                    } else if (bought && !sold) {

                        if (shortSell) {

                            if (nextPrice >= sellLim) {

                                profit = (numShares * buyPrice - numShares * nextPrice);
                                total += profit;
                                sold = true;
                                bought = false;
                                shortSell = false;
                                addSimulationPoint(stock, dateFormat(dates[i]), 'Covered', numShares, nextPrice);
                                trades++;

                            } else if (nextPrice <= stopLim) {

                                profit = (numShares * buyPrice - numShares * nextPrice);
                                total += profit;
                                sold = true;
                                bought = false;
                                shortSell = false;
                                addSimulationPoint(stock, dateFormat(dates[i]), 'Covered', numShares, nextPrice);
                                trades++;
                                success++;

                            }

                        } else {

                            const index1 = spPer[i].percentDiff;
                            const index2 = dowJonesPer[i].percentDiff;
                            const index3 = nasdaqPer[i].percentDiff;

                            // use this variable for higher returns but less success rate
                            let bullDay = false;
                            if (index1 != null && index2 != null && index3 != null) {
                                bullDay = (index1 > 0.4 && index2 > 0.4 && index3 > 0.4);
                            }

                            // if stock is above the sell limit
                            if (nextPrice >= sellLim && bullDay) {

                                profit = (numShares * nextPrice - numShares * buyPrice);
                                total += profit;
                                sold = true;
                                bought = false;
                                addSimulationPoint(stock, dateFormat(dates[i]), 'Sold', numShares, nextPrice);
                                trades++;
                                success++;

                            }

                            // if stock falls below the stop limit and its a bull day (very likely something bad about the stock), sell.
                            else if (nextPrice <= stopLim && bullDay) {

                                profit = (numShares * nextPrice - numShares * buyPrice);
                                total += profit;
                                sold = true;
                                bought = false;
                                addSimulationPoint(stock, dateFormat(dates[i]), 'Sold', numShares, nextPrice);
                                trades++;

                            }
                        }
                    }
                }

                // recompute 10-day rolling average
                prevAvg = avg;
                avg = avg * 10;
                avg -= prices[i - 10];
                avg += nextPrice;
                avg = avg / 10;
                avgList.shift();
                avgList.unshift(avg);

                // Detect trends
                if (avg < prevAvg) {
                    upTrend = false;
                    if (trendCount < 10) {
                        trendCount++;
                    }
                } else if (avg > prevAvg) {
                    downTrend = false;
                    if (trendCount > 0) {
                        trendCount--;
                    }
                }

                let isDown = 0;
                let isUp = 0;
                for (let j = 0; j < avgList.length - 1; j++) {
                    if (avgList[j] <= avgList[j + 1]) {
                        isUp++;
                    } else if (avgList[j] >= avgList[j + 1]) {
                        isDown++;
                    }
                }

                // if stock goes down for 5 days consecutively, its on a downtrend
                if (isDown > 5) {
                    downTrend = true;
                }

                // if a stock goes up for 5 days consecutively, its on an uptrend
                else if (isUp > 5) {
                    upTrend = true;
                }

                // recalculate support + resistance + variance for 30-day
                support = prices[i - 10];
                resistance = prices[i - 10];

                if (i > 30) {

                    variance -= Math.pow(prices[i - 1 - 30] - varAvg, 2);
                    varAvg = 0.0;

                    for (let j = 0; j < 30; j++) {
                        varAvg += prices[i - (30 - j)];
                    }

                    varAvg = varAvg / 30;
                    variance += Math.pow(nextPrice - varAvg, 2);
                    stdDev = Math.sqrt(variance / 29);
                    volatily = stdDev / avg;

                }

                for (let j = 0; j < 10; j++) {
                    let tempInt = prices[i - (10 - j)];
                    support = Math.min(support, tempInt);
                    resistance = Math.max(resistance, tempInt);
                }
            }

            if (downTrend) {

                addToAnalysis(<h3>Stock is on a downtrend. Do not buy it. Expect to short it/sell it.</h3>);

            } else if (upTrend) {

                addToAnalysis(<h3>Stock is on an uptrend. Expect to buy it around ${Math.round(avg)}
                    &nbsp; when S&P 500 index &le; {Math.round(spList[0].Open * 0.992)}
                    &nbsp; and when Dow Jones index &le; {Math.round(dowList[0].Open * 0.992)}
                    &nbsp; and when NASDAQ index &le; {Math.round(nasdaqList[0].Open * 0.992)} </h3>);

            } else {

                addToAnalysis(<h3>Stock is neutral. Buy in around ${Math.round(avg * 0.95)}
                    &nbsp; when S&P 500 index &le; {Math.round(spList[0].Open * 0.992)}
                    &nbsp; and when Dow Jones index &le; {Math.round(dowList[0].Open * 0.992)}
                    &nbsp; and when NASDAQ index &le; {Math.round(nasdaqList[0].Open * 0.992)} </h3>);

            }

            if (!sold && bought) {

                if (shortSell) {

                    addToAnalysis(<h3>Next cover price is ${Math.round(stopLim)}</h3>);

                } else {

                    addToAnalysis(<h3>Sell it at ${Math.round(stopLim)} or below, or ${Math.round(sellLim)} or above
                        &nbsp; when S&P 500 index &ge; {Math.round(spList[0].Open * 0.992)}
                        &nbsp; and when Dow Jones index &ge; {Math.round(dowList[0].Open * 0.992)}
                        &nbsp; and when NASDAQ index &ge; {Math.round(nasdaqList[0].Open * 0.992)} </h3>);

                }
            }

            addToAnalysis(<h3>Support price is ${Math.round(support)}</h3>);
            addToAnalysis(<h3>Resistance price is ${Math.round(resistance)}</h3>);
            addToAnalysis(<h3>Std Dev = ${Math.round(stdDev)} </h3>);

            if (volatily <= 0.1) {

                addToAnalysis(<h3>The stock is not volatile</h3>);

            } else if (volatily > 0.1 && volatily < 0.2) {

                addToAnalysis(<h3>The stock is moderately volatile</h3>);

            } else {

                addToAnalysis(<h3>The stock is highly volatile</h3>);

            }

            addToAnalysis(<h3>Total P&L for this stock is ${Math.round(total)}.</h3>);
            addToAnalysis(<h3>Return on Investment is {Math.round(total / 100.00)}%.</h3>);

            if (trades > 0) {
                let num = success / (trades / 2);
                addToAnalysis(<h3>Success rate was {Math.round(num * 100)}%. </h3>);
            }

            addToAnalysis(<h3>Commission was ${Math.round(fees * trades)} for {trades} trades.</h3>);

            const simulationDates = [];
            const simulationPrices = [];
            simulationPoints.forEach((point) => {
                simulationDates.push(point.date);
                simulationPrices.push(point.price);
            });

            renderChart(stock, dates, prices);
        }

    }

    render() {

        const analysisText = this.state.analysisText;
        const simulationPoints = this.state.simulationPoints;
        const spinnerVisible = this.state.spinnerVisible;

        const renderSimulation = () => {
            const simulationDates = [];
            const simulationPrices = [];
            simulationPoints.forEach((point) => {
                simulationDates.push(point.date);
                simulationPrices.push(point.price);
            });
            this.renderSimulation(this.state.stock, simulationDates, simulationPrices);
        };

        return (
            <div className="Main">
                <form className="inputForm">
                    <div>
                        <label>Stock Symbol: </label>
                        <TextField name="stock" hintText="AAPL" onChange={this.handleInputChange} />
                        <label>Start Date: </label>
                        <TextField name="startDate" hintText="2000-01-01" onChange={this.handleInputChange} />
                        <label>End Date: </label>
                        <TextField name="endDate" hintText="2017-01-01" onChange={this.handleInputChange} />
                        <label>Cash on hand: </label>
                        <TextField name="buyingPower" hintText="10000" onChange={this.handleInputChange} />
                    </div>
                    <div>
                        <label>Stop Limit (e.g. 0.75 means sell / take losses when stock is @ 25% below bought price): </label>
                        <TextField name="stopLimit" defaultValue="0.75" onChange={this.handleInputChange} />
                    </div>
                    <div>
                        <label>Sell Limit (e.g. 1.05 means sell / take profit when stock is @ 5% above bought price): </label>
                        <TextField name="sellLimit" defaultValue="1.05" onChange={this.handleInputChange} />
                    </div>
                    <div>
                        <label>Commission fees (set it to whatever your brokerage charges): </label>
                        <TextField name="fees" defaultValue="9.95" onChange={this.handleInputChange} />
                    </div>
                    <div>
                        <RaisedButton label="Simulate" onClick={this.fetch} />
                    </div>
                </form>
                <div id="chartContainer">
                    {spinnerVisible ? <img className="spinner" role="presentation" src="/spinner.gif"/> : null}
                </div>
                <div id="simulationContainer">
                    {spinnerVisible ? <img className="spinner" role="presentation" src="/spinner.gif"/> : null}
                    {simulationPoints.length > 0 ? renderSimulation() : null}
                </div>
                <div id="analysis">
                    {analysisText}
                </div>
                <div id="simulationPoints">
                    <h2 className="logTitle">Full Log:</h2>
                    {simulationPoints.map((simulationPoint) => {
                        return <h3>{simulationPoint.date}: {simulationPoint.action} {simulationPoint.numShares} Shares at {simulationPoint.price}</h3>;
                    })}
                </div>
            </div>
        );
    }
}