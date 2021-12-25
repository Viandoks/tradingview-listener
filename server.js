const express = require('express'),
    bodyParser = require('body-parser'),
    ccxt = require('ccxt'),
    app = express(),
    fs = require('fs');

// get configuration
const conf = JSON.parse( fs.readFileSync('conf.json') );

// define Portfolio class
class Portfolio {
    constructor(_exchange, _apikey, _secret, _name="anonymous") {
        if(!_apikey || !_secret) {
            console.warn('API_KEY or SECRET missing')
        }
        // Init exchange
        console.log('Init CCXT exchange', _exchange);
        try {
            this.name = _name
            this.exchange = new ccxt[_exchange]({
                'apiKey': _apikey,
                'secret': _secret,
                'verbose': process.argv.includes('--verbose'),
                'timeout': 60000,
                'enableRateLimit': true
            });
        } catch (e) {
            console.log (e.constructor.name, e.message)
        }
    };

    // get balance for symbol
    async getBalance (symbol) {
        const [asset, market] = symbol.split('/');
        try {
            const balances = await this.exchange.fetchBalance();
            const balance = {
                'asset': balances['free'][asset],
                'market': balances['free'][market]
            }
            console.log(`Available balance for ${this.name}:`, balance);
            return balance
        } catch (e) {
            console.log (e.constructor.name, e.message)
        }
    }

    // send order via CCXT
    async sendOrder (symbol, side, amount= 0, price= 0, type = 'limit') {
        try {
            const order = await this.exchange.createOrder (symbol, type, side, amount, price);
            console.log(`Order passed for ${this.name}: ${order}`);
            return order;
        } catch (e) {
            console.log (this.name, e.constructor.name, e.message)
        }
    }

}

// Set allowed IPs
app.use((req, res, next) => {
    console.log('//=========================');
    const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim();
    console.log("Incoming from:", ip)

    // check for whitelisted IP
    if(!conf.whitelist.includes(ip)) {
        // Invalid ip
        console.log("Bad IP: ", ip, 'Throw 403');
        res.status(403).send()

    } else {
        next();
    }
})

// Use json body parser
app.use(bodyParser.json());

// Webhook should be received as POST
app.post('/tradingview-listener', function (req, res) {
    // get request body
    const webhook_data = req.body;
    console.log('Webhook received', webhook_data);

    // format order variables
    const order_direction = webhook_data.direction,
        order_price     = webhook_data.price,
        order_type      = webhook_data.type,
        order_symbol    = webhook_data.symbol,
        [order_asset, order_market] = order_symbol.split('/');

    if(!order_direction || !order_price || !order_type || !order_symbol || !order_asset || !order_market) {
        console.log('Wrong Webhook format. Throw 403')
        res.status(403).send()
        return
    }

    (async () => {
        let responses = {}
        for (const [exchange, portfolio] of Object.entries(portfolios)) {
            for (const [name, data] of Object.entries(conf.exchanges[exchange])) {
                portfolio.name = name;
                portfolio.exchange.apiKey = data.apiKey;
                portfolio.exchange.secret = data.secret;
                await executeStrategy(portfolio, order_direction, order_price, order_type, order_symbol, order_asset, order_market).then((json) => {
                    responses[portfolio.name] = json;
                });
            }
        }
        return res.json(responses)
    })()

});

// express server instance
const server = app.listen(conf.serverPort, '0.0.0.0', function () { // listen to IPv4 only

    const host = server.address().address
    const port = server.address().port

    console.log('Listening at http://%s:%s', host, port)
});

// portfolio instance
let portfolios = {};

for(const exchange of Object.keys(conf.exchanges)) {
    portfolios[exchange] = new Portfolio(exchange, "asd", "asd")
}

const executeStrategy = async (portfolio, order_direction, order_price, order_type, order_symbol, order_asset, order_market) => {
    /**
     * Code your logic here
     **/

    let order_amount,
        portfolio_balance;

    // get available balance
    portfolio_balance = await portfolio.getBalance(order_symbol);

    // pass order
    order_amount = order_direction==='buy'?portfolio_balance['market']/order_price:(order_direction==='sell'?portfolio_balance['asset']:0);
    order_amount = order_amount*0.1 // 10% of available balance)

    // // UNCOMMENT AT YOUR OWN RISK TO EXECUTE ORDER FOR REAL
    // const order = await portfolio.sendOrder(order_symbol, order_direction, order_amount, order_price, order_type);

    // send success
    // res.status(200).send()
    return {
        portfolio_balance,
        order_direction,
        order_amount,
        order_price,
        order_type,
        order_symbol,
        order_asset,
        order_market
    };
}
