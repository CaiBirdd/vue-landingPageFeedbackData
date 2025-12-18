// 应用入口：创建 Vue 应用并挂载到 #app
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'

// 创建根应用实例
const app = createApp(App)

// 注册 Element Plus 组件库
app.use(ElementPlus)

// 全量注册 Element Plus 图标，方便在任意组件中直接使用 <Refresh /> 等图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 挂载到页面根节点
app.mount('#app')

