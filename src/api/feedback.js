/*
运营反馈数据相关的 mock API 封装
业务背景：
- 用户点击广告进入落地页，前端埋点/后端记录一条访问会话（session），包括广告参数、设备类型、落地页信息等
- 在落地页上，用户可以留下邮箱 / 反馈内容，如果没有填写则展示为「未提交」
- 原有实习项目依赖真实接口，离职后接口不可调用，因此这里使用内存 + 随机数据的方式完整模拟后端行为

本文件职责：
- generateMockData：生成一批结构与真实数据类似的 mock 记录
- filterData：按筛选条件（设备 / 时间 / 广告维度 / 落地页维度）过滤
- getFeedbackData：对外提供带筛选 + 分页的列表查询接口
- deleteFeedbackData / deleteAllFeedbackData：在内存“数据库”上执行删除
- exportExcel：基于当前筛选结果导出 CSV（可在 Excel 中打开）

字段含义说明（与导出列一一对应）：
- id：            这条访问/反馈记录的内部编号（mock 中为递增）
- email：         用户在落地页填写的邮箱，未填则为「未提交」
- feedback：      用户在落地页填写的反馈内容，未填则为「未提交」
- deviceType：    设备类型，例如「PC端」「移动端」
- createTime：    记录创建时间（近 30 天内随机生成），用于排序与时间筛选
- sessionId：     一次访问会话的标识，用来区分不同进入落地页的点击
- adCampaign：    广告活动名称（campaign），如 Meeting_Strategist_ManualAndAI / Manual
- adGroup：       广告组名称（ad group），如 function_AI / function_Manual
- adName：        广告名称（ad name），与投放平台上的具体创意对应
- adContent：     广告内容标签，当前用于区分 function / painpoint 等文案主轴
- landingPageTheme：   落地页主题（例如 meeting_strategist）
- landingPageVariant： 落地页变体（例如 email / email_feedback）

说明：
- 这里的 axios 调用只作为形式占位，方便将来如果有需要可以非常轻量地接回真实后端
- 实际数据读写全部发生在 cachedAllData 上，可以理解为一个驻留在前端内存中的“小型数据库”
*/
import axios from 'axios'

// 示例静态数据（只做示例，真正使用时主要依赖 generateMockData 动态生成）
const mockData = [
  {
    id: 1,
    email: '未提交',
    feedback: '未提交',
    deviceType: '移动端',
    createTime: '2025-12-03 11:25:53',
    sessionId: '3d4e1532-96f5-4001-9dfa-b9b79b52e39a',
    adCampaign: 'Meeting_Strategist_ManualAndAI',
    adGroup: 'function_AI',
    adName: 'function_AI',
    adContent: 'function',
    landingPageTheme: 'meeting_strategist',
    landingPageVariant: 'email'
  },
  {
    id: 2,
    email: '未提交',
    feedback: '未提交',
    deviceType: '移动端',
    createTime: '2025-12-03 10:15:32',
    sessionId: '85c8583b-1142-4e58-a789-a2de99f4ccb1',
    adCampaign: 'Meeting_Strategist_ManualAndAI',
    adGroup: 'function_AI',
    adName: 'function_AI',
    adContent: 'function',
    landingPageTheme: 'meeting_strategist',
    landingPageVariant: 'email'
  },
  {
    id: 3,
    email: '未提交',
    feedback: '未提交',
    deviceType: '移动端',
    createTime: '2025-12-03 09:08:21',
    sessionId: 'a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5g6h7',
    adCampaign: 'Meeting_Strategist_ManualAndAI',
    adGroup: 'function_Manual',
    adName: 'function_Manual',
    adContent: 'function',
    landingPageTheme: 'meeting_strategist',
    landingPageVariant: 'email'
  },
  {
    id: 4,
    email: '未提交',
    feedback: '未提交',
    deviceType: '移动端',
    createTime: '2025-12-02 18:28:10',
    sessionId: '31246fca-6cea-48ca-a506-88ddd81e2b59',
    adCampaign: 'Meeting_Strategist_ManualAndAI',
    adGroup: 'function_Manual',
    adName: 'function_Manual',
    adContent: 'function',
    landingPageTheme: 'meeting_strategist',
    landingPageVariant: 'email'
  },
  {
    id: 5,
    email: '未提交',
    feedback: '未提交',
    deviceType: '移动端',
    createTime: '2025-12-02 16:45:33',
    sessionId: 'f7g8h9i0-j1k2-4l3m-n4o5-p6q7r8s9t0u1',
    adCampaign: 'Meeting_Strategist_ManualAndAI',
    adGroup: 'function_AI',
    adName: 'function_AI',
    adContent: 'function',
    landingPageTheme: 'meeting_strategist',
    landingPageVariant: 'email'
  }
]

