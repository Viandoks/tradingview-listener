const express = require('express'),
    bodyParser = require('body-parser'),
    ccxt = require('ccxt'),
    app = express(),
    fs = require('fs'),
    conf = JSON.parse(fs.readFileSync('conf.json')),
    accounts = conf.accounts.filter((account) => ccxt.exchanges.indexOf(account.exchange) !== -1),
    exchanges = new Map();

// Set up express server
const server = app.listen(conf.serverPort, '0.0.0.0', function () { // listen to IPv4 only

    const host = server.address().address
    const port = server.address().port

    console.log('Listening at http://%s:%s', host, port)
});

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
        order_symbol    = webhook_data.symbol;

    if(!order_direction || !order_price || !order_type || !order_symbol) {
        console.log('Wrong Webhook format. Throw 403')
        res.status(403).send()
        return;
    }

    (async () => {
        let responses = {}
        for (const account of accounts) {
            const exchange = exchanges.get(account.exchange);
            exchange.name = account.name;
            exchange.apiKey = account.apiKey;
            exchange.secret = account.secret;
            await executeStrategy(exchange, order_direction, order_price, order_type, order_symbol).then((json) => {
                responses[account.name] = json;
            });
        }
        return res.json(responses)
    })()

});

// Set up accounts
accounts.forEach((account) => {

    if(!exchanges.get(account.exchange)) {
        exchanges.set(account.exchange, new ccxt[account.exchange]({
            'apiKey': "",
            'secret': "",
            'verbose': process.argv.includes('--verbose'),
            'timeout': 60000,
            'enableRateLimit': true
        }));
    }

})

const executeStrategy = async (exchange, order_direction, order_price, order_type, order_symbol) => {
    /**
     * Code your logic here
     **/

    const [asset, quote] = order_symbol.split('/');

    try {

        const balances = await exchange.fetchBalance();
        if (!balances) {
            throw new Error (exchange.id + ' erroneous balance');
        }

        const balanceAsset = balances['free'][asset],
            balanceQuote = balances['free'][quote];

        console.log(`Available balance for ${this.name}: ${balanceAsset}${asset} - ${balanceQuote}${quote}`);

        let order_amount = order_direction==='buy'?balanceQuote/order_price:(order_direction==='sell'?balanceAsset:0);
        order_amount = order_amount*0.1 // 10% of available balance)

        // UNCOMMENT AT YOUR OWN RISK TO EXECUTE ORDER FOR REAL
        // const order = await exchange.createOrder(order_symbol, order_type, order_direction, order_amount, order_price);
        // if (!order) {
        //     throw new Error (exchange.id + ' error passing order');
        // }
        console.log(`${order_direction} ${order_amount}${asset} for ${order_amount*order_price}${quote}`)

        return {
            order_direction,
            order_amount,
            order_price,
            order_type,
            order_symbol,
        };

    } catch (e) {
        console.error(exchange.id, e.constructor.name, e.message.split ("\n")[0].slice (0, 100))
    }
}