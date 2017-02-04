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
            buyingPower: 10000,
            stopLimit: 0.75,
            sellLimit: 1.05,
            fees: 9.95,
            isLoaded: false,
            analysisText: []
        };

        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleFetched = this.handleFetched.bind(this);
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

    handleFetched() {
        this.setState({
           isLoaded: true
        });
    }

    fetch() {
        const simulate = this.simulate;
        const handleFetched = this.handleFetched;

        const url = 'http://dev.markitondemand.com/MODApis/Api/v2/InteractiveChart/jsonp?parameters=%7B%22Normalized%22%3Afalse%2C%22StartDate%22%3A%22' +
            this.state.startDate + 'T00%3A00%3A00-00%22%2C%22EndDate%22%3A%22' +
            this.state.endDate + 'T00%3A00%3A00-00%22%2C%22NumberOfDays%22%3A365%2C%22DataPeriod%22%3A%22Day%22%2CLabelPeriod%3A%22Day%22%2C%22Elements%22%3A%5B%7B%22Symbol%22%3A%22' +
            this.state.stock + '%22%2C%22Type%22%3A%22price%22%2C%22Params%22%3A%5B%22c%22%5D%7D%5D%7D';

        fetchJsonp(url)
            .then(function(response) {
                return response.json();
            }).then(function(json) {
                console.log('parsed json', json);
                handleFetched();
                simulate(json);
            }).catch(function(ex) {
                console.error('parsing failed', ex)
            });
    }

    simulate(data) {

        const dates = data.Dates || [];
        const prices = data.Elements ? data.Elements[0].DataSeries.close.values : [];
        const analysisText = this.state.analysisText;
        const sellLimit = this.state.sellLimit;
        const stopLimit = this.state.stopLimit;
        const fees = this.state.fees;
        const buyingPower = this.state.buyingPower;

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
                        analysisText.push(dates[i] + ': Shorting ' + numShares + ' Shares at: ' + nextPrice);
                        trades++;

                    } else if (bought && !sold && enableShortSell) {

                        if (shortSell) {

                            if (nextPrice >= sellLim) {

                                profit = (numShares * buyPrice - numShares * nextPrice);
                                total += profit;
                                sold = true;
                                bought = false;
                                shortSell = false;
                                analysisText.push(dates[i] + ': Covered ' + numShares + ' Shares at: ' + nextPrice);
                                trades++;

                            } else if (nextPrice <= stopLim) {

                                profit = (numShares * buyPrice - numShares * nextPrice);
                                total += profit;
                                sold = true;
                                bought = false;
                                shortSell = false;
                                analysisText.push(dates[i] + ': Covered ' + numShares + ' Shares at: ' + nextPrice);
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
                                analysisText.push(dates[i] + ': Sold ' + numShares + ' Shares at: ' + nextPrice);
                                trades++;
                                success++;

                            }
                            // if stock falls below the stop limit, sell.
                            else if (nextPrice <= stopLim) {

                                profit = (numShares * nextPrice - numShares * buyPrice);
                                total += profit;
                                sold = true;
                                bought = false;
                                analysisText.push(dates[i] + ': Sold ' + numShares + ' Shares at: ' + nextPrice);
                                trades++;

                            }
                        }
                    }

                } else {

                    // this is when it buys
                    // change to 0.95 to whatever your buy point is
                    if (!bought) {

                        let date = dates[i];

                        // We don't have indices yet so disregard for now
                        /*let index1 = SPPer.get(date);
                        let index2 = dowJonesPer.get(date);
                        let index3 = nasdaqPer.get(date);*/
                        let bearDay = false;
                        /*if (index1 != null && index2 != null && index3 != null) {
                            bearDay = index1 <= -0.8 && index2 <= -0.8 && index3 <= -0.8;
                        }*/
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
                            analysisText.push(dates[i] + ': Bought ' + numShares + ' Shares at: ' + buyPrice);
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
                            analysisText.push(dates[i] + ': Bought ' + numShares + ' Shares at: ' + buyPrice);
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
                                analysisText.push(dates[i] + ': Covered ' + numShares + ' Shares at: ' + nextPrice);
                                trades++;

                            } else if (nextPrice <= stopLim) {

                                profit = (numShares * buyPrice - numShares * nextPrice);
                                total += profit;
                                sold = true;
                                bought = false;
                                shortSell = false;
                                analysisText.push(dates[i] + ': Covered ' + numShares + ' Shares at: ' + nextPrice);
                                trades++;
                                success++;

                            }

                        } else {

                            let date = dates[i];
                            // disregard for now
                            /*Double index1 = SPPer.get(date);
                            Double index2 = dowJonesPer.get(date);
                            Double index3 = nasdaqPer.get(date);*/
                            // use this variable for higher returns but less success rate
                            let bullDay = false;
                            /*if (index1 != null && index2 != null && index3 != null) {
                                bullDay = index1 > 0.4 && index2 > 0.4 && index3 > 0.4;
                            }*/

                            // if stock is above the sell limit
                            if (nextPrice >= sellLim && bullDay) {

                                profit = (numShares * nextPrice - numShares * buyPrice);
                                total += profit;
                                sold = true;
                                bought = false;
                                analysisText.push(dates[i] + ': Sold ' + numShares + ' Shares at: ' + nextPrice);
                                trades++;
                                success++;

                            }

                            // if stock falls below the stop limit and its a bull day (very likely something bad about the stock), sell.
                            else if (nextPrice <= stopLim && bullDay) {

                                profit = (numShares * nextPrice - numShares * buyPrice);
                                total += profit;
                                sold = true;
                                bought = false;
                                analysisText.push(dates[i] + ': Sold ' + numShares + ' Shares at: ' + nextPrice);
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
                if (isDown > 3) {
                    downTrend = true;
                }

                // if a stock goes up for 5 days consecutively, its on an uptrend
                else if (isUp > 3) {
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

                analysisText.push('Stock is on a downtrend. Do not buy it. Expect to short it/sell it. ');

            } else if (upTrend) {

                analysisText.push('Stock is on an uptrend. Expect to buy it around $' + avg);
          /*      out.write(" when S&P 500 index <= " + (Double.parseDouble(SPList.get(dateList.get(dateList.size() - 1))) * 0.992) +
                    ",");*/
                /*                        out.write(" when DJIA index <= " +
                 (Double.parseDouble(dowJonesList.get(dateList.get(dateList.size() - 2))) * 0.992) + ",");
                 out.newLine();*/
                /*                        out.write(" when NASDAQ index <= " +
                 (Double.parseDouble(nasdaqList.get(dateList.get(dateList.size() - 2))) * 0.992) + ".");
                 out.newLine();*/
            } else {

                analysisText.push('Stock is neutral. Buy in around $' + avg * 0.95);
               /* out.write(" when S&P 500 index <= " + (Double.parseDouble(SPList.get(dateList.get(dateList.size() - 1))) * 0.992) +
                    ",");*/
                /*                        out.write(" when DJIA index <= " +
                 (Double.parseDouble(dowJonesList.get(dateList.get(dateList.size() - 2))) * 0.992) + ",");
                 out.newLine();*/
                /*                        out.write(" when NASDAQ index <= " +
                 (Double.parseDouble(nasdaqList.get(dateList.get(dateList.size() - 2))) * 0.992) + ".");
                 out.newLine();*/

            }

            if (!sold && bought) {

                if (shortSell) {

                    analysisText.push('Next cover price is ' + stopLim);

                } else {

                    analysisText.push('Sell it at $' + stopLim + ' or below, or $' + sellLim + 'or above ');
            /*        out.write(" when S&P 500 index >= " +
                        (Double.parseDouble(SPList.get(dateList.get(dateList.size() - 1))) * 0.992) +
                        ",");*/
                    /*                            out.write(" when DJIA index >= " +
                     (Double.parseDouble(dowJonesList.get(dateList.get(dateList.size() - 2))) * 0.992) + ",");
                     out.newLine();*/
                    /*  out.write(" when NASDAQ index >= " +
                     (Double.parseDouble(nasdaqList.get(dateList.get(dateList.size() - 2))) * 0.992) + ".");
                     out.newLine();*/

                }
            }

            analysisText.push('Support price is '+ support);
            analysisText.push('Resistance price is ' + resistance);
            analysisText.push('Std Dev = ' + stdDev + '.');

            if (volatily <= 0.1) {

                analysisText.push('The stock is not volatile');

            } else if (volatily > 0.1 && volatily < 0.2) {

                analysisText.push('The stock is moderately volatile');

            } else {

                analysisText.push('The stock is highly volatile');

            }

            analysisText.push('Total P&L for this stock is $' + total + '.');
            analysisText.push('Return on Investment is ' + total / 100.00 + '%');

            if (trades > 0) {

                let num = success / (trades / 2);
                numShares = Math.floor(num);
                analysisText.push('Success rate was ' + num * 100 + '%.');

            }

            analysisText.push('Commission was $' + fees * trades + ' for ' + trades + ' trades.');

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

    }

    render() {

        const isLoaded = this.state.isLoaded;
        const analysisText = this.state.analysisText;

        let analysis = null;
        if (isLoaded) {
            analysis = <h3>Analyzing predictions for {this.state.stock}: </h3>;

            for (let i = 0; i < analysisText.length; i++) {
                analysis += <h3>analysisText[i]</h3>;
            }
        }

        return (
            <div class="Main">
                <form class="inputForm">
                    <div>
                        <label>Stock Symbol: </label>
                        <TextField name="stock" hintText="AAPL" onChange={this.handleInputChange} />
                        <label>Start Date: </label>
                        <TextField name="startDate" hintText="2000-01-01" onChange={this.handleInputChange} />
                        <label>End Date: </label>
                        <TextField name="endDate" hintText="2017-01-01" onChange={this.handleInputChange} />
                        <label>Buying Power: </label>
                        <TextField name="buyingPower" hintText="10000" onChange={this.handleInputChange} />
                    </div>
                    <div>
                        <label>Stop Limit (default values recommended): </label>
                        <TextField name="stopLimit" defaultValue="0.75" onChange={this.handleInputChange} />
                        <label>Sell Limit (default values recommended): </label>
                        <TextField name="sellLimit" defaultValue="1.05" onChange={this.handleInputChange} />
                        <label>Commission fees: </label>
                        <TextField name="fees" defaultValue="9.95" onChange={this.handleInputChange} />
                        <FlatButton label="Simulate" onClick={this.fetch} />
                    </div>
                </form>
                <div id="container"></div>
                <div id="analysis">
                    {analysis}
                </div>
            </div>
        );
    }
}