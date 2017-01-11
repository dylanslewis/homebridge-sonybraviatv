"use strict";

// Modules

const request = require("request");
const wol = require("wake_on_lan");
const os = require('os');
const util = require("util");
const logger = require('homebridge-logger');
const fs = require("fs");

// Variables

let Accessory;
let Service;
let Characteristic;

// Homebridge

function setHomebridge(homebridge) {
  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  SonyBraviaTVModule.setHomebridge(homebridge);
}

// Logger

function setLogger() {
  logger.setPrintConsoleLogs(false);
}

function logPowerUpdate(value) {
    logger.logCharacteristicUpdateForDevice(this.name,"power",value);
}

// SonyBraviaTV

function SonyBraviaTV(platform, name, psk, ipaddress, macaddress) {
  this.log = platform.log;
  this.platform = platform;
  this.name = host;
  this.psk = psk
  this.macaddress = macaddress
  this.url = "http://" + ipaddress + "/sony/system";

  this.service = new Service.Switch(this.name);

  this.service
      .getCharacteristic(Characteristic.On)
      .on('get', this.getOn.bind(this))
      .on('set', this.setOn.bind(this));
}

// Heartbeat

SonyBraviaTV.prototype.heartbeat = function() {
  print(`heartbeat`)
  this.heartbeatResources()
};

SonyBraviaTV.prototype.heartbeatResources = function() {
  print(`heartbeatResources`)
};

// Services

SonyBraviaTV.prototype.getServices = function() {
    return [this.service];
}

// Actions

SonyBraviaTV.prototype.getOn = function(callback) {
    this.log("Getting TV status...");

    var postData = JSON.stringify({
        method: 'getPowerStatus',
        params: [],
        id: 1,
        version: '1.0'
    });

    request.post({
        url: this.url,
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

SonyBraviaTV.prototype.setOn = function(value, callback) {
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
            url: this.url,
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