// 生成一批模拟数据，用于初始化或重置数据源
function generateMockData(count = 62) {
  const data = []
  const adGroups = ['function_AI', 'function_Manual']
  const adNames = ['function_AI', 'function_Manual']
  const adContents = ['function', 'painpoint']
  const campaigns = ['Meeting_Strategist_ManualAndAI', 'Meeting_Strategist_Manual']
  const variants = ['email', 'email_feedback']
  const deviceTypes = ['移动端', 'PC端']
  
  // 使用简单循环生成 count 条记录
  for (let i = 1; i <= count; i++) {
    const randomGroup = adGroups[Math.floor(Math.random() * adGroups.length)]
    const randomName = adNames[Math.floor(Math.random() * adNames.length)]
    const randomContent = adContents[Math.floor(Math.random() * adContents.length)]
    const randomCampaign = campaigns[Math.floor(Math.random() * campaigns.length)]
    const randomVariant = variants[Math.floor(Math.random() * variants.length)]
    const randomDevice = deviceTypes[Math.floor(Math.random() * deviceTypes.length)]
    
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(Math.random() * 30))
    date.setHours(Math.floor(Math.random() * 24))
    date.setMinutes(Math.floor(Math.random() * 60))
    date.setSeconds(Math.floor(Math.random() * 60))
    
    const createTime = date.toISOString().replace('T', ' ').substring(0, 19)
    const sessionId = `${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`
    
    // 推入一条完整的反馈记录
    data.push({
      id: i,
      email: Math.random() > 0.8 ? `user${i}@example.com` : '未提交',
      feedback: Math.random() > 0.8 ? `反馈内容${i}` : '未提交',
      deviceType: randomDevice,
      createTime,
      sessionId,
      adCampaign: randomCampaign,
      adGroup: randomGroup,
      adName: randomName,
      adContent: randomContent,
      landingPageTheme: 'meeting_strategist',
      landingPageVariant: randomVariant
    })
  }
  
  // 按创建时间从新到旧排序，模拟实际日志数据的展示顺序
  return data.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
}

// axios 实例：保留形式与真实后端一致，便于未来直接切换为真实接口
const api = axios.create({
  baseURL: '/api',
  timeout: 5000
})

// 内存中的“数据库”，所有查询 / 删除 / 导出都基于这份数据进行
let cachedAllData = null

// 根据筛选条件过滤数据（设备类型 / 时间范围 / 广告维度 / 落地页维度等）
function filterData(data, filters) {
  return data.filter(item => {
    if (filters.deviceType && item.deviceType !== filters.deviceType) {
      return false
    }
    
    if (filters.startTime) {
      const itemTime = new Date(item.createTime)
      const startTime = new Date(filters.startTime)
      if (itemTime < startTime) {
        return false
      }
    }
    
    if (filters.endTime) {
      const itemTime = new Date(item.createTime)
      const endTime = new Date(filters.endTime)
      if (itemTime > endTime) {
        return false
      }
    }
    
    if (filters.adCampaign && item.adCampaign !== filters.adCampaign) {
      return false
    }
    
    if (filters.adGroup && item.adGroup !== filters.adGroup) {
      return false
    }
    
    if (filters.adName && item.adName !== filters.adName) {
      return false
    }
    
    if (filters.adContent && item.adContent !== filters.adContent) {
      return false
    }
    
    if (filters.landingPageTheme && item.landingPageTheme !== filters.landingPageTheme) {
      return false
    }
    
    if (filters.landingPageVariant && item.landingPageVariant !== filters.landingPageVariant) {
      return false
    }
    
    return true
  })
}

