/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');

/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);


// Add data to levelDB with key/value pair
function addLevelDBData(key,value){
  db.put(key, value, function(err) {
    if (err) return console.log('Block ' + key + ' submission failed', err);
  })
}

// Get data from levelDB with key
function getLevelDBData(key){
  db.get(key, function(err, value) {
    if (err) return console.log('Not found!', err);
    console.log('Value = ' + value);
  })
}

// Get block from levelDB with key
function getBlockLevelDBData(key, callback) {
	db.get(key, function (err, value) {
		if (err) return console.log('Not found!', err);
		return callback(value);
	})
}

// Add data to levelDB with value
function addDataToLevelDB(value) {
  let i = 0;
  db.createReadStream().on('data', function(data) {
    i++;
  }).on('error', function(err) {
      return console.log('Unable to read data stream!', err)
  }).on('close', function() {
    console.log('Block #' + i);
    addLevelDBData(i, value);
  });
}

/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block{
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
  constructor(){
    this.chain = [];
		db.getLevelDBData(key, function(err, value) {
			if (err.notFound) {
				this.addBlock(new Block("First block in the chain - Genesis block"))
			}
		})
  }

  // Add new block
  addBlock(newBlock){
		addDataToLevelDB(newBlock, function (value) {
			// Block height
			newBlock.height = this.chain.length;
			// UTC timestamp
			newBlock.time = new Date().getTime().toString().slice(0,-3);
			// previous block hash
			if(this.chain.length>0){
				newBlock.previousBlockHash = this.chain[this.chain.length-1].hash;
			}
			// Block hash with SHA256 using newBlock and converting to a string
			newBlock.hash = SHA256(JSON.stringify(value)).toString();
			// Adding block object to chain
			this.chain.push(value);
		})
  }

  // Get block height
  getBlockHeight(){
		getBlockLevelDBData(function (block) {
			db.createReadStream()
			.on('data', function (data) {
				console.log(data.chain.length-1);
			})
		})
  }

  // get block
  getBlock(blockHeight){
		getBlockLevelDBData(blockHeight, function (block) {
			console.log(JSON.parse(block));
		})
  }

  // validate block
  validateBlock(blockHeight){
		getBlockLevelDBData(blockHeight, function (value) {
			// get block hash
			let blockHash = block.hash;
			// remove block hash to test block integrity
			block.hash = '';
			// generate block hash
			let validBlockHash = SHA256(JSON.stringify(block)).toString();
			// Compare
			if (blockHash===validBlockHash) {
				callback(true);
			} else {
				console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
				callback(false);
			}
		})
  }

 	// Validate blockchain
  validateChain(){
		getBlockLevelDBData(key, function (value) {
			let errorLog = [];
      for (var i = 0; i < this.chain.length-1; i++) {
				try {
					// validate block
					if (!this.validateBlock(i))errorLog.push(i);
					// compare blocks hash link
					let blockHash = this.chain[i].hash;
					let previousHash = this.chain[i+1].previousBlockHash;
					if (blockHash!==previousHash) {
						errorLog.push(i);
					}
				}catch(value) {
					alert('Error')
				}
      }
      if (errorLog.length>0) {
        console.log('Block errors = ' + errorLog.length);
        console.log('Blocks: '+errorLog);
      } else {
        console.log('No errors detected');
      }
		})
	}
}


/* ===== Testing ==============================================================|
|  - Self-invoking function to add blocks to chain                             |
|  - Learn more:                                                               |
|   https://scottiestech.info/2014/07/01/javascript-fun-looping-with-a-delay/  |
|                                                                              |
|  * 100 Milliseconds loop = 36,000 blocks per hour                            |
|     (13.89 hours for 500,000 blocks)                                         |
|    Bitcoin blockchain adds 8640 blocks per day                               |
|     ( new block every 10 minutes )                                           |
|  ===========================================================================*/


(function theLoop (i) {
  setTimeout(function () {
    addDataToLevelDB('Testing data');
    if (--i) theLoop(i);
  }, 100);
})(10);
