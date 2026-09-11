import { http } from './http'

/** 后端统一响应结构。 */
export interface ApiResponse<T> {
  /** 业务状态码，成功为 200。 */
  code: number
  /** 后端返回消息。 */
  message: string
  /** 业务数据。 */
  data: T
}

/** 右下角「数据资产变化」查询参数。 */
export interface DataAssetChangeParams {
  /** 查询类型；当前页面固定传 0，后续根据业务调整。 */
  queryType: number
}

/** 右下角「数据资产变化」月度数据。 */
export interface DataAssetChangeItem {
  /** 月份，格式为 yyyyMM。 */
  month: string
  /** 数据资产变更数量。 */
  changeCnt: number
  /** 数据资产变更率，单位：%。 */
  changeRate: number
}

/** 右上角「数据资产应用」部门数据。 */
export interface DataAssetApplicationItem {
  /** 部门名称。 */
  departmentName: string
  /** 部门数据表数量。 */
  tableCnt: number
  /** 部门数据表占比，单位：%。 */
  departmentRatio: number
}

/** 左上角「数据质量评价」查询参数。 */
export interface DataEvaluateDetailParams {
  /** 数据集类型：0 左上角，1 基础数据集，2 应用数据集。 */
  datasetType: 0 | 1 | 2
}

/** 左上角「数据质量评价」数据集详情。 */
export interface DataEvaluateDetailItem {
  /** 数据集 ID。 */
  datasetId: number
  /** 数据集描述。 */
  datasetDesc: string
  /** 数据集数据量。 */
  datasetCnt: number
  /** 数据集综合评分。 */
  datasetScore?: number
  /** 兼容接口返回的小写综合评分字段。 */
  datasetscore?: number
  /** 波形维度评分。 */
  waveformScore: number
  /** 目标维度评分。 */
  targetScore: number
  /** 杂波维度评分。 */
  clutterScore: number
  /** 场景维度评分。 */
  sceneScore: number
  /** 气候维度评分。 */
  climateScore: number
}

/** 中间数据架构各层的数据集类型。 */
export type DatasetPreviewType = 1 | 2 | 3

/** 中间数据架构数据集列表查询参数。 */
export interface DatasetPreviewParams {
  /** 1 基础数据集，2 应用数据集，3 数据服务。 */
  data_type: DatasetPreviewType
}

/** 数据集弹窗中的键值项。 */
export interface DatasetPreviewKeyItem {
  key_name: string
  key_value: string | number
}

/** 中间数据架构数据集。 */
export interface DatasetPreviewItem {
  dataset_name: string
  dataset_cnt: number
  key_list: DatasetPreviewKeyItem[]
}

/** 中间顶部「数据总览」及左上角质量评价指标。 */
export interface DataOverviewData {
  /** 数据记录总数。 */
  totalCnt: number
  /** 数据记录月环比，单位：%。 */
  recordMom: number
  /** 数据表总数。 */
  totalTable: number
  /** 数据总容量，单位：TB。 */
  totalSize: number
  /** 数据质量综合评分。 */
  qualityScore: number
  /** 数据集综合评分。 */
  datasetScore: number
  /** 波形维度评分。 */
  waveformScore: number
  /** 目标维度评分。 */
  targetScore: number
  /** 杂波维度评分。 */
  clutterScore: number
  /** 场景维度评分。 */
  sceneScore: number
  /** 气候维度评分。 */
  climateScore: number
}

/**
 * 中间树最底层「数据来源」和左下角「数据资产来源」的数据结构。
 * 中间树接口返回数量，左下角接口返回占比。
 */
export interface DataSourceData {
  /** 实采数据。 */
  actual: number
  /** 仿真数据。 */
  simulation: number
  /** 引接数据。 */
  imported: number
  /** 黄海数据。 */
  yellow_sea: number
  /** 渤海数据。 */
  bohai: number
  /** 东海数据。 */
  east_sea: number
}

/** 中间树顶层「数据服务」数据。 */
export interface DataServiceItem {
  /** 数据服务 ID。 */
  id: number
  /** 数据服务描述。 */
  serviceDesc: string
  /** 数据服务数量。 */
  serviceCnt: number
}

/**
 * 查询右下角「数据资产变化」。
 * GET /api/bi/data-asset-change
 */
export const getDataAssetChange = (params: DataAssetChangeParams) =>
  http.get<ApiResponse<DataAssetChangeItem[]>>('data-asset-change', { params })

/**
 * 查询右上角「数据资产应用」。
 * GET /api/bi/data-asset-application
 */
export const getDataAssetApplication = () =>
  http.get<ApiResponse<DataAssetApplicationItem[]>>('data-asset-application')

/**
 * 查询左上角「数据质量评价」。
 * GET /api/bi/data-evaluate-detail
 */
export const getDataEvaluateDetail = (params: DataEvaluateDetailParams) =>
  http.get<ApiResponse<DataEvaluateDetailItem[]>>('data-evaluate-detail', { params })

/**
 * 按类型查询中间数据架构的数据集列表。
 * GET /api/bi/data-preview?data_type=1|2|3
 */
export const getDatasetPreview = (params: DatasetPreviewParams) =>
  http.get<ApiResponse<DatasetPreviewItem[]>>('data-preview', { params })

/**
 * 查询中间树最底层「数据来源」。
 * GET /api/bi/data-source
 */
export const getDataSource = () =>
  http.get<ApiResponse<DataSourceData>>('data-source')

/**
 * 查询左下角「数据资产来源」。
 * GET /api/bi/data-asset-source
 */
export const getDataAssetSource = () =>
  http.get<ApiResponse<DataSourceData>>('data-asset-source')

/**
 * 查询中间顶部「数据总览」。
 * GET /api/bi/data-overview
 */
export const getDataOverview = () =>
  http.get<ApiResponse<DataOverviewData>>('data-overview')

/**
 * 查询中间树顶层「数据服务」。
 * GET /api/bi/data-services
 */
export const getDataServices = () =>
  http.get<ApiResponse<DataServiceItem[]>>('data-services')
