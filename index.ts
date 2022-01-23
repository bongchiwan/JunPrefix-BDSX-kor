/*
       _             _____           ______ __
      | |           |  __ \         |____  / /
      | |_   _ _ __ | |  | | _____   __ / / /_
  _   | | | | | '_ \| |  | |/ _ \ \ / // / '_ \
 | |__| | |_| | | | | |__| |  __/\ V // /| (_) |
  \____/ \__,_|_| |_|_____/ \___| \_//_/  \___/


Developers:
 - JunDev76 (https://github.jundev.me/)

Copyright 2022. JunDev76. Allrights reserved.
*/

/*
    @name JunPrefix
    @version 1.0.0
    plugin for bdsx
 */

import {MinecraftPacketIds} from "bdsx/bds/packetids";
import {CANCEL} from "bdsx/common";
import {events} from "bdsx/event";
import {Player} from "bdsx/bds/player";
import {TextPacket} from "bdsx/bds/packets";
import {command} from "bdsx/command";
import {CustomForm, Form, FormButton, FormData, FormInput, SimpleForm} from "bdsx/bds/form";
import {CommandPermissionLevel} from "bdsx/bds/command";
import {serverInstance} from "bdsx/bds/server";

const fs = require('fs');

let config = {
    "default_prefix": "§f§l뉴비",
    "chat_format": "@칭호@ §r§f@닉네임@ §r§f:: §r§7@채팅@"
};

try {
    config = require(__dirname + '/JunPrefix_config.json');
} catch (e) {

}

interface prefix_data_style {
    main_prefix: string;
    prefixs: string[];
}

let db: { [key: string]: prefix_data_style } = {};

try {
    db = require(__dirname + '/JunPrefix_data.json');
} catch (e) {
}

function make_player_data(player: Player): void {
    if (db.hasOwnProperty(player.getUniqueIdLow().toString() + '|' + player.getUniqueIdHigh())) {
        return;
    }
    db[player.getUniqueIdLow().toString() + '|' + player.getUniqueIdHigh().toString()] = {
        "main_prefix": config.default_prefix,
        "prefixs": []
    };
}

function get_player_data(player: Player): null | prefix_data_style {
    if (!db.hasOwnProperty(player.getUniqueIdLow().toString() + '|' + player.getUniqueIdHigh())) {
        return null;
    }

    return db[player.getUniqueIdLow().toString() + '|' + player.getUniqueIdHigh()];
}

function get_player_main_prefix(player: Player): string {
    return get_player_data(player)?.main_prefix ?? config.default_prefix;
}

command.register('칭호', '칭호를 관리합니다.').overload(async (param, origin) => {
    const sender = origin.getEntity();
    if (sender === null) {
        return;
    }
    let buttons = [new FormButton('§l칭호 관리하기')];
    if (sender.getCommandPermissionLevel() === CommandPermissionLevel.Operator) {
        buttons.push(new FormButton('§l§c[OP] §r§l칭호 지급하기'));
        buttons.push(new FormButton('§l§c[OP] §r§l칭호 뺏기'));
    }
    const form = new SimpleForm('§l칭호 관리하기', '', buttons);
    form.sendTo(sender.getNetworkIdentifier(), (form: Form<FormData>, target) => {
        const response = form.response;
        if (response === 0) {
            PrefixManage.manage_form(target.getActor()!);
        }
        if (response === 1) {
            PrefixManage.givePrefix_form(target.getActor()!);
        }
        if (response === 2) {
            PrefixManage.delete_form(target.getActor()!);
        }
    });
}, {});

class PrefixManage {

    static manage_form(player: Player): void {
        let prefixs = [config.default_prefix];
        const data = get_player_data(player);
        let main_prefix = config.default_prefix;
        if (data !== null) {
            main_prefix = data.main_prefix;
            data.prefixs.forEach((value) => {
                prefixs.push(value);
            });
        }
        let buttons: FormButton[] = [];
        prefixs.forEach(value => {
            buttons.push(new FormButton((main_prefix === value ? '§r§f✅§r' : '') + value));
        })
        const form = new SimpleForm('§l칭호 관리하기', '사용하고 싶은 칭호를 선택해주세요.', buttons);
        form.sendTo(player.getNetworkIdentifier(), (form: Form<FormData>, identifier) => {
            const response = form.response;
            if (response === null || response === 0) {
                return;
            }

            const player = identifier.getActor();
            if (player === null) {
                return;
            }

            make_player_data(player);
            const data = get_player_data(player);
            if (data === null) {
                return;
            }

            data.main_prefix = data.prefixs[(response - 1)];
            player.sendMessage('§a§l[칭호] §r§f칭호 §e' + data.main_prefix + '§f를 선택했어요.');
        });
    }

