var request = require("request");
var wol = require("wake_on_lan");
const os = require('os');
var fs = require('fs');
var time = require('time');
var deviceName
var logger = require('homebridge-logger');
var Service, Characteristic;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("sonybraviatv", "SonyBraviaTV", SonyBraviaTVAccessory);
}

function SonyBraviaTVAccessory(log, config) {
    this.log = log;

    this.name = config["name"];
    this.psk = config["presharedkey"];
    this.ipaddress = config["ipaddress"];
    this.macaddress = config["macaddress"];

    deviceName = this.name;
    logger.setPluginName(`homebridge-sonybraviatv`);

    this.service = new Service.Switch(this.name);

    this.service
        .getCharacteristic(Characteristic.On)
        .on('get', this.getOn.bind(this))
        .on('set', this.setOn.bind(this));
}

function logPowerUpdate(value) {
    const characteristicName = `Power`;
    logger.logCharacteristicUpdateForDevice(deviceName,characteristicName,value);
}

// /* Logs a Power update if the `value` differs from the last known value. */
// function logPowerUpdateIfNecessary(value) {
//     fs.exists(path, function(exists) {
//       if (exists) {
//         fs.readFile(path, 'utf8', function(err, contents) {
//             if(err) {
//                 return console.log(err);
//             }
//
//             const logEntries = contents.split("\n");
//             const lastPowerLogEntry = String(logEntries.reverse().find(isLogEntryForPower));
//
//             if (typeof lastPowerLogEntry !== 'undefined') {
//                 const lastPowerLogEntrySplitOnValue = contents.split("value=");
//                 const lastPowerLogEntryValue = Boolean(lastPowerLogEntrySplitOnValue.reverse()[0]);
//
//                 if (lastPowerLogEntryValue !== Boolean(value)) {
//                     logPowerUpdate(value);
//                 }
//             } else {
//                 // First power entry, update log.
//                 logPowerUpdate(value);
//             }
//         });
//       } else {
//         // First entry, update log.
//         logPowerUpdate(value);
//       }
//     });
// }
//
// function isLogEntryForPower(value) {
//   return value.indexOf('characteristic=Power') > -1;
// }

SonyBraviaTVAccessory.prototype.getOn = function(callback) {
    this.log("Getting TV status...");

    var postData = JSON.stringify({
        method: 'getPowerStatus',
        params: [],
        id: 1,
        version: '1.0'
    });

    request.post({
        url: "http://" + this.ipaddress + "/sony/system",
        headers: {
            'X-Auth-PSK': this.psk
        },
        form: postData
    }, function(err, response, body) {

        if (!err && response.statusCode == 200) {
            var json = JSON.parse(body);
            var status = json.result[0].status;
            this.log("TV status is %s", status);
            var isOn = status == "active";
            // logPowerUpdateIfNecessary(isOn);
            callback(null, isOn); // success
        } else {
            if (response != null) {
                this.log("Error getting TV status (status code %s): %s", response.statusCode, err);
            } else {
                this.log("Error getting TV status: %s", err);
            }
            callback(err);
        }
    }.bind(this));
}

SonyBraviaTVAccessory.prototype.setOn = function(value, callback) {
    value = Boolean(value);
    switch(value) {
    case false:
        this.log('Turning off TV');
        break;
    case true:
        this.log('Turning on TV');
        break;
    }

    logPowerUpdate(value)

    if (value && this.macaddress) {
        wol.wake(this.macaddress, function(error) {
            if (error) {
                // handle error
                this.log("Error '%s' setting TV power state using WOL.", error);
                callback(error);
            } else {
                // done sending packets
                callback();
            }
        }.bind(this));
    } else {
        var postData = JSON.stringify({
            method: 'setPowerStatus',
            params: [{
                'status': value
            }],
            id: 1,
            version: '1.0'
        });

        request.post({
            url: "http://" + this.ipaddress + "/sony/system",
            headers: {
                'X-Auth-PSK': this.psk
            },
            form: postData
        }, function(err, response, body) {
            if (!err && response.statusCode == 200) {
                callback(); // success
            } else {
                this.log("Error '%s' setting TV power state. Response: %s", err, body);
                callback(err || new Error("Error setting TV power state."));
            }
        }.bind(this));
    }
}

SonyBraviaTVAccessory.prototype.getServices = function() {
    return [this.service];
}
