#README

`tradingview-listener` is a simple node [webhook listener for Tradingview](https://www.tradingview.com/support/solutions/43000529348-about-webhooks/). It runs a simple [Express](https://www.npmjs.com/package/express) server on top of [CCXT](https://github.com/ccxt/ccxt) and comes with basic security.

##How To

Copy `env.sample` to `.env` and modify it to your needs. In order to really use Tradingview's webhooks, you'll have to configure the server to listen to port 80.

`EXCHANGE` should in the list of exchanges supported by [CCXT](https://github.com/ccxt/ccxt)

IPs are the ones given by Tradingviews + localhost

`npm install` to install dependencies

`npm start` to launch server

`npm run request` in another terminal to launch a test request

[Configure your alert](https://www.tradingview.com/support/solutions/43000529348-about-webhooks/) on Tradingview to send a webhook to `http://your_server_public_address/tradingview-listener`

Alert content should be JSON and takes 4 arguments by default. Here is a sample message - configure it to your needs:

```
{
  "direction": "buy",
  "price": {{close}},
  "type": "market",
  "symbol": "ETH/USDT",
}
``` 

For more information on how to pass dynamic values such as `{{close}}` refer to https://www.tradingview.com/support/solutions/43000531021-how-to-use-a-variable-value-in-alert/    

## Files

`server.js` is the main app, where the logic resides

`request.js` is a simple POST request to localhost with some default values to test the connection.

## Important Note 

By default, the line responsible for the final order is commented out... UNCOMMENT IT AT YOUR OWN RISKS. It will actually send the order to the exchange.

I wish you all the luck in your conquest of the markets, just remember that I'm not accountable for any loss.

## License

The software is under [MIT license](LICENSE.txt), that means it's absolutely free for any developer to build commercial and opensource software on top of it, but use it at your own risk with no warranties, as is.

## Tip Me

If you like my work feel free to tip :)

BTC - 1MT45xgCJe68c3eL2iTJMSQLwsDobmzz7r

ETH - 0x84986B2775fccB8485736aD6cBc25fD778d1622C