    static givePrefix_form(player: Player): void {
        let buttons: FormButton[] = [];
        const playerMap = serverInstance.getPlayers();
        playerMap.forEach(player => {
            buttons.push(new FormButton('§l' + player.getName() + '\n§r§8해당 유저에게 칭호를 지급할래요.'));
        });
        const form = new SimpleForm('§l칭호 지급하기', '칭호를 지급할 유저를 선택해주세요.', buttons);
        form.sendTo(player.getNetworkIdentifier(), (form: Form<FormData>, target) => {
            const response = form.response;
            if (response === null) {
                return;
            }

            const target_player = playerMap[response];

            const input_form = new CustomForm('§l칭호 지급하기', [new FormInput('지급할 칭호를 입력해주세요.', '§l§eVIP')]);
            input_form.sendTo(target, (form: Form<FormData>, target) => {
                const response = form.response;
                if (response === null || response[0] === '') {
                    return;
                }

                const sender = target.getActor()!;

                if (this.givePrefix(target_player, response[0])) {
                    sender.sendMessage('§a§l[칭호] §r§f칭호를 지급했어요.');
                } else {
                    sender.sendMessage('§a§l[칭호] §r§f이미 해당 유저는 §e' + response[0] + '§f 칭호를 이미 소유하고 있어요.');
                }
            });
        });
    }

    static delete_form(player: Player): void {
        let buttons: FormButton[] = [];
        const playerMap = serverInstance.getPlayers();
        playerMap.forEach(player => {
            buttons.push(new FormButton('§l' + player.getName() + '\n§r§8해당 유저에게 칭호를 지급할래요.'));
        });
        const form = new SimpleForm('§l칭호 지급하기', '칭호를 지급할 유저를 선택해주세요.', buttons);
        form.sendTo(player.getNetworkIdentifier(), (form: Form<FormData>, target) => {
            const response = form.response;
            if (response === null) {
                return;
            }

            const player = target.getActor();
            if (player === null) {
                return;
            }

            const target_player = playerMap[response];

            let prefixs: string[] = [];
            const data = get_player_data(target_player);
            if (data !== null) {
                data.prefixs.forEach((value) => {
                    prefixs.push(value);
                });
            }
            let buttons: FormButton[] = [];
            prefixs.forEach(value => {
                buttons.push(new FormButton(value));
            })
            const take_form = new SimpleForm('§l칭호 뺏기', '뺏고 싶은 칭호를 선택해주세요.', buttons);
            take_form.sendTo(player.getNetworkIdentifier(), (form: Form<FormData>, identifier) => {
                const response = form.response;
                if (response === null) {
                    return;
                }

                const player = identifier.getActor();
                if (player === null) {
                    return;
                }

                make_player_data(target_player);
                const data = get_player_data(target_player);
                if (data === null) {
                    return;
                }

                if (this.deletePrefix(target_player, response)) {
                    player.sendMessage('§a§l[칭호] §r§f해당 칭호를 뺏었어요.')
                } else {
                    player.sendMessage('§a§l[칭호] §r§f알 수 없는 오류가 발생했어요.')
                }
            });
        });
    }

    static deletePrefix(player: Player, index: number): boolean {
        make_player_data(player);
        const data = get_player_data(player);
        if (data === null) {
            // 발생될 일 없음.
            return false;
        }

        if (data.prefixs.length < index) {
            return false;
        }

        if (data.prefixs[index] === data.main_prefix) {
            data.main_prefix = config.default_prefix;
        }

        data.prefixs = data.prefixs.filter((value, index_) => {
            return index_ !== index;
        });
        return true;
    }

    static givePrefix(player: Player, prefix: string): boolean {
        make_player_data(player);
        const data = get_player_data(player);
        if (data === null) {
            // 발생될 일 없음.
            return false;
        }

        if (!data.prefixs.includes(prefix)) {
            data.prefixs.push(prefix);
            return true;
        }
        return false;
    }

}

events.packetSend(MinecraftPacketIds.Text).on((ev, networkIdentifier) => {
    if (ev.type !== TextPacket.Types.Chat) {
        return;
    }
    ev.type = TextPacket.Types.Raw;
    const player: any = networkIdentifier.getActor();
    if (player === null) {
        return CANCEL;
    }
    ev.message = config.chat_format.replace('@닉네임@', ev.name).replace('@칭호@', get_player_main_prefix(player)).replace('@채팅@', ev.message);
});


function save_db(): void {
    fs.writeFile(__dirname + '/JunPrefix_config.json', JSON.stringify(config), () => {
    });
    fs.writeFile(__dirname + '/JunPrefix_data.json', JSON.stringify(db), () => {
    });
}

events.serverLeave.on(() => {
    save_db();
});