export const getFeedbackData = async (params = {}) => {
  try {
    // 占位的真实请求（当前接口失效，这里只为保持调用形式）
    const response = await api.get('/feedback', { params })

    // 首次调用时初始化内存数据
    if (!cachedAllData) {
      cachedAllData = generateMockData(62)
    }
    
    // 从参数中提取所有可能的筛选字段
    const filters = {
      deviceType: params.deviceType,
      startTime: params.startTime,
      endTime: params.endTime,
      adCampaign: params.adCampaign,
      adGroup: params.adGroup,
      adName: params.adName,
      adContent: params.adContent,
      landingPageTheme: params.landingPageTheme,
      landingPageVariant: params.landingPageVariant
    }
    
    // 先按筛选条件过滤
    const filteredData = filterData(cachedAllData, filters)

    // 再在过滤后的结果上做分页
    const { page = 1, pageSize = 20 } = params
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginatedData = filteredData.slice(start, end)
    
    // 返回分页数据 + 总数 + 全量（供顶部统计和导出使用）
    return {
      data: paginatedData,
      total: filteredData.length,
      allData: filteredData
    }
  } catch (error) {
    // 当真实接口异常时，完全走本地 mock 流程
    if (!cachedAllData) {
      cachedAllData = generateMockData(62)
    }
    
    const filters = {
      deviceType: params.deviceType,
      startTime: params.startTime,
      endTime: params.endTime,
      adCampaign: params.adCampaign,
      adGroup: params.adGroup,
      adName: params.adName,
      adContent: params.adContent,
      landingPageTheme: params.landingPageTheme,
      landingPageVariant: params.landingPageVariant
    }
    
    const filteredData = filterData(cachedAllData, filters)

    const { page = 1, pageSize = 20 } = params
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginatedData = filteredData.slice(start, end)
    
    return {
      data: paginatedData,
      total: filteredData.length,
      allData: filteredData
    }
  }
}

export const deleteFeedbackData = async (ids) => {
  try {
    // 占位真实删除接口
    await api.delete('/feedback', { data: { ids } })

    // 本地“数据库”中删除对应 id 的记录
    if (!cachedAllData) {
      cachedAllData = generateMockData(62)
    }
    cachedAllData = cachedAllData.filter(item => !ids.includes(item.id))
    return { success: true }
  } catch (error) {
    // 接口错误时仍然保证本地数据被正确删除
    if (!cachedAllData) {
      cachedAllData = generateMockData(62)
    }
    cachedAllData = cachedAllData.filter(item => !ids.includes(item.id))
    return { success: true }
  }
}

export const deleteAllFeedbackData = async () => {
  try {
    // 占位真实“清空全部”接口
    await api.delete('/feedback/all')
    // 本地“数据库”直接置空
    cachedAllData = []
    return { success: true }
  } catch (error) {
    // 即使接口错误，本地也保证清空
    cachedAllData = []
    return { success: true }
  }
}

export const exportExcel = async (params = {}) => {
  try {
    // 优先尝试真实导出接口（当前不可用，仅作占位）
    const response = await api.get('/feedback/export', { 
      params,
      responseType: 'blob'
    })
    return response
  } catch (error) {
    // 接口失败时，使用本地数据生成 CSV（Excel 可直接打开）
    if (!cachedAllData) {
      cachedAllData = generateMockData(62)
    }

    const filters = {
      deviceType: params.deviceType,
      startTime: params.startTime,
      endTime: params.endTime,
      adCampaign: params.adCampaign,
      adGroup: params.adGroup,
      adName: params.adName,
      adContent: params.adContent,
      landingPageTheme: params.landingPageTheme,
      landingPageVariant: params.landingPageVariant
    }

    const filteredData = filterData(cachedAllData, filters)

    // 组装 CSV 内容：第一行是表头，后面为数据行
    const csvContent = [
      ['ID', '邮箱', '反馈内容', '设备类型', '创建时间', 'Session ID', '广告活动名称', '广告组名称', '广告名称', '广告内容', '落地页主题', '落地页变体'],
      ...filteredData.map(item => [
        item.id,
        item.email,
        item.feedback,
        item.deviceType,
        item.createTime,
        item.sessionId,
        item.adCampaign,
        item.adGroup,
        item.adName,
        item.adContent,
        item.landingPageTheme,
        item.landingPageVariant
      ])
    ].map(row => row.join(',')).join('\n')
    
    // \ufeff 用于避免 Excel 打开时出现中文乱码（BOM 头）
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `反馈数据_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    return { success: true }
  }
}

