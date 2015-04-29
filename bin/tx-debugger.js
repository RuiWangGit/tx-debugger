#!/usr/bin/env node

var q = require('q');
var rp = require('request-promise');
var Tx = require('fullnode/lib/tx');
var BR = require('fullnode/lib/br');
var Interp = require('fullnode/lib/interp');
var Txverifier = require('fullnode/lib/txverifier');
var Txoutmap = require('fullnode/lib/txoutmap');
var txhex = process.argv[2];

function end(str) {
  console.log(str);
  process.exit();
};

if (!txhex) {
  end('Usage: tx-validator [transaction-hex-string]');
};

try {
  var tx = Tx().fromHex(txhex);
} catch (e) {
  end('Error parsing transaction: ' + e);
}

var mainneturl = "https://www.bitgo.com/api/v1"
var testneturl = "https://test.bitgo.com/api/v1";

console.log('Transaction parsed successfully. Gathering inputs.');

var txs = [];
var gatherInputs = tx.txins.map(function(txin, index) {

  var txhashbuf = txin.txhashbuf;
  var foundNetwork = '';
  var foundReversed = false;

  function gatherInput(network, reverse) {
    var networkurl = network == 'mainnet' ? mainneturl : testneturl;
    if (!reverse)
      var txidhex = BR(txhashbuf).readReverse().toString('hex');
    else
      var txidhex = txhashbuf.toString('hex');
    return rp(networkurl + '/tx/' + txidhex)
    .then(function(obj) {
      var txhex = JSON.parse(obj).hex;
      try {
        var tx = Tx().fromHex(txhex);
      } catch (e) {
        throw new Error('Error parsing input transaction ' + index);
      }
      console.log('Gathered input ' + index + ' of id ' + txidhex);
      txs[index] = tx;
      foundNetwork = network;
      foundReversed = reverse;
    })
    .error(function(e) {
      // its ok if we catch an error; 3/4 tries won't work
    });
  };

  return gatherInput('mainnet', false)
  .then(function() {
    if (txs[index]) return;
    return gatherInput('testnet', false)
  })
  .then(function() {
    if (txs[index]) return;
    return gatherInput('mainnet', true)
  })
  .then(function() {
    if (txs[index]) return;
    return gatherInput('testnet', true)
  })
  .then(function() {
    if (!txs[index])
      end('Could not find input transaction ' + index + ' on mainnet or testnet.');
    console.log('Found input ' + index + ' on ' + foundNetwork);
    if (foundReversed) {
      console.log('Error: Input ' + index + ' had a reversed hash. Must reverse hash to validate.');
      console.log('Proceeding with additional checks in spite of invalid hash.');
      tx.txins[index].txhashbuf = BR(txhashbuf).readReverse();
    }
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
