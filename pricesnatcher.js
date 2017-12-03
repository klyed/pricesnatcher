//--------------------------------------------------------------------------
//---- Pricesnatcher.js v0.0.1 || Open Source Price Feed Node.js Script ----
//----- Developed by @KLYE || Free to Use for All! || Free to Modify -------
//---- Rekuirements to run: Node.js + steem.js + fs + prompt + reque-st ----
//-- TO INSTALL DEPENDENCIES FOR APPLICATION:  npm install request --save --
//--------- npm install prompt --save + npm install request --save ---------
//--------------------------------------------------------------------------
//----- PLEASE DO NOT USE THIS CODE BELOW MALICIOUSLY / FOR EVIL DEEDS -----
//--------------------------------------------------------------------------

// Get dependencies for app
var steem = require('steem');
var request = require('request');
var fs = require('fs');
var prompt = require('prompt');

// Sleep / wait function
function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
};

// No need to modify these variables
var witnessname;
var wif;
var url;
var bkey;
var interval;
var voteklye;
var klye = "klye";
var votedklye = 0;
var exchangedata;
var sbdaskcrude;
var sbdask;
var sbdbidcrude;
var sbdbid;
var sbdavg;
var usdaskcrude;
var usdask;
var usdbidcrude;
var usdbid;
var usdavg;
var sbdfeedprice;

// Various sources below to connect to STEEM
steem.config.set('websocket', 'wss://gtg.steem.house:8090');
// steem.config.set('websocket', 'wss://steemd.steemitdev.com');
// steem.config.set('websocket', 'wss://seed.bitcoiner.me');

// Startup screen
console.log("------------------------------------------------------------------");
console.log("----- Starting Pricesnatcher.js - Witness Price Feed Script ------");
console.log("----- Developed/Coded By: @KLYE --- BLOG: steemit.com/@klye ------");
console.log("------------------------------------------------------------------");

// Check for config file
if (!fs.existsSync(__dirname + "/pricesnatcher.config")) {
    console.log("??? NOTICE: No Configuration File Found! Please Run Setup Below!");
    newconfig();
} else {
    // Read config if found
    fs.readFile(__dirname + "/pricesnatcher.config", function(err, details) {
        if (err) {
            console.log("!!! ERROR: Unable to Read Configuration File!");
        }
        if (details) {
            console.log("Initializing Price Feed Updater, Loading Config File...");
            // Begin price feed updater
            startfeed();
        };
    });
};

// Setup / New configuration file prompts
function newconfig() {
    prompt.start();

    prompt.message = "";

    prompt.get([{
        name: 'witnessname',
        description: 'Witness Account Name? (No @)',
        required: true
    }, {
        name: 'witnessurl',
        description: "Witness Campaign URL/Website?",
        required: true
    }, {
        name: 'wifinput',
        description: "Witness Account Posting Private Key?",
        required: true,
        replace: '*',
        hidden: true
    }, {
        name: 'activekey',
        description: "Witness Account Active Key?",
        required: true,
        replace: '*',
        hidden: true
    }, {
        name: 'bkey',
        description: "Witness Account Block Signing Key?",
        required: true,
        replace: '*',
        hidden: true
    }, {
        name: 'interval',
        description: "Number of Blocks Between Update? (1 block = 3 seconds)",
        required: false,
        default: 100
    }, {
        name: 'voteklye',
        description: "Vote KLYE for Witness? (true / false)",
        required: true,
        default: true
    }], function(err, result) {
        // If we messed up and got error on setup
        if (err) {
            console.log("!!! ERROR: Something Went Wrong During Config.. Please Restart Service! (ctrl + c to exit)")
        };

        if (result) {

            var newconfig = {
                witnessname: result.witnessname,
                wif: result.wifinput,
                url: result.witnessurl,
                activekey: result.activekey,
                bkey: result.bkey,
                interval: result.interval,
                voteklye: result.voteklye
            };

            console.log("*** SUCCESS: You Completed The Configuration - Saving to Disk!");
            // Save data to file
            fs.writeFile(__dirname + "/pricesnatcher.config", JSON.stringify(newconfig), function(err, win) {
                if (err) {
                    console.log("!!! ERROR: Unable to Save Config to Disk!");
                };
                if (win) {
                    console.log("New Configuration Input Saved");
                    console.log("Initializing Price Feed Updater, Loading Config File...");
                    // Start price feed
                    startfeed();
                };
            }); // END config writeFile
            // Start price feed (backup/redundancy)
            startfeed();
        }; //END if (result)
    }); // END Setup Prompt
}; // END newconfig();

