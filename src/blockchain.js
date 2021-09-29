const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const debug = require('debug')('grennrepackbank:blockchain');

class Transaction {

  constructor(senderAdress, receiverAddress, amount) {
    this.senderAdress = senderAdress;
    this.receiverAddress = receiverAddress;
    this.amount = amount;
    this.timestamp = Date.now();
  }

  computeHash() {
    return crypto.createHash('sha256').update(this.senderAdress + this.receiverAddress + this.amount + this.timestamp).digest('hex');
  }

  signTransaction(signingKey) {
    if (signingKey.getPublic('hex') !== this.senderAdress) {
      throw new Error('You cannot sign transactions for other wallets!');
    }
    const hashTx = this.computeHash();
    const sig = signingKey.sign(hashTx, 'base64');

    this.signature = sig.toDER('hex');
  }

  isValid() {
    //Validateur de transac
    if (this.senderAdress === null) return true;

    if (!this.signature || this.signature.length === 0) {
      throw new Error('No signature in this transaction');
    }

    const publicKey = ec.keyFromPublic(this.senderAdress, 'hex');
    return publicKey.verify(this.computeHash(), this.signature);
  }
}

class Block {
  constructor(timestamp, transactions, previousHash = '') {
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.nonce = 0;
    this.hash = this.computeHash();
  }

  computeHash() {
    return crypto.createHash('sha256').update(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).digest('hex');
  }

  mineBlock(difficulty) {
    while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
      this.nonce++;
      this.hash = this.computeHash();
    }
  }

  hasValidTransactions() {
    for (const tx of this.transactions) {
      if (!tx.isValid()) {
        return false;
      }
    }

    return true;
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGreenRepackBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 5000000;
  }

  createGreenRepackBlock() {
    return new Block(Date.parse('2017-01-01'), [], '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  minePendingTransactions(miningRewardAddress) {
    const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
    this.pendingTransactions.push(rewardTx);

    const block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
    block.mineBlock(this.difficulty);

    this.chain.push(block);
    console.log(' Mening rewar with : ', this.miningReward)

    this.pendingTransactions = [];
  }

  addTransaction(transaction) {
    if (!transaction.senderAdress || !transaction.receiverAddress) {
      throw new Error('Transaction must include from and to address');
    }

    // Verify the transactiion
    if (!transaction.isValid()) {
      throw new Error('Cannot add invalid transaction to chain');
    }
    
    if (transaction.amount <= 0) {
      throw new Error('Transaction amount should be higher than 0');
    }
    
    // Making sure that the amount sent is not greater than existing balance
    if (this.getBalanceByADress(transaction.senderAdress) < transaction.amount) {
      throw new Error('Not enough balance');
    }

    this.pendingTransactions.push(transaction);
    debug('transaction added: %s', transaction);
  }

  
  getBalanceByADress(address) {
    let balance = 0;

    for (const block of this.chain) {
      for (const trans of block.transactions) {
        if (trans.senderAdress === address) {
          balance -= trans.amount;
        }

        if (trans.receiverAddress === address) {
          balance += trans.amount;
        }
      }
    }
    return balance;
  }


}

module.exports.Blockchain = Blockchain;
module.exports.Block = Block;
module.exports.Transaction = Transaction;
