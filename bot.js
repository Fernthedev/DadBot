const {Client, RichEmbed, Attachment} = require("discord.js");
const Child = require("child_process");

//Importing Settings Such as Dev ID and Token
const Settings = require("./settings.json");
//Importing Bot Name
const Package = require("./package.json");
const Bot = new Client();
const Snek = require("snekfetch");
var fs = require('fs');
const File = "./servers.json";
let Owner;
//This is so that server owners can toggle the bot off without having to kick him
var ServerMap = {};

const Reaction = {
    done: "✅",
    failed: "❌",
    timeout: 5e3
}

const eightball = ["yes", "no", "maybe", "probably", "unlikely"];

const SaveServers = (c) => {
    fs.writeFile(File, JSON.stringify(ServerMap), () => {
        c();
    });
}

//Triggers when the bot is logged in
Bot.on('ready', () =>{
    let Members = 0;
    //Adding onto the Member Count
    Bot.guilds.forEach(g => Members += g.memberCount);``
    //Loggint amount of servers and members
    console.log(`${Package.name} is online on ${Bot.guilds.size} servers for a total of ${Members} members`);
    //setting all server id's to true so the bot is enabled by default
    Bot.fetchApplication().then(a => {
        Owner = a.owner
    })
    fs.readFile(File, (err, data) => {
        if (err) throw err;
        ServerMap = JSON.parse(data)
    });
})


