## Stock Simulator Web App

This App is a Node / ReactJS App that I created that ports the same functionality of the Stock Simulator Java App that
I created back in 2010 except this has a graphical UI and interactive chart functionality courtesy of HighCharts API.

It uses the `http://dev.markitondemand.com/` API to get the stock data instead of Google Finance API and as a result
it does not calculate stock indices, the stock indices are instead downloaded from Yahoo Finance API.

## Improvements

1) Add support for multiple stock calculations at a time. Right now its difficult because of the complexity; we would have
to store multiple price/date lists in memory and probably have to use multiple promises to ensure that there are no
race conditions when calculating and rendering. Also, HighCharts API doesn't allow rendering of two different sets of data
of differing lengths.

2) Add support for shorting / covering / options. This was too complicated for the old Java software to do and remains
complicated to do.

3) The index data points and stock data points have to be exactly equal in number; they have to start and end with
the same dates, because I couldn't get JS Maps working so I had to use index to get the proper data points which
means thats its highly dependent on the data sets having the same length. In the future I want to get hash maps working
(keying using the date) so that it will work independent on data set length.

## Instructions for running

Run `npm run build` from the root to build the app and run `node server` to get the server up and running.
By default it starts up on `http://localhost:9000/`.

If you would like to debug the app and have live reload / lint output available, run `npm start` instead.

-Tong Zou