"use strict";

const dynamic = false;

const SonyBraviaTVPlatformModule = require("./lib/SonyBraviaTVPlatform");
const SonyBraviaTVPlatform = SonyBraviaTVPlatformModule.SonyBraviaTVPlatform;

module.exports = function(homebridge) {
  // SonyBraviaTVPlatform.setHomebridge(homebridge);
  SonyBraviaTVPlatform.testMe();
  homebridge.registerPlatform("sonybraviatv", "SonyBraviaTV", SonyBraviaTVPlatform, dynamic);
};
