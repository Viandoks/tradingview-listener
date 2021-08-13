const axios = require('axios'),
    url = 'http://127.0.0.1:8000',
    data = {
        'direction': 'buy',
        'price': 1,
        'type': 'limit',
        'symbol': 'BTC/USDT'
    };

const ax = axios.create({baseURL: url})

ax.post('/tradingview-listener', data)
    .then(res => {
        console.log(`statusCode: ${res.status}`)
        console.log(res.data)
    }).catch(error => {
        console.error(error.toJSON())
    });
