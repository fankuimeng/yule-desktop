import { ipcMain, app, BrowserWindow } from "electron";
import { autoUpdater } from "electron-updater";
import { join } from "node:path";

export const updateUrl = "http://127.0.0.1:5500/update";

let win: BrowserWindow;
export function sendUpdateMessage(name: string, text: string) {
  win?.webContents.send("message", { name, text });
}
const autoUpdaterHandle = function (win: BrowserWindow) {
  win = win;
  const message = {
    error: "检测更新出错",
    checking: "正在检查更新……",
    updateAva: "检测到新版本，正在下载……",
    updateNotAva: "现在使用的就是最新版本，不用更新",
  };

  autoUpdater.autoDownload = false;

  autoUpdater.setFeedURL({
    provider: "generic",
    url: updateUrl,
  });
  autoUpdater.on("error", (err: any) => {
    sendUpdateMessage("error", String(err) || message.error);
  });
  autoUpdater.on("checking-for-update", () => {
    sendUpdateMessage("checking-for-update", message.checking);
  });

  // 版本检测结束 准备更新
  autoUpdater.on("update-available", (updateInfo) => {
    console.log(updateInfo);

    sendUpdateMessage("update-available", message.updateAva);
  });
  autoUpdater.on("update-not-available", () => {
    sendUpdateMessage("update-not-available", message.updateNotAva);
  });
  autoUpdater.on("update-downloaded", (progressObj: any) => {
    sendUpdateMessage("update-downloaded", progressObj.percent);
  });
  //更新下载进度
  autoUpdater.on("download-progress", (progressObj: any) => {
    sendUpdateMessage("download-progress", progressObj.percent);
  });
  //   更新下载完成;
  autoUpdater.on("update-downloaded", () => {
    sendUpdateMessage("update-downloaded", "下载完成");
  });

  ipcMain.on("updateSuccess", () => {
    autoUpdater.quitAndInstall();
    app.quit();
  });

  console.log("接收渲染进程消息，开始检查更新");
  if (!app.isPackaged) {
    autoUpdater.forceDevUpdateConfig = true;
    autoUpdater.channel = "latest"; // 源码获取到的是electron：21.0.1的版本高于应用版本不会更新  设置channel 强制更新
    autoUpdater.updateConfigPath = join(__dirname, "../dev-app-updater.yml");
  }
  autoUpdater.checkForUpdates().catch((err) => {
    console.log("网络连接问题", err);
  });
};

export default autoUpdaterHandle;
