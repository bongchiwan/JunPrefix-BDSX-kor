"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
/*
    @name JunPrefix
    @version 1.0.0
    plugin for bdsx
 */
const packetids_1 = require("bdsx/bds/packetids");
const common_1 = require("bdsx/common");
const event_1 = require("bdsx/event");
const packets_1 = require("bdsx/bds/packets");
const command_1 = require("bdsx/command");
const form_1 = require("bdsx/bds/form");
const command_2 = require("bdsx/bds/command");
const server_1 = require("bdsx/bds/server");
const fs = require('fs');
let config = {
    "default_prefix": "§f§l뉴비",
    "chat_format": "@칭호@ §r§f@닉네임@ §r§f:: §r§7@채팅@"
};
try {
    config = require(__dirname + '/JunPrefix_config.json');
}
catch (e) {
}
let db = {};
try {
    db = require(__dirname + '/JunPrefix_data.json');
}
catch (e) {
}
function make_player_data(player) {
    if (db.hasOwnProperty(player.getUniqueIdLow().toString() + '|' + player.getUniqueIdHigh())) {
        return;
    }
    db[player.getUniqueIdLow().toString() + '|' + player.getUniqueIdHigh().toString()] = {
        "main_prefix": config.default_prefix,
        "prefixs": []
    };
}
function get_player_data(player) {
    if (!db.hasOwnProperty(player.getUniqueIdLow().toString() + '|' + player.getUniqueIdHigh())) {
        return null;
    }
    return db[player.getUniqueIdLow().toString() + '|' + player.getUniqueIdHigh()];
}
function get_player_main_prefix(player) {
    var _a, _b;
    return (_b = (_a = get_player_data(player)) === null || _a === void 0 ? void 0 : _a.main_prefix) !== null && _b !== void 0 ? _b : config.default_prefix;
}
command_1.command.register('칭호', '칭호를 관리합니다.').overload(async (param, origin) => {
    const sender = origin.getEntity();
    if (sender === null) {
        return;
    }
    let buttons = [new form_1.FormButton('§l칭호 관리하기')];
    if (sender.getCommandPermissionLevel() === command_2.CommandPermissionLevel.Operator) {
        buttons.push(new form_1.FormButton('§l§c[OP] §r§l칭호 지급하기'));
        buttons.push(new form_1.FormButton('§l§c[OP] §r§l칭호 뺏기'));
    }
    const form = new form_1.SimpleForm('§l칭호 관리하기', '', buttons);
    form.sendTo(sender.getNetworkIdentifier(), (form, target) => {
        const response = form.response;
        if (response === 0) {
            PrefixManage.manage_form(target.getActor());
        }
        if (response === 1) {
            PrefixManage.givePrefix_form(target.getActor());
        }
        if (response === 2) {
            PrefixManage.delete_form(target.getActor());
        }
    });
}, {});
class PrefixManage {
    static manage_form(player) {
        let prefixs = [config.default_prefix];
        const data = get_player_data(player);
        let main_prefix = config.default_prefix;
        if (data !== null) {
            main_prefix = data.main_prefix;
            data.prefixs.forEach((value) => {
                prefixs.push(value);
            });
        }
        let buttons = [];
        prefixs.forEach(value => {
            buttons.push(new form_1.FormButton((main_prefix === value ? '§r§f✅§r' : '') + value));
        });
        const form = new form_1.SimpleForm('§l칭호 관리하기', '사용하고 싶은 칭호를 선택해주세요.', buttons);
        form.sendTo(player.getNetworkIdentifier(), (form, identifier) => {
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
    static givePrefix_form(player) {
        let buttons = [];
        const playerMap = server_1.serverInstance.getPlayers();
        playerMap.forEach(player => {
            buttons.push(new form_1.FormButton('§l' + player.getName() + '\n§r§8해당 유저에게 칭호를 지급할래요.'));
        });
        const form = new form_1.SimpleForm('§l칭호 지급하기', '칭호를 지급할 유저를 선택해주세요.', buttons);
        form.sendTo(player.getNetworkIdentifier(), (form, target) => {
            const response = form.response;
            if (response === null) {
                return;
            }
            const target_player = playerMap[response];
            const input_form = new form_1.CustomForm('§l칭호 지급하기', [new form_1.FormInput('지급할 칭호를 입력해주세요.', '§l§eVIP')]);
            input_form.sendTo(target, (form, target) => {
                const response = form.response;
                if (response === null || response[0] === '') {
                    return;
                }
                const sender = target.getActor();
                if (this.givePrefix(target_player, response[0])) {
                    sender.sendMessage('§a§l[칭호] §r§f칭호를 지급했어요.');
                }
                else {
                    sender.sendMessage('§a§l[칭호] §r§f이미 해당 유저는 §e' + response[0] + '§f 칭호를 이미 소유하고 있어요.');
                }
            });
        });
    }
    static delete_form(player) {
        let buttons = [];
        const playerMap = server_1.serverInstance.getPlayers();
        playerMap.forEach(player => {
            buttons.push(new form_1.FormButton('§l' + player.getName() + '\n§r§8해당 유저에게 칭호를 지급할래요.'));
        });
        const form = new form_1.SimpleForm('§l칭호 지급하기', '칭호를 지급할 유저를 선택해주세요.', buttons);
        form.sendTo(player.getNetworkIdentifier(), (form, target) => {
            const response = form.response;
            if (response === null) {
                return;
            }
            const player = target.getActor();
            if (player === null) {
                return;
            }
            const target_player = playerMap[response];
            let prefixs = [];
            const data = get_player_data(target_player);
            if (data !== null) {
                data.prefixs.forEach((value) => {
                    prefixs.push(value);
                });
            }
            let buttons = [];
            prefixs.forEach(value => {
                buttons.push(new form_1.FormButton(value));
            });
            const take_form = new form_1.SimpleForm('§l칭호 뺏기', '뺏고 싶은 칭호를 선택해주세요.', buttons);
            take_form.sendTo(player.getNetworkIdentifier(), (form, identifier) => {
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
                    player.sendMessage('§a§l[칭호] §r§f해당 칭호를 뺏었어요.');
                }
                else {
                    player.sendMessage('§a§l[칭호] §r§f알 수 없는 오류가 발생했어요.');
                }
            });
        });
    }
    static deletePrefix(player, index) {
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
    static givePrefix(player, prefix) {
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
event_1.events.packetSend(packetids_1.MinecraftPacketIds.Text).on((ev, networkIdentifier) => {
    if (ev.type !== packets_1.TextPacket.Types.Chat) {
        return;
    }
    ev.type = packets_1.TextPacket.Types.Raw;
    const player = networkIdentifier.getActor();
    if (player === null) {
        return common_1.CANCEL;
    }
    ev.message = config.chat_format.replace('@닉네임@', ev.name).replace('@칭호@', get_player_main_prefix(player)).replace('@채팅@', ev.message);
});
function save_db() {
    fs.writeFile(__dirname + '/JunPrefix_config.json', JSON.stringify(config), () => {
    });
    fs.writeFile(__dirname + '/JunPrefix_data.json', JSON.stringify(db), () => {
    });
}
event_1.events.serverLeave.on(() => {
    save_db();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7Ozs7OztFQWVFOztBQUVGOzs7O0dBSUc7QUFFSCxrREFBc0Q7QUFDdEQsd0NBQW1DO0FBQ25DLHNDQUFrQztBQUVsQyw4Q0FBNEM7QUFDNUMsMENBQXFDO0FBQ3JDLHdDQUE0RjtBQUM1Riw4Q0FBd0Q7QUFDeEQsNENBQStDO0FBRS9DLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUV6QixJQUFJLE1BQU0sR0FBRztJQUNULGdCQUFnQixFQUFFLFFBQVE7SUFDMUIsYUFBYSxFQUFFLGdDQUFnQztDQUNsRCxDQUFDO0FBRUYsSUFBSTtJQUNBLE1BQU0sR0FBRyxPQUFPLENBQUMsU0FBUyxHQUFHLHdCQUF3QixDQUFDLENBQUM7Q0FDMUQ7QUFBQyxPQUFPLENBQUMsRUFBRTtDQUVYO0FBT0QsSUFBSSxFQUFFLEdBQXlDLEVBQUUsQ0FBQztBQUVsRCxJQUFJO0lBQ0EsRUFBRSxHQUFHLE9BQU8sQ0FBQyxTQUFTLEdBQUcsc0JBQXNCLENBQUMsQ0FBQztDQUNwRDtBQUFDLE9BQU8sQ0FBQyxFQUFFO0NBQ1g7QUFFRCxTQUFTLGdCQUFnQixDQUFDLE1BQWM7SUFDcEMsSUFBSSxFQUFFLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsQ0FBQyxRQUFRLEVBQUUsR0FBRyxHQUFHLEdBQUcsTUFBTSxDQUFDLGVBQWUsRUFBRSxDQUFDLEVBQUU7UUFDeEYsT0FBTztLQUNWO0lBQ0QsRUFBRSxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsQ0FBQyxRQUFRLEVBQUUsR0FBRyxHQUFHLEdBQUcsTUFBTSxDQUFDLGVBQWUsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLEdBQUc7UUFDakYsYUFBYSxFQUFFLE1BQU0sQ0FBQyxjQUFjO1FBQ3BDLFNBQVMsRUFBRSxFQUFFO0tBQ2hCLENB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
