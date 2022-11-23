// electron-main/main.ts
import { join } from "node:path";
import axios from "axios";
import autoUpdaterHandle, { updateUrl } from "./update";
import { app, BrowserWindow, ipcMain } from "electron";
import fs from "node:fs";
import fse from "fs-extra";
import createProtocol from "./createProtocol";
import AdmZip from "adm-zip";

let remoteVersion: string;
const resources = process.resourcesPath;
let win: BrowserWindow;

const createWindow = () => {
  win = new BrowserWindow({
    width: 900,
    height: 800,
    webPreferences: {
      contextIsolation: false, // 是否开启隔离上下文
      nodeIntegration: true, // 渲染进程使用Node API
    },
  });
  // 如果打包了，渲染index.html

  if (app.isPackaged) {
    createProtocol("app", join(resources, "./app.asar.unpacked"));
    win.loadURL(`app://./index.html`);
  } else {
    let url = "http://127.0.0.1:9000"; // 本地启动的vue项目路径
    win.loadURL(url);
  }
  win.webContents.openDevTools({ mode: "right" });
  return win;
};

app.whenReady().then(async () => {
  const win = createWindow(); // 创建窗口
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  remoteVersion = (await handleGetVersion()) as string;
  ipcMain.on("init", (e: Event, version: string) => {
    const currentVersion: string = app.isPackaged
      ? version
      : (process.env.npm_package_version as string);
    win.webContents?.send("version", {
      currentVersion,
      remoteVersion,
      version,
      message: "你哈",
    });
    handleVersionCom(currentVersion);
  });
});

// 关闭窗口
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
// 获取远程版本版本参数
const handleGetVersion = async () => {
  const remoteVersion = await axios({
    url: `${updateUrl}/latest.yml`,
    method: "GET",
  })
    .then((res) => {
      const remoteVersion = JSON.stringify(res.data)
        .split("\\n")[0]
        .split(" ")[1];

      return remoteVersion;
    })
    .catch((err) => {
      console.log("网络连接错误", err);
    });
  return Promise.resolve(remoteVersion);
};

// 获取当前版远程版本对比

function handleVersionCom(currentVersion: string) {
  try {
    if (!(currentVersion && remoteVersion)) return;
    const currentVersionArr = currentVersion?.split(".") as string[];
    const remoteVersionArr = remoteVersion?.split(".");
    if (remoteVersionArr[0] > currentVersionArr[0])
      autoUpdaterHandle(win); // 建议修改main的线程代码使用 全量更新
    else if (remoteVersionArr[0] === currentVersionArr[0]) {
      // 渲染线程使用 局部更新
      if (
        remoteVersionArr[1] > currentVersionArr[1] ||
        (remoteVersionArr[1] === currentVersionArr[1] &&
          remoteVersionArr[2] > currentVersionArr[2])
      ) {
        // app.isPackaged && handleUpdate();
        handleUpdate();
      }
    }
  } catch (error) {
    win.webContents.send("main-error", {
      message: error,
    });
  }
}

const handleUpdate = () => {
  let path = "";
  if (app.isPackaged) path = resources;
  else {
    path = join(__dirname, "../files");
    if (!fse.pathExistsSync(path)) fse.mkdirSync(path);
  }
  downloadFile(path, "unpacked");
};
// 增量更新
const downloadFile = async (path: string, name: string) => {
  const zipPath = join(path, `./${name}.zip`);
  const unpackedPath = join(path, `./app.asar.${name}`);
  const unpackedPathBak = join(path, `./bak.pp.asar.unpacked.zip`);
  deleteFile(zipPath);
  win.webContents.send("info", {
    message: "开始",
    zipPath,
    unpackedPathBak,
    unpackedPath,
  });
  downloadZip(name, zipPath)
    .then(() => {
      const zip = new AdmZip(zipPath);
      backups(zip, unpackedPath, unpackedPathBak);
      deleteFile(unpackedPath);
      zip.extractAllToAsync(unpackedPath, true, true, (err) => {
        if (err) {
          reduction(zip, unpackedPath, unpackedPathBak);
          return;
        }
        ipcMain.on("init", (e: Event, version: string) => {
          win.webContents.send("update-success", remoteVersion);
        });
        deleteFile(zipPath);
        reLoad(false);
      });
    })
    .catch((err) => {
      ipcMain.on("init", (e: Event, version: string) => {
        win.webContents.send("main-error", {
          message: err,
        });
      });
      console.log(err);
    });
};

const downloadZip = async (name: string, filePath: string) => {
  const writer = fs.createWriteStream(filePath);
  const response = await axios({
    url: `${updateUrl}/${name}.zip`,
    method: "GET",
    responseType: "stream",
  });
  response.data.pipe(writer);
  return new Promise((resolve, rejects) => {
    writer.on("finish", () => resolve(true));
    writer.on("error", () => rejects(false));
  });
};

function backups(zip: AdmZip, unpackedPath: string, unpackedPathBak: string) {
  deleteFile(unpackedPathBak);
  zip.addLocalFolder(unpackedPath);
  zip.writeZip(join(unpackedPathBak)); // 备份形成zip文件
}

function reduction(zip: AdmZip, unpackedPath: string, unpackedPathBak: string) {
  deleteFile(unpackedPath);
  if (fse.pathExistsSync(unpackedPathBak)) {
    zip.extractAllToAsync(unpackedPath, true, true, (err) => {
      console.log(err);
    });
  }
  reLoad(false);
}

function reLoad(close: boolean) {
  if (close) {
    app.relaunch();
    app.exit(0);
  } else {
    win.webContents?.reloadIgnoringCache();
  }
}

function deleteFile(zipPath: string) {
  if (fse.pathExistsSync(zipPath)) {
    fse.removeSync(zipPath);
  }
}
