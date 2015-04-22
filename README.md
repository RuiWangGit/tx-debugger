tx-validator
============

Is your bitcoin wallet software producing a transaction which is being rejected
from the network, and you don't know why? tx-validator can help you debug your
transaction. It will parse your transaction, retrieve the inputs automatically
using the BitGo API, run a script interpreter on the inputs, and finally run
the equivalent of bitcoind's CheckTransction method. tx-validator will tell you
where it encountered an error. If your transaction passes all the tests, then
it is valid. A valid transaction may be rejected by the network if a
double-spend transaction also appears in the blockchain - so if your
transaction is valid, it may be because of a double-spend.

Try this example of using tx-validator with a real transaction:

```
./bin/tx-validator.js 0100000001795b88d47a74e3be0948fc9d1b4737f96097474d57151afa6f77c787961e47cc120000006a47304402202289f9e1ae2ed981cd0bf62f822f6ae4aea40c65c7339d90643cea90de93ad1502205c8a08b3265f9ba7e99057d030d5b91c889a1b99f94a3a5b79d7daaada2409b6012103798b51f980e7a3690af6b43ce3467db75bede190385702c4d9d48c0a735ff4a9ffffffff01c0a83200000000001976a91447b8e62e008f82d95d1f565055a8243cc243d32388ac00000000
```

To specify testnet, add a "testnet" string to the end of the command. Here's a
real testnet transaction:

```
./bin/tx-validator.js 0100000002e0ea20bcae15a3d63d54cdafc92fea4923f7929e3ea36191522cac87c9fb9356010000006a47304402204a509176ec9634879f5487519b0fbf143936da3d94b887027a9b79182569c79f02206dad3fd761902c1585d6fab841e99aea1dbec735f4e20d4142b1f32cbd1113e701210261bf95c276fdda74106b93d4f3c4923134eccb380b598ddb6cdb7f798a4fdccfffffffffe799ebe4c2e62529195cff4f646faecd49d81ab41a2cd7bf54ba9b481a7b9bdc000000006b483045022100e39bb72c458eefdad89e7040359c12dd90b725a4d525100e1af294efc4e50544022047292abfd2d778fa8f7038c2238bd9c6376a34d65aaccaa860d459c30f5effc1012103301f9cd833888f5e5e7f1d15c5d8181a6c97f481f99b234ab5fca2bc4809a189ffffffff02f2121d860000000017a914805fd258cd7c8cf8249339fb01ed19fb7533ecce87c3295001000000001976a914522fef9fbe6df4d90ad8140d92a418dfbb57a34688ac00000000 testnet
```
