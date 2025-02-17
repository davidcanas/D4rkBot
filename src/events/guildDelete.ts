import Client from '../structures/Client';

import { Guild } from 'eris';

export default class GuildDelete {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async run(guild: Guild) {
    this.client.guildDB.findOneAndDelete({ guildID: guild.id });
    this.client.guildCache.delete(guild.id);

    const embed = new this.client.embed()
      .setTitle(':frowning2: Saí de um servidor')
      .setColor('RANDOM')
      .addField('Nome', `\`${guild.name}\``, true)
      .addField(':crown: Dono', `\`${this.client.users.get(guild.ownerID)?.username}#${this.client.users.get(guild.ownerID)?.discriminator}\``, true)
      .addField(':closed_book: ID', `\`${guild.id}\``, true)
      .addField(':man: Membros', `\`${guild.members.size}\``, true)
      .setThumbnail(guild.dynamicIconURL() ?? '')
      .setTimestamp();

    const channel = await this.client.users.get('334054158879686657')?.getDMChannel();

    channel && this.client.createMessage(channel.id, { embeds: [embed] });

    for (const collector of this.client.messageCollectors) {
      if (collector.channel.type === 0 && collector.channel.guild.id === guild.id) {
        collector.stop('Guild Delete');
      }
    }

    for (const collector of this.client.componentCollectors) {
      if (collector.message.guildID === guild.id) {
        collector.stop('Guild Delete');
      }
    }
  }
}