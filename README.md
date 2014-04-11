Yzal
=========

Yzal is a simple, yet fast and good looking web application designed to control cheap 433 MHz remote power outlets using the awesome Raspberry Pi. This project is build upon node.js, socket.io and bootstrap.

![yzal-node on a mobile device](https://github.com/cwildfoerster/yzal-node/raw/master/screenshot.png)

### How to run
* `$ cp config.sample.json config.json`
* `$ npm install`
* `$ node server.js`
* Open [http://localhost:8080](http://localhost:8080)

### TODO
* Documentation for what this project is, how to build and how to run.
* Support i18n / l10n
* Maybe add some kind of administration interface, so we do not need to modify the `config.json`
* Proper build tools
* Provide a "howto" how to make your Raspberry Pi capable of controlling cheap remote power outlets.
* Add watch service to monitor changes to `config.json` to automatically reload it
* What else?
