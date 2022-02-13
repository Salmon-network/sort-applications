/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const GETTEXT_DOMAIN = 'my-indicator-extension';

const { Gio, GLib, GObject, St, Shell } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const _ = ExtensionUtils.gettext;
const extension = ExtensionUtils.getCurrentExtension();

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('My Shiny Indicator'));

        this.add_child(new St.Icon({
            icon_name: 'face-smile-symbolic',
            style_class: 'system-status-icon',
        }));

        let item = new PopupMenu.PopupMenuItem(_('Show Notification'));

        sortAppPicker();

        // settings.sync();

        // let picker = new Array(Math.ceil(items.length / 24)).fill().map((e, i) => {
        //     return items.slice(24*i, 24*(i+1));
        // });

        // log(JSON.stringify(picker));

        item.connect('activate', () => {
            // Main.notify(_('Whatʼs up, folks?'));
            Main.notify(JSON.stringify(settings.get_value("app-picker-layout")));
        });
        this.menu.addMenuItem(item);
    }
});

class Extension {
    constructor(uuid) {
        this._uuid = uuid;

        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
    }

    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this._uuid, this._indicator);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}

function sortAppPicker(){
    let settings = Gio.Settings.new("org.gnome.shell");

    let items = [];
    settings.get_value("app-picker-layout").recursiveUnpack().forEach((e) => {
        Array.prototype.push.apply(items, Object.keys(e));
        // items.push(Object.keys(e));
    });
    log(items);

    //items.map(e => Gio.DesktopAppInfo.get_locale_string(e));
    //log(items);

    items = items.map(e => {
        let obj = {};
        obj["id"] = e;
        obj["locale_name"] = getLocaleName(e);
        return obj;
    });
    items.sort((a, b) => a["locale_name"].localeCompare(b["locale_name"]));
    log(JSON.stringify(items));

    let picker = new Array(Math.ceil(items.length / 24)).fill().map(e => new Object());
    log(picker[0])
    items = items.forEach((e, i) => {
        let pos = {};
        pos["position"] = i % 24;
        let Gpos = new GLib.Variant("a{si}", pos);
        // log(Gpos.print(true));

        let obj = {};
        obj[e["id"]] = Gpos;
        // let Gobj = new GLib.Variant("a{sv}", obj);
        // log(Gobj.print(true));

        picker[Math.floor(i/24)][e["id"]] = Gpos;
    })

    //picker = picker.map(e => new GLib.Variant("a{sv}", e));
    let Gpicker = new GLib.Variant("aa{sv}", picker);
    log(Gpicker.print(true));

    settings.set_value("app-picker-layout", Gpicker);
}

function getLocaleName(id){
    let app = Gio.DesktopAppInfo.new(id);
    if(app === null){
        let folder = Gio.Settings.new_with_path("org.gnome.desktop.app-folders.folder",
                                                "/org/gnome/desktop/app-folders/folders/" + id + "/");
        return _getFolderName(folder);
    } else {
        return app.get_locale_string("Name");
    }
}


// from gnome-shell code
function _getFolderName(folder) {
    let name = folder.get_string('name');

    if (folder.get_boolean('translate')) {
        let translated = Shell.util_get_translated_folder_name(name);
        if (translated !== null)
            return translated;
    }

    return name;
}
