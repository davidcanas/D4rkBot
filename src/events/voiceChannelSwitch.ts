import Client from '../structures/Client';

import { Member, VoiceChannel } from 'eris';

export default class VoiceChannelIdSwitch {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async run(member: Member, newChannel: VoiceChannel, oldChannel: VoiceChannel): Promise<void> {
    const rec = this.client.records.get(member.guild.id);
    if (rec && member.id === this.client.user.id) {
      clearTimeout(rec.timeout);
      rec.worker.postMessage({ op: 0 });
      this.client.records.delete(member.guild.id);
      return;
    }

    const player = this.client.music.players.get(member.guild.id);
    if (!player || member.bot) return;

    if (oldChannel.id === player.voiceChannelId && !oldChannel.voiceMembers.filter(m => !m.bot).length && newChannel.id !== player.voiceChannelId) {
      player.pause(true);

      const timeout = setTimeout(() => {
        this.client.createMessage(player.textChannelId!, ':x: Saí do canal de voz porque fiquei sozinho mais de 2 minutos').catch(() => { });
        player.destroy();
        this.client.music.channelTimeouts.get(member.guild.id)?.message?.delete().catch(() => { });
        this.client.music.channelTimeouts.delete(member.guild.id);
      }, 2 * 60 * 1000);

      const msg = await this.client.createMessage(player.textChannelId!, ':warning: Pausei a música porque fiquei sozinho no canal de voz, se ninguem aparecer irei sair em 2 minutos.').catch(() => null);

      this.client.music.channelTimeouts.set(member.guild.id, { timeout, message: msg });
      return;
    }

    if (newChannel.id === player.voiceChannelId && this.client.music.channelTimeouts.has(member.guild.id) && newChannel.voiceMembers.filter(m => !m.bot).length) {
      player.pause(false);
      const data = this.client.music.channelTimeouts.get(member.guild.id);
      if (!data) return;
      clearTimeout(data.timeout);
      data.message?.delete().catch(() => { });
      this.client.music.channelTimeouts.delete(member.guild.id);
    }
  }
}