// Feed function that gets prices
function startfeed() {
    // Read the config
    fs.readFile(__dirname + "/pricesnatcher.config", function(err, data) {
        if (err) {
            console.log("!!! ERROR: Reading Config File!");
        };
        if (data) {
            var confdata = JSON.parse(data);

            witnessname = confdata.witnessname;
            wif = confdata.wif;
            url = confdata.url;
            activekey = confdata.activekey;
            bkey = confdata.bkey;
            interval = confdata.interval;
            voteklye = confdata.voteklye;

            // try to vote KLYE for witness if selected yes in config
            if (votedklye == 0) {
                if (voteklye == true || voteklye == "true") {
                    steem.broadcast.accountWitnessVote(activekey, witnessname, klye, true, function(err, result) {
                        if (err) {
                            votedklye = 1;
                            console.log("!!! ERROR: Witness Vote for @KLYE Failed! Duplicate Vote or Bad Keys Config!");
                            //console.log(err);
                        }; // END if (err)
                        if (result) {
                            votedklye = 1;
                            console.log("*** SUCCESS: Voted For @KLYE's Witness! Thank you for voting for me!!! You Rock!");
                            //console.log(result);
                        }; // END if (result)
                    }); // END Witness Vote

                } else {
                    votedklye = 0;
                    console.log("!!! ERROR: Please consider voting @KLYE as witness to support development and get rid of this message!");
                }; // END voteklye
            };


        }; // END if (data)
    }); // End readFile
    // Connect to Poloniex.com to retrieve BTC/STEEM price
    request('https://poloniex.com/public?command=returnOrderBook&currencyPair=BTC_STEEM&depth=1', function(error, response, body) {
        // Parse and format data from polo
        exchangedata = JSON.parse(body);
        sbdaskcrude = exchangedata.asks[0];
        sbdask = sbdaskcrude[0];
        sbdbidcrude = exchangedata.bids[0];
        sbdbid = sbdbidcrude[0];
        sbdavg = ((Number(sbdask) + Number(sbdbid)) / 2).toFixed(8);
        console.log("STEEM Avg Price: " + sbdavg + " BTC");
    });
    // Connect to Poloniex.com to retrieve USD/BTC price
    request('https://poloniex.com/public?command=returnOrderBook&currencyPair=USDT_BTC&depth=1', function(error, response, body) {
        // Parse and format data from polo
        exchangedata = JSON.parse(body);
        usdaskcrude = exchangedata.asks[0];
        usdask = usdaskcrude[0];
        usdask = Number(usdask).toFixed(2);
        usdbidcrude = exchangedata.bids[0];
        usdbid = usdbidcrude[0];
        usdbid = Number(usdbid).toFixed(2);
        usdavg = ((Number(usdask) + Number(usdbid)) / 2).toFixed(2);
        console.log("USDT Avg Price: $" + usdavg + " USD/BTC");

        // Get the STEEM/USD price average
        sbdfeedprice = Number(usdavg * sbdavg).toFixed(3);

        // Check if script is ahead of itself
        if (sbdfeedprice != undefined && sbdfeedprice != NaN && sbdfeedprice != null) {
            updateprice();
        } else {
            startfeed();
        }; // END else
    }); // END function startfeed()

    // Update price function
    function updateprice() {
        // if price average is borked request new prices
        if (sbdfeedprice == NaN) {
            startfeed();
        } else {
            console.log("STEEM Price is Roughly: $" + sbdfeedprice + " USD");
            var exchangeRate = {
                "base": sbdfeedprice + " SBD",
                "quote": "1.000 STEEM"
            };
            // Broadcast the updated price feed
            steem.broadcast.feedPublish(activekey, witnessname, exchangeRate, function(err, result) {
                if (err) {
                    console.log("!!! ERROR: Price Feed Update FAILED!");
                    startfeed();
                };
                if (result) {
                    console.log("*** SUCCESS: Price Feed Updated!");
                    var sleeptime = Number(interval * 3000);
                    var sleepmins = Number(sleeptime / 60000);
                    console.log("Next Price Feed Update: " + sleepmins + " Minute(s)!");
                    var restartfeed = setInterval(startfeed, sleeptime);
                };
            });
        };
    };
};
