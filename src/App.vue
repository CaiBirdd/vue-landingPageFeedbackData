<template>
  <!-- 根容器：只负责整体背景和布局，实际页面内容由 FeedbackDataManagement 组件承载 -->
  <div class="app-container">
    <FeedbackDataManagement />
  </div>
</template>

<script setup>
// 运营反馈数据管理主页面
import FeedbackDataManagement from './components/FeedbackDataManagement.vue'
</script>

<style lang="scss">
// 全局基础样式重置与布局设置
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

// 使页面高度撑满视口，统一字体
html,
body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

// 根节点铺满宽高，方便内部做全屏布局
#app {
  min-height: 100vh;
  width: 100vw;
}

// 应用背景容器
.app-container {
  min-height: 100vh;
  width: 100vw;
  background-color: #f5f5f5;
}
</style>

