const express = require('express')
const bodyParser = require("body-parser");
const cors = require("cors");

const { Blockchain, Transaction } = require('./blockchain');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const app = express();
app.use(express.json());    
app.use(bodyParser.json({limit: '10mb', extended: true}));
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}));
app.use(cors());

// Your private key goes here
const grKey = ec.keyFromPrivate('generale');
const greenRepackAdress_pub = grKey.getPublic('hex');


// Create new instance of Blockchain class
const greenBank = new Blockchain();

// Mine first block
greenBank.minePendingTransactions(greenRepackAdress_pub);

app.listen(80, () => { 
    //logger.info( 'Server listening' )
    console.log(' SERVER LESTENING ')
} )

app.use(function (req, res, next) {

    res.setHeader('Access-Control-Allow-Origin', '13.37.145.96');
    res.setHeader('Access-Control-Allow-Origin', '127.0.0.1');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    res.setHeader('Access-Control-Allow-Credentials', true);

    next();
});

app.get('/', (req,res) => {
    res.json({ res: "Greenbank is open." });
})

app.get('/mybalace', (req,res) => {
    var myKeys = ec.keyFromPrivate(req.query.email);
    console.log( ' :: BALANCE OF :: ', req.query.email )
    var user_pub = myKeys.getPublic('hex');
    res.json({ balance : greenBank.getBalanceByADress(user_pub) });
})

app.post('/getReward', (req,res) => {
    var myKeys = ec.keyFromPrivate(req.body.email);
    console.log( ' :: REWARD TO :: ', req.body.email )
    var user_pub = myKeys.getPublic('hex');
    let tx1 = new Transaction(greenRepackAdress_pub, user_pub, req.body.amount);
    tx1.signTransaction(grKey);
    greenBank.addTransaction(tx1);

    // Mine block
    greenBank.minePendingTransactions(greenRepackAdress_pub);
    res.json({ balance : greenBank.getBalanceByADress(user_pub) });
})

app.post('/donate', (req,res) => {
    var userKeys = ec.keyFromPrivate(req.body.email);
    var receiverKey = ec.keyFromPrivate(req.body.receiver);
    var user_pub = userKeys.getPublic('hex');
    var project_pub = receiverKey.getPublic('hex');
    if( greenBank.getBalanceByADress(user_pub) >= req.body.amount  ){
        let tx1 = new Transaction(user_pub, project_pub, req.body.amount);
        tx1.signTransaction(userKeys);
        greenBank.addTransaction(tx1);

        // Mine block
        greenBank.minePendingTransactions(greenRepackAdress_pub);
        res.json({ projectbalance : greenBank.getBalanceByADress(project_pub) });
    }else{
        res.status(400).send("SI")
    }
    
})
