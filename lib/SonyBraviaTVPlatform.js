"use strict";

// Modules

const request = require("request");
const util = require("util");

// const SonyBraviaTVModule = require("./SonyBraviaTV");
// const SonyBraviaTV = SonyBraviaTVModule.SonyBraviaTV;

// Variables

let Accessory;
let Service;
let Characteristic;

// Exports

module.exports = {
  SonyBraviaTVPlatform: SonyBraviaTVPlatform,
  setHomebridge: setHomebridge,
  testMe: testMe
};

function testMe() {
  print(`shit`);
}

// Homebridge

function setHomebridge(homebridge) {
  // SonyBraviaTVModule.setHomebridge(homebridge);
  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
}

// SonyBraviaTVPlatform

function SonyBraviaTVPlatform(log, config) {
  this.log = log;
  this.name = config.name
  this.psk = config.psk
  this.ipaddress = config.ipaddress
  this.macaddress = config.macaddress
  this.heartrate = config.heartrate
  this.bridges = [];
}

// Accessories

SonyBraviaTVPlatform.prototype.accessories = function(callback) {
  // let promises = [];
  // promises.push(bridge.accessories());
  // Promise.all(promises)

  // this.sonyBraviaTV = new SonyBraviaTV(this, this.name, this.psk, this.ipaddress, this.macaddress, this.heartrate);
  let accessoryList = [];
  // accessoryList.push(this.sonyBraviaTV)
  //
  // // POTENTIAL ERROR POINT
  // this.sonyBraviaTV.startHeartbeat.bind(this)

  return callback(accessoryList);
}
