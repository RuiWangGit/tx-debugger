#!/usr/bin/env node

var q = require('q');
var rp = require('request-promise');
var Tx = require('fullnode/lib/tx');
var BR = require('fullnode/lib/br');
var Interp = require('fullnode/lib/interp');
var Txverifier = require('fullnode/lib/txverifier');
var Txoutmap = require('fullnode/lib/txoutmap');
var txhex = process.argv[2];

if (!txhex) {
  console.log('Usage: tx-validator [transaction-hex-string] [testnet?]');
  return;
};

var url = "https://www.bitgo.com/api/v1";
if (process.argv[3] === "testnet")
  url = "https://test.bitgo.com/api/v1";

try {
  var tx = Tx().fromHex(txhex);
} catch (e) {
  throw new Error('Error parsing transaction: ' + e);
}

console.log('Transaction parsed successfully. Gathering inputs.');

var txs = [];
var gatherInputs = tx.txins.map(function(txin, index) {
  var txidhex = BR(txin.txhashbuf).readReverse().toString('hex');
  return rp(url + '/tx/' + txidhex)
  .then(function(obj) {
    var txhex = JSON.parse(obj).hex;
    if (!txhex) {
      console.log('Could not find input transaction ' + index + '. Perhaps you should reverse your hashes?');
      throw new Error('Could not find input transaction ' + index);
    }
    try {
      var tx = Tx().fromHex(txhex);
    } catch (e) {
      throw new Error('Error parsing input transaction ' + index);
    }
    console.log('Gathered input ' + index + ' of id ' + txidhex);
    txs[index] = tx;
  })
  .error(function(e) {
    console.log('Could not find input transaction ' + index + '. Perhaps you should reverse your hashes?');
    process.exit();
  });
});

var runScriptInterpreter = function() {
  tx.txins.forEach(function(txin, index) {
    var txoutnum = tx.txins[index].txoutnum;
    var txout = txs[index].txouts[txoutnum];
    var scriptPubkey = txout.script;
    var scriptSig = tx.txins[index].script;
    var interp = Interp();
    var flags = Interp.SCRIPT_VERIFY_P2SH;
    var verified = interp.verify(scriptSig, scriptPubkey, tx, index, flags);
    console.log('Script interpreter result for input ' + index + ': ' + (verified ? 'success' : 'failure'));
  });
}

var checkTransaction = function() {
  var txoutmap = Txoutmap();
  txs.forEach(function(intx, index) {
    txoutmap.addTx(intx);
  });
  var verified = Txverifier.verify(tx, txoutmap, Interp.SCRIPT_VERIFY_P2SH);
  console.log('Check transaction (script interpreter plus other validations): ' + (verified ? 'success' : 'failure'));
};

q.allSettled(gatherInputs)
.then(runScriptInterpreter)
.then(checkTransaction)
.fail(function(e) {
  console.log('An error was thrown while validating the transaction: ' + e);
});
