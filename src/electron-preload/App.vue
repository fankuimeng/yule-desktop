<script setup lang="ts">
import { onMounted, ref } from "vue";
const { ipcRenderer } = window.require("electron");
const message = ref("");

onMounted(() => {
  const dom = document.querySelector("#version");
  const version = dom?.getAttribute("value") ?? "0.0.0";
  ipcRenderer.send("init", version);

  ipcRenderer.on("message", (event, arg) => {
    console.log(arg);
    // message.value = arg.name;
    if ("update-available" == arg.name) {
      //监听发现可用更新事件
      //   this.updateAvailable(arg);
    } else if ("download-progress" == arg.name) {
      // 更新下载进度事件
      //   this.downloadProgress(arg);
    } else if ("error" == arg.cmd) {
      //监听升级失败事件
      //   this.error(arg);
    } else if ("update-downloaded" == arg.name) {
      // 设置版本
      //监听下载完成事件
      //   this.updateDownloaded(arg);
    }
  });
  ipcRenderer.on("update-success", (_, version) => {
    console.log(version);
    dom?.setAttribute("value", version);
  });
  ipcRenderer.on("info", (_, data) => {
    console.log(data);
  });
  ipcRenderer.on("version", (_, data) => {
    console.log(data);
  });
  ipcRenderer.on("main-error", (_, error) => {
    console.log(error);
  });
});
</script>

<template>
  <div>{{ message }}大家加油</div>
</template>

<style scoped></style>
