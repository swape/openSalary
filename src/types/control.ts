export type ControlChangeAction =
  'calculate-salary' | 'change-chart-period' | 'toggle-chart-series'

export type CheckboxChangeAction = Extract<
  ControlChangeAction,
  'calculate-salary' | 'toggle-chart-series'
>

export interface ControlChangeDetail {
  action: ControlChangeAction
  name: string
  value: string
  checked?: boolean
  seriesIndex?: number
}
