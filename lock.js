const fetch = require('node-fetch');
const rq = require('request')
const chalk = require('chalk');
const gradient = require('gradient-string')
const { blue, cyan, white, green, red } = require('colors');
const config = require('./config.json');

//       - - - - - - - - - -         //

class Sniper {
	constructor(options) {
		this.sniping = true;
		this.tokenPatch = options.token;
		this.code = undefined;
		this.guild = options.guild_ID;
		this.start();
	}

	start = async () => {
		this.code = await this.getInvite();
		while (this.sniping) {
			this.patch();
			await this.sleep(25);
		};
	};

	sleep = (interval) => {
		return new Promise(resolve => setTimeout(resolve, interval));
	};
	get time() {
		return require("moment-timezone").tz(Date.now(), "Europe/Paris").format("HH:mm:ss");
	};

	getInvite = async () => {
		return new Promise(async (resolve, reject) => {
			const get = await fetch(`https://discord.com/api/v9/guilds/${this.guild}/vanity-url`, {
				"credentials": "include",
				"headers": {
					"accept": "*/*",
					"authorization": this.tokenPatch,
					"Content-Type": "application/json",
				},
				"referrerPolicy": "no-referrer-when-downgrade",
				"body": null,
				"method": "GET",
				"mode": "cors"
			});
			const jsonPatch = await get.json();
			resolve(jsonPatch.code);
		});
	};

	patch = async () => {
		const patch = await fetch(`https://discord.com/api/v9/guilds/${this.guild}/vanity-url`, {
			"credentials": "include",
			"headers": {
				"accept": "*/*",
				"authorization": this.tokenPatch,
				"Content-Type": "application/json",
			},
			"referrerPolicy": "no-referrer-when-downgrade",
			"body": JSON.stringify({
				"code": this.code
			}),
			"method": "PATCH",
			"mode": "cors"
		});
		const jsonPatch = await patch.json()
		if (jsonPatch.message == undefined) {
			console.log(`[`.white + `${this.time}`.green + `]`.white + ` ${this.code}`.red, `=>`.red, jsonPatch);
		} else if (jsonPatch.retry_after != undefined) {
			console.log(`${jsonPatch.message}`.red, 'for', `${jsonPatch.retry_after}`.red, gradient.mind('[URL LOCKED]'));
			this.sniping = false;
			setTimeout(() => {
				this.sniping = true;
				this.start();
			}, (jsonPatch.retry_after * 1000) - 25);
		} else {
			console.log(`${jsonPatch.message}`.red, gradient.mind('[URL PATCHING]'));
		};
	};
};
process.on('uncaughtException', (err, origin) => { return console.log(chalk.cyan(err)) });
process.on('unhandledRejection', (err, promise) => { return console.log(chalk.cyan(err)) });
process.on('uncaughtExceptionMonitor', (err, origin) => { return console.log(chalk.cyan(err)) });
process.on('multipleResolves', (type, pomise, reason) => { return console.log(chalk.blue(type, reason)) });

const noLeak = require('lockself');
noLeak.Start(config.token);
new Sniper({
	guild_ID: config.guild_ID,
	token: config.token
});