<!--
  运营反馈数据管理页面
  业务场景：
  - 用户点击广告进入落地页，记录一次访问 session（包含广告 / 设备 / 落地页等信息）
  - 在落地页上，用户可以填写邮箱 / 反馈内容，用于后续运营跟进与产品优化
  - 本页面用于运营同学对这批数据进行筛选、统计（包含 CVR 拆解）、删除和导出
-->
<template>
  <div class="feedback-management">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>运营反馈数据管理</span>
        </div>
      </template>

      <div class="filter-section">
        <el-row :gutter="20">
          <el-col :span="4">
            <el-select v-model="filters.deviceType" placeholder="设备类型" clearable style="width: 100%" @change="handleFilterChange">
              <el-option label="移动端" value="移动端" />
              <el-option label="PC端" value="PC端" />
            </el-select>
          </el-col>
          <el-col :span="5">
            <el-date-picker
              v-model="filters.startTime"
              type="datetime"
              placeholder="开始时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
              @change="handleFilterChange"
            />
          </el-col>
          <el-col :span="1" style="text-align: center; line-height: 32px">
            <span>至</span>
          </el-col>
          <el-col :span="5">
            <el-date-picker
              v-model="filters.endTime"
              type="datetime"
              placeholder="结束时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
              @change="handleFilterChange"
            />
          </el-col>
          <el-col :span="3">
            <el-select v-model="filters.adCampaign" placeholder="广告活动" clearable style="width: 100%" @change="handleFilterChange">
              <el-option label="Meeting_Strategist_ManualAndAI" value="Meeting_Strategist_ManualAndAI" />
              <el-option label="Meeting_Strategist_Manual" value="Meeting_Strategist_Manual" />
            </el-select>
          </el-col>
          <el-col :span="3">
            <el-select v-model="filters.adGroup" placeholder="广告组" clearable style="width: 100%" @change="handleFilterChange">
              <el-option label="function_AI" value="function_AI" />
              <el-option label="function_Manual" value="function_Manual" />
            </el-select>
          </el-col>
          <el-col :span="3">
            <el-select v-model="filters.adName" placeholder="广告" clearable style="width: 100%" @change="handleFilterChange">
              <el-option label="function_AI" value="function_AI" />
              <el-option label="function_Manual" value="function_Manual" />
            </el-select>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 15px">
          <el-col :span="4">
            <el-select v-model="filters.adContent" placeholder="广告内容" clearable style="width: 100%" @change="handleFilterChange">
              <el-option label="function" value="function" />
              <el-option label="painpoint" value="painpoint" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select v-model="filters.landingPageTheme" placeholder="落地页主题" clearable style="width: 100%" @change="handleFilterChange">
              <el-option label="meeting_strategist" value="meeting_strategist" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select v-model="filters.landingPageVariant" placeholder="落地页变体" clearable style="width: 100%" @change="handleFilterChange">
              <el-option label="email" value="email" />
              <el-option label="email_feedback" value="email_feedback" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <div class="cvr-display">
              <span>CVR {{ cvr }}%</span>
            </div>
          </el-col>
        </el-row>
      </div>

      <div class="summary-section">
        <div class="summary-left">
          <span class="summary-label">总数据量: {{ total }}</span>
          <el-tag type="info" class="summary-tag">仅UTM: {{ utmOnly }}</el-tag>
          <el-tag type="primary" class="summary-tag">有邮箱或反馈: {{ hasEmailOrFeedback }}</el-tag>
          <el-tag type="success" class="summary-tag">仅邮箱: {{ emailOnly }}</el-tag>
          <el-tag type="warning" class="summary-tag">仅反馈: {{ feedbackOnly }}</el-tag>
          <el-tag type="danger" class="summary-tag">邮箱+反馈: {{ emailAndFeedback }}</el-tag>
        </div>
        <div class="summary-right">
          <el-button type="primary" :icon="Refresh" @click="handleRefresh">刷新</el-button>
          <el-button type="danger" :icon="Delete" @click="handleBatchDelete">批量删除</el-button>
          <el-button type="danger" :icon="Delete" @click="handleDeleteAll">删除全部</el-button>
          <el-button type="success" :icon="Download" @click="handleExport">导出Excel</el-button>
        </div>
      </div>

      <div class="table-section">
        <div class="table-wrapper">
          <el-table
            v-loading="loading"
            :data="tableData"
            @sort-change="handleSortChange"
            @selection-change="handleSelectionChange"
            style="width: 100%; min-width: 1700px"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="id" label="序号" width="80" />
            <el-table-column prop="email" label="邮箱" width="150">
              <template #default="{ row }">
                <span :class="{ 'not-submitted': row.email === '未提交' }">{{ row.email }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="feedback" label="反馈内容" min-width="150">
              <template #default="{ row }">
                <span :class="{ 'not-submitted': row.feedback === '未提交' }">{{ row.feedback }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="deviceType" label="设备类型" width="120">
              <template #default="{ row }">
                <el-tag
                  size="small"
                  :type="row.deviceType === 'PC端' ? 'success' : row.deviceType === '移动端' ? 'primary' : 'info'"
                >
                  {{ row.deviceType }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="adCampaign" label="广告活动" min-width="200" show-overflow-tooltip />
            <el-table-column prop="adGroup" label="广告组" min-width="150" show-overflow-tooltip />
            <el-table-column prop="adName" label="广告名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="adContent" label="广告内容" width="150" />
            <el-table-column prop="landingPageTheme" label="落地页主题" min-width="150" />
            <el-table-column prop="landingPageVariant" label="落地页变体" width="150" />
            <el-table-column prop="createTime" label="创建时间" width="180" sortable="custom" />
          </el-table>
        </div>

        <div class="pagination-section">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Delete, Download } from '@element-plus/icons-vue'
import { getFeedbackData, deleteFeedbackData, deleteAllFeedbackData } from '@/api/feedback'

// 加载状态
const loading = ref(false)
// 当前页表格数据
const tableData = ref([])
// 当前筛选条件下的全部数据（不分页，用于统计和导出）
const allData = ref([])
// 多选勾选的行
const selectedRows = ref([])
// 记录当前排序状态（升序 / 降序 / 无）
const sortOrder = ref(null)

// 查询筛选条件
const filters = reactive({
  deviceType: '',
  startTime: '',
  endTime: '',
  adCampaign: '',
  adGroup: '',
  adName: '',
  adContent: '',
  landingPageTheme: '',
  landingPageVariant: ''
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 总数据量（受筛选条件影响，不受分页影响）
const total = computed(() => pagination.total)

// 有邮箱或反馈的条数
const hasEmailOrFeedback = computed(() => {
  return allData.value.filter(item => item.email !== '未提交' || item.feedback !== '未提交').length
})

// CVR = 有邮箱或反馈的条数 / 总条数 * 100%
const cvr = computed(() => {
  return total.value > 0 ? ((hasEmailOrFeedback.value / total.value) * 100).toFixed(1) : '0.0'
})

// 仅 UTM：既没有邮箱也没有反馈
const utmOnly = computed(() => {
  return allData.value.filter(item => item.email === '未提交' && item.feedback === '未提交').length
})

// 仅邮箱：有邮箱、无反馈
const emailOnly = computed(() => {
  return allData.value.filter(item => item.email !== '未提交' && item.feedback === '未提交').length
})

// 仅反馈：有反馈、无邮箱
const feedbackOnly = computed(() => {
  return allData.value.filter(item => item.email === '未提交' && item.feedback !== '未提交').length
})

// 邮箱 + 反馈：既有邮箱又有反馈
const emailAndFeedback = computed(() => {
  return allData.value.filter(item => item.email !== '未提交' && item.feedback !== '未提交').length
})

// 加载表格数据（带筛选 + 分页）
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filters
    }
    const response = await getFeedbackData(params)
    
    // allData 用于顶部统计和导出
    if (response.allData) {
      allData.value = response.allData
    }
    
    tableData.value = response.data
    pagination.total = response.total
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 手动刷新按钮
const handleRefresh = () => {
  loadData()
  ElMessage.success('刷新成功')
}

// 多选勾选变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 批量删除选中行
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的数据')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 条数据吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const ids = selectedRows.value.map(row => row.id)
    await deleteFeedbackData(ids)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 删除全部数据
const handleDeleteAll = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除全部数据吗？此操作不可恢复！',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteAllFeedbackData()
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 导出 CSV：有勾选时导出选中数据，否则导出当前筛选条件下的全部数据
const handleExport = () => {
  const exportRows = selectedRows.value.length > 0 ? selectedRows.value : allData.value

  if (!exportRows.length) {
    ElMessage.warning('暂无可导出的数据')
    return
  }

  const header = [
    'ID',
    '邮箱',
    '反馈内容',
    '设备类型',
    '创建时间',
    'Session ID',
    '广告活动名称',
    '广告组名称',
    '广告名称',
    '广告内容',
    '落地页主题',
    '落地页变体'
  ]

  const rows = exportRows.map((item) => [
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

  const csvContent = [header, ...rows]
    .map((row) =>
      row
        .map((field) => {
          const value = field == null ? '' : String(field)
          const escaped = value.replace(/"/g, '""')
          return `"${escaped}"`
        })
        .join(',')
    )
    .join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `反馈数据_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)

  ElMessage.success('导出成功')
}

// 每页条数变化
const handleSizeChange = (val) => {
  pagination.pageSize = val
  pagination.page = 1
  loadData()
}

// 当前页码变化
const handlePageChange = (val) => {
  pagination.page = val
  loadData()
}

// 列排序（目前仅对当前页数据排序，不影响全局统计）
const handleSortChange = ({ prop, order }) => {
  sortOrder.value = order
  if (!order || !prop) {
    return
  }

  tableData.value = [...tableData.value].sort((a, b) => {
    let aVal = a[prop]
    let bVal = b[prop]

    if (prop === 'createTime') {
      aVal = new Date(aVal)
      bVal = new Date(bVal)
    }

    if (order === 'ascending') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    }
    return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
  })
}

// 任意筛选条件变化时，重置到第一页并重新加载
const handleFilterChange = () => {
  pagination.page = 1
  loadData()
}

// 组件挂载后自动加载一次数据
onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.feedback-management {
  width: 100vw;
  padding: 0;
  display: flex;
  flex-direction: column;

  .main-card {
    width: 100vw;
    display: flex;
    flex-direction: column;
    border-radius: 0;

    :deep(.el-card__body) {
      display: flex;
      flex-direction: column;
      padding: 20px;
    }
  }

  .card-header {
    font-size: 18px;
    font-weight: bold;
  }

  .filter-section {
    margin-bottom: 20px;
    padding: 20px;
    background-color: #fafafa;
    border-radius: 4px;

    .cvr-display {
      line-height: 32px;
      font-weight: bold;
      color: #409eff;
    }
  }

  .summary-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f5f7fa;
    border-radius: 4px;

    .summary-left {
      display: flex;
      align-items: center;
      gap: 10px;

      .summary-label {
        font-weight: bold;
        margin-right: 5px;
      }

      .summary-tag {
        margin-right: 5px;
      }
    }

    .summary-right {
      display: flex;
      gap: 10px;
    }
  }

  .table-section {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    min-width: 0;

    .table-wrapper {
      overflow-x: auto;
      overflow-y: visible;
      min-width: 0;
    }
  }

  .not-submitted {
    color: #909399;
  }

  .pagination-section {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>

