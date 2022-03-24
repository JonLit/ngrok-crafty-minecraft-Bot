const ngrok = require('ngrok');
const Discord = require('discord.js');
const axios = require('axios');
const https = require('https');
const localtunnel = require('localtunnel');
const { BOT_TOKEN, NGROK_TOKEN, CRAFTY_TOKEN, MESSAGE_CHANNEL_ID, DEBUG_CHANNEL_ID } = require("./config.json");

const client = new Discord.Client({intents: ["GUILDS", "GUILD_MESSAGES"]});

const api = ngrok.getApi();

let url = null;
let pubURL = null;

var debug = false;

var initialised = false;

client.on('ready', () => 
{
	const channel = client.channels.cache.get(MESSAGE_CHANNEL_ID);
	if (debug)
	{
		channel = client.channels.cache.get(DEBUG_CHANNEL_ID);
	}
	console.log(`Logged in as ${client.user.tag}!`);

	client.user.setActivity("testStatus", { type: "PLAYING" });

	const axiosCrafty = axios.create(			//this is needed for the crafty API to work correctly
	{
		httpsAgent: new https.Agent(
		{
			rejectUnauthorized: false
		})
	});

	connect();

/*
	setTimeout(function(){
		axios
			.get('http://127.0.0.1:4040/api/tunnels/001')
			.then(res => {
				console.log(`publicURL: ${res.data.public_url}`)
				channel.send(`${res.data.public_url}`)
				url = `${res.data.public_url}`
			})
			.catch(error => {
				console.error(error)
			})
	}, 10000);
*/
	

	//writes Number of Players online to Bot's status & to debug console
	setInterval(function(){
		axiosCrafty
			.get('https://127.0.0.1:8000/api/v1/server_stats?token=' + CRAFTY_TOKEN)
			.then(res => {
				var playerCount = res.data;
				console.log(`Players online: ${playerCount.data[0].online_players}`);
				client.user.setActivity(`with ${playerCount.data[0].online_players} online players!`, { type: "PLAYING" });
				//console.log(res)
			})
			.catch(error => {
				console.error(error)
			});
		}, 1000);

//	const apiUrl = ngrok.getUrl();

	//channel.send('URL: ' + url + '\n' + 'apiUrl: ' + apiUrl);
});

client.on('messageCreate', function(message)
{
	const channel = client.channels.cache.get(MESSAGE_CHANNEL_ID);
	if (debug)
	{
		channel = client.channels.cache.get(DEBUG_CHANNEL_ID);
	}
	const debugChannel = client.channels.cache.get(DEBUG_CHANNEL_ID);

	switch (message.content)
	{
		case '!kill' :
			debugChannel.send('killing ngrok!');
			ngrok.kill();		//This is not in a try{} because if it fails I want the bot to crash to end the connection at least that way
			break;
		case '!start' :
			connect();

			setTimeout(function(){
				axios
					.get('http://127.0.0.1:4040/api/tunnels/001')
					.then(res => {
						console.log(`statusCode: ${res.status}`)
						console.log(`publicURL: ${res.data.public_url}`)
						channel.send(`${res.data.public_url}`)
						url = `${res.data.public_url}`
					})
					.catch(error => {
						console.error(error)
					})
			}, 10000);

			break;
		case '!list' : 					//this will send the entire status JSON of the ngrok connection to the debug console
			try{
				axios
					.get('http://localhost:4040/api/tunnels/001')
					.then(res => {
						console.log(`statusCode: ${res.status}`)
						url = `${res.data.public_url}`
					})
					.catch(error => {
						console.error(error)
					});
				}
			break;
		case '!writePubURL' : 			//writes the public URL of the ngrok connection to the Message Channel and the debug console
			try{
				axios
					.get('http://localhost:4040/api/tunnels/001')
					.then(res => {
						console.log(`statusCode: ${res.status}`)
						//console.log(res)
						console.log(`publicURL: ${res.data.public_url}`)
						channel.send(`${res.data.public_url}`)
						url = `${res.data.public_url}`
					})
					.catch(error => {
						console.error(error)
					});
				}
			break;
	}
});

client.login(BOT_TOKEN);
async function connect() {				//handles the initial connection to ngrok
	console.log('connecting to ngrok');
	try {
		const tunnel = await ngrok.connect({authtoken: NGROK_TOKEN, proto: 'tcp', addr: 25565, region: 'eu', name: '001'});
		Promise.resolve(tunnel);
	} catch (e) {
		console.log('Error while connecting to ngrok \n', e);
		const channel = client.channels.cache.get('938154425158107167');
		channel.send('Probably couldn' + "'" + 't connect ngrok, try "!kill"');
	}
	return null;
}