//Triggers when the Bot recives a message
Bot.on('message',async Message => {
    //Checking if the Message was sent By a Bot
    if(Message.author.bot)return;

    //Checking if the message is in a dm to the bot. if so then it simply gives you its invite link
    if(Message.channel.type == "dm"){
        return Message.channel.send(`Here is my Invite Code: https://discordapp.com/oauth2/authorize?client_id=397646331415494694&scope=bot&permissions=314432`);
    }

    //makes sure that the bot is mentioned
    if(Message.isMentioned(Bot.user)){
        //checks if the message was sent By the Dev
        if(!Owner){
            let a = await Bot.fetchApplication();
            Owner = a.owner;
        }
        if(typeof Owner != "undefined"|| Message.author.id == Owner.id){
            //allows for the dev to remotely shut off the bot
            if(/exit/ig.test(Message)){
                Child.exec("pm2 delete DadBot", (e, out, err) => {
                    if (e) {
                        Message.channel.send(e).then(() => {
                            Message.react(Reaction.failed).then(r => {
                                setTimeout(r.remove(), Reaction.timeout);
                            })
                        })
                    } else {
                        Message.react(Reaction.done).then(r => {
                            setTimeout(r.remove(), Reaction.timeout)
                        })
                    }
                    return
                })
            }
            if(/update/ig.test(Message)){
                Child.exec("git pull", () => {
                    Child.exec("pm2 restart DadBot", () => {
                        Message.react(Reaction.done).then(r => {
                            setTimeout(r.remove(), Reaction.timeout);
                        })
                    })
                })
            }
            if (/restart/ig.test(Message)) {
                Child.exec("pm2 restart DadBot", (e, out, err) => {
                    if(e){
                        Message.channel.send(e).then(() => {
                            Message.react(Reaction.failed).then(r => {
                                setTimeout(r.remove(), Reaction.timeout);
                            })
                        })
                    }else{
                        Message.react(Reaction.done).then(r => {
                            setTimeout(r.remove(), Reaction.timeout)
                        })
                    }
                })
            }
        }

        //checks if you are asking the bot for help
        if(/help/ig.test(Message)){
            let reply = `
            Heya you asked for my help so let me give you a brief overview of what i can do.
            i function using regex so you can just include my commands instead of calling them.
            e.g
            \`\`\`@dadbot give me a dad joke\`\`\` opposed to \`\`\`@dadbot dadjoke\`\`\`
            so my abilities are:
            **Help** sends you a message with all my abilities ***DUH***
            **stop** will stop responding to you with hi [Inset message here], im dad
            **start** will resume annoying you
            **joke** will send a random joke from the /r/jokes subreddit
            **dad joke** will send a random dad joke from the /r/dadjokes subreddit
            **dab** will dab
            **daddy** will fulfill any of your pleasures
            **proud** will tell you if he is proud of you or not.

            If you need any Additional Assistance join my owners Bot server: https://discord.gg/KBrxfzq.
            
            If you want to Invite me you can use this Link: https://discordapp.com/oauth2/authorize?client_id=397646331415494694&scope=bot&permissions=314432`//**kys** *(or asking the bot to die in any way) will make him shut down
            Message.member.send(reply);
            Message.react(Reaction.done).then(m => {
                setTimeout(() => { m.remove() }, Reaction.timeout)
            })
            return
        }

		else if(/stop/ig.test(Message)){//checking if you are asking for the bot to stop
            if (Message.member.hasPermission("ADMINISTRATOR") || Message.author.id == Settings.id) {
                delete(ServerMap[Message.guild.id])
                SaveServers(() => {
                    Message.react(Reaction.done).then(m => {
                        setTimeout(() => {m.remove()}, Reaction.timeout)
                    })
                })
                return 
            } else {
                Message.react(Reaction.failed).then(m => {
                    setTimeout(() => { m.remove() }, Reaction.timeout)
                })
                return
            }
		}

		if(/start/ig.test(Message)){ //checking if you are asking for the bot to resume
            if (Message.member.hasPermission("ADMINISTRATOR") || Message.author.id == Settings.id) {
                ServerMap[Message.guild.id] = true;
                SaveServers(() => {
                    Message.react(Reaction.done).then(m => {
                        setTimeout(() => { m.remove() }, Reaction.timeout)
                    })
                })
                return;
            } else {
                Message.react(Reaction.failed).then(m => {
                    setTimeout(() => { m.remove() }, Reaction.timeout)
                })
                return
            }
        }

        //checks if the word dadjoke appears somewhere in the message
        if(/(dad(\s+|)joke)/ig.test(Message)){
            //if so then it fetches a random dadjoke off of reddit and sends it into the chat
            Snek.get("https://www.reddit.com/r/dadjokes.json?limit=1000")
            .then(res => {
                const f= JSON.parse(res.text)
                 let url = f.data.children[Math.ceil(Math.random() * f.data.children.length - 1)].data;
                 let joke = new RichEmbed()
                 .setTitle("DadJoke:")
                 .setColor("960ddb")
                 .addField(url.title, url.selftext.toString());
                 Message.channel.send(joke);
             })
        }
        else
        if(/joke/ig.test(Message)){
            //if so then it fetches a random dadjoke off of reddit and sends it into the chat
            Snek.get("https://www.reddit.com/r/jokes.json?limit=1000")
            .then(res => {
                const f= JSON.parse(res.text)
                 let url = f.data.children[Math.ceil(Math.random() * f.data.children.length - 1)].data;
                 Message.channel.send(url.title + "\n\n" + url.selftext.toString());
             })
        }

        if(/(mom.*gay|gay.*mom)/gi.test(Message)){
            return Message.reply("Ur sister a Mister!");
        }

        //checks for the word proud in the message
        if(/proud/gi.test(Message)){
            //if so it randomly sends one of two messages
            if(Math.round(Math.random()) == 0){
                return Message.reply("I'm proud of you son :)");
            }else{
                return Message.reply("You are a Dissapointment to your Mother and Me");
            }
        }
        
        //checks if the message contains daddy
        if(/daddy/gi.test(Message)){
            //if so reply
            return Message.reply(Math.random().round() == 0 ? "That's kinda hot" : "please please, you may only call me daddy behind closed doors.");
        }
        
        //check if you are asking the bot to dab
        if(/dab/gi.test(Message)){
            return Message.reply(new Attachment(Math.round(Math.random()) == 0 ? "https://s-media-cache-ak0.pinimg.com/originals/cc/f2/0e/ccf20e7aba60f7bcd7f2ba8838c65327.jpg" : "https://d2g8igdw686xgo.cloudfront.net/20131494_1493864445.1698.jpg"));
        }
        
        if(/\?$/gi.test(Message)){
            return Message.reply(eightball[Math.random() * eightball.length | 0]);
        }

        if(/eval/gi.test(Message)){
            if (!Message.author.id == Settings.id)return;
            let code = Message.content.slice(Message.content.indexOf("eval"), Message.content.length);
            try{
                let r = eval(code)
                Message.reply(r);
            }catch(err){
                Message.reply(err);
            }
        }

        //checks if you are asking the bot to die
        // if(/(kys|die|fuck\s+(off|you)|kill\s+your\s+self)/gi.teste(Message)){
        //     Message.channel.send(new Attachment("https://www.wikihow.com/images/b/b2/User-Completed-Image-Tie-a-Noose-2017.01.05-18.21.58.0.png"));
        // }

    }

    //checks if the server has the bot enabled
    if(Message.channel.type != "dm" && ServerMap[Message.guild.id] === true){

        //if so then it checks if the message has im [Something] in it
        let k = /\b(im|i'm|i`m|i‘m)\s(.+)/ig.exec(Message.content);
        if(!k)return;
        //sends the message back
        Message.channel.send(`Hello ${k[2]}, i'm Dad!`);
    }
})

//Triggers when the bot gets invited to a new Server
Bot.on('guildCreate', g => {
    //Sends the Owner a Dm telling him how to stop the Bot
    g.owner.createDM().then(o => {
        o.send("heya im Dadbot i will do stupid shit. if you want me to stop just send **@DadBot stop**, and you want me to resume my shenanigans then use **start** instead of stop");
    });
    //Sets the ServerID to true so the bot is enabled
    ServerMap[g.id] = true;
    SaveServers(() => {

    });
})

//Watches out for unhandled rejections and loggs them
process.on("unhandledRejection", console.error);


//Loggs the bot into discord
Bot.login(Settings.token);

Number.prototype.round = function(){
    return Math.round(this)
}