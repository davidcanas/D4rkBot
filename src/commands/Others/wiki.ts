import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext, { Type } from '../../structures/CommandContext';

import fetch from 'node-fetch';

import sbd from 'sbd';
import { Message } from 'eris';

export default class Wiki extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'wiki',
      description: 'Pesquisa algo na wikipedia.',
      aliases: ['wikipedia'],
      category: 'Others',
      args: 1,
      cooldown: 5,
      usage: '<Palavra/Frase>'
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    let msg: Message

    if (ctx.type === Type.MESSAGE) {
      msg = await ctx.sendMessage('<a:loading2:805088089319407667> A procurar...', true) as Message;
    } else {
      await ctx.defer();
    }

    const content = {
      articleName: ctx.args.join(' '),
      lang: 'pt'
    }

    const res = await fetch('https://api.algorithmia.com/v1/algo/web/WikipediaParser/0.1.2?timeout=300', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Simple ${process.env.AlgorithmiaKey}`
      },
      body: JSON.stringify(content)
    }).then(res => res.json()).then(r => r.result)

    if (!res) {
      if (ctx.type === Type.INTERACTION) {
        ctx.sendMessage(':x: Não encontrei nada na wikipedia.');
      } else {
        msg!.edit(':x: Não encontrei nada na wikipedia.');
      }
      return;
    }

    const text = res.content.split('\n').filter((line: string) => {
      if (line.trim().length === 0 || line.trim().startsWith('='))
        return false;
      return true;
    }).join(' ').replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g, ' ');

    const summary = sbd.sentences(text).slice(0, 5).join('\n');

    const embed = new this.client.embed()
      .setColor('RANDOM')
      .setTitle(`Wikipedia (${res.title})`)
      .setThumbnail(res.images.find((url: string) => url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg')) || 'https://www.wikipedia.org/portal/wikipedia.org/assets/img/Wikipedia-logo-v2.png')
      .setDescription(summary)
      .setURL(res.url)
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());


    if (ctx.type === Type.INTERACTION) {
      ctx.sendMessage({ content: '', embeds: [embed] });
    } else {
      msg!.edit({ content: '', embeds: [embed] });
    }
  }
}