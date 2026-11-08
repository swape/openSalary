import type { ControlChangeAction } from './control'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export type SelectChangeAction = Exclude<
  ControlChangeAction,
  'toggle-chart-series'
>
