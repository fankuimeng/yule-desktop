<template>
  <div class="com-update">
    <el-row type="flex" justify="end">
      <el-col :span="1" :xs="3" :md="2" :lg="1">
        <el-tag @click="showUpdater" size="mini" type="info" effect="plain"
          >检查版本</el-tag
        >
      </el-col>
    </el-row>
    <el-dialog
      title="更新中，请稍等。。。"
      :visible="showDialog"
      width="30%"
      center
      :close-on-press-escape="false"
      :close-on-click-modal="false"
      :show-close="false"
    >
      <el-row type="flex" justify="center">
        <el-col :span="11">
          <el-progress type="circle" :percentage="process"></el-progress>
        </el-col>
      </el-row>
    </el-dialog>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
export default {
  name: "update",
  data() {
    return {
      loading: "",
      status: null,
      message: "",
      showDialog: false,
      process: 0,
    };
  },

  watch: {
    status() {
      let status = this.status;
      if (status === -1) {
        this.$message({
          type: "error",
          center: true,
          message: `${this.message}`,
        });
      } else if (status === 1) {
        this.$message.closeAll();
        this.$message({
          type: "info",
          center: true,
          message: `${this.message}`,
          iconClass: "el-icon-loading",
        });
      } else if (status === 2) {
        this.showDialog = true;
        this.$message.closeAll();
        this.$message({
          type: "success",
          center: true,
          message: `${this.message}`,
          iconClass: "el-icon-loading",
        });
      } else if (status === 3) {
        this.$message.closeAll();
        this.$message({
          type: "success",
          center: true,
          message: `${this.message}`,
        });
      }

      if (status !== 2) {
        this.showDialog = false;
      }
    },
  },

  methods: {
    showUpdater() {
      this.showUpdate = true;
      ipcRenderer.send("checkForUpdate");
    },
  },

  mounted() {
    ipcRenderer.on("message", (event, obj) => {
      console.log("obj", obj);
      this.status = obj.status;
      this.message = obj.message;
    });

    // 注意：“downloadProgress”事件可能存在无法触发的问题，只需要限制一下下载网速就好了
    // ipcRenderer.on("downloadProgress", (event, progressObj) => {
    //   console.log("progressObj", progressObj);
    //   console.log("progressObj.percent", progressObj.percent);
    //   this.process = progressObj.percent || 0;

    //   if (this.process === 100) {
    //     this.showDialog = false;
    //   }
    // });

    // ipcRenderer.on("isUpdateNow", () => {
    //   ipcRenderer.send("isUpdateNow");
    // });
  },

  destroyed() {
    ipcRenderer.removeAllListeners([
      "message",
      "downloadProgress",
      "isUpdateNow",
    ]);
  },
};
</script>
