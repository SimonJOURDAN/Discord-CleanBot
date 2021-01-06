const Discord = require('discord.js');
const config = require('./configdiscord.json');
const fs = require('fs');

const client = new Discord.Client();

client.once('ready', () => {
	console.log('Wall-E ready!');
});

client.on('message', message => {

    if(message.content == config.prefix+"clean"){
        if(isProtected(message.channel.id)){
            message.react('🛑');
            let user = protector(message.channel.id);
            message.channel.send(`Ce salon est protégé par <@${user}>`);
        }else{
            message.react('🧹');
            clean(message);
        }
    }

    if(message.content == config.prefix+"help"){
        message.react('📄');
        const embed = new Discord.MessageEmbed()
        .setTitle('Help')
        .setColor(0xfcbc62)
        .setDescription(
            '🧹 `-clean` supprime tout les messages non épinglés de ce salon\n'+
            '🔒 `-lock` verrouille le salon\n'+
            '🔓 `-unlock` deverrouille le salon\n'+
            '🏓 `-ping` vérifie la latence avec le bot\n'+
            '📄 `-help` affiche ce message\n');
        message.channel.send(embed);
    }

    if(message.content == config.prefix+"unlock"){
        if(isProtected(message.channel.id)){
            let user = protector(message.channel.id)
            if(user == message.author){
                unprotect(message.channel.id);
                message.react('🔓');
            }else{
                message.react('🛑');
                message.channel.send(`Ce salon est verrouillé par <@${user}>`);
            }
        }else{
            message.react('🛑');
            message.channel.send(`Ce salon n'est pas verrouillé`);
        }
    }

    if(message.content == config.prefix+"lock"){
            if(isProtected(message.channel.id)){
                message.react('🛑');
                let user = protector(message.channel.id);
                message.channel.send(`Ce salon est déjà verrouillé par <@${user}>`);
            }else{
                protect(message.channel.id, message.author.id);
                message.react('🔒');
            }
    }

    if(message.content == config.prefix+"ping"){
        message.react('🏓');
        message.channel.send('pong');
    }

});

/**
 * @description deletes up to 100 messages not pinned sent before the message in param
 * @param Discord.Message message
 * @returns the number of messages deleted
 * @author Simon Jourdan
 */
async function deleteMessages(message){    //on ne peut supprimer les messages que 100 par 100
    let currentchannel = message.channel;
    let messages = await currentchannel.messages.fetch({limit: 100, before: message.id});
    messages = messages.filter(message => (message.deleted || message.pinned) == false);    //on supprime uniquement les messages non épinglés ou déjà supprimés
    await currentchannel.bulkDelete(messages);
    return messages.size;
}

/**
 * @description Calls deleteMessages() until the number of messages deleted is 0
 * @param Discord.Message message 
 * @author Simon Jourdan
 */
async function boucleDelete(message){
    let numMessage;
    do{
        numMessage = await deleteMessages(message); //on attends avant de relancer car on risque de relancer sur les mêmes messages
    }while(numMessage >= 1)
}

/**
 * @description add a gif showing that the bot is currently deleting messages, the gif is deleted at the end
 * @param Discord.Message message 
 * @author Simon Jourdan
 */
async function clean(message){  //ajout d'un gif qui permet de determiner si le bot est en train d'effacer des messages
    await message.channel.send( {files: ["./walle.gif"]});
    let gif;
    await message.channel.messages.fetch({limit: 1}).then(messages => {messages.forEach(message => { gif = message });});   //récupération du message gif
    await boucleDelete(gif);
    gif.delete();
}

/**
 * @description checks if the channel which id is in param is protected
 * @param Discord.Channel.id channelId
 * @returns boolean
 * @author Simon Jourdan
 */
function isProtected(channelId){    //vérification
    let file = fs.readFileSync('./protected.json', {encoding:'utf8'});
    let protections = JSON.parse(file).protections;
    
    let found = false;
    protections.forEach(protection => {
        if(protection.channelId == channelId){
            found = true;
        }
    })
    return found;
}

/**
 * @description gives the id of the user who protects the channel which id is in param
 * @param Discord.Channel.id channelId
 * @returns Discord.User.id 
 * @author Simon Jourdan
 */
function protector(channelId){
    let file = fs.readFileSync('./protected.json', {encoding:'utf8'});
    protections = JSON.parse(file).protections;

    let userId = undefined;
    protections.forEach(protection => {
        if(protection.channelId == channelId){
            userId = protection.userId;
        }
    })
    return userId;
}

/**
 * @description add an object composed of the channelId and the userId to the "database"
 * @param Discord.Channel.id channelId
 * @param Discord.User.id userId
 * @author Simon Jourdan
 */
function protect(channelId, userId){
    let file = fs.readFileSync('./protected.json', {encoding:'utf8'});
    protectionFile = JSON.parse(file);
    
    protectionFile.protections.push({"channelId": channelId, "userId": userId});
    
    let data = JSON.stringify(protectionFile);
    fs.writeFileSync('./protected.json', data, {encoding: 'utf-8'});
}

/**
 * @description remove the object protecting the channel from the "database"
 * @param Discord.Channel.id channelId
 * @author Simon Jourdan
 */
function unprotect(channelId){
    let file = fs.readFileSync('./protected.json', {encoding:'utf8'});
    protectionFile = JSON.parse(file);
    
    protectionFile.protections = protectionFile.protections.filter(protection => protection.channelId != channelId);
    
    let data = JSON.stringify(protectionFile);
    fs.writeFileSync('./protected.json', data, {encoding: 'utf-8'});
}

client.login(config.token);