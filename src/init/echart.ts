import * as echarts from "echarts/core";
import {
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  CalendarComponent,
  VisualMapComponent,
} from "echarts/components";

import { LineChart, HeatmapChart } from "echarts/charts";
import { UniversalTransition } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";

export const initEChart = () => {
  // 注册必须的组件
  echarts.use([
    TitleComponent,
    ToolboxComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    LineChart,
    CalendarComponent,
    VisualMapComponent,
    HeatmapChart,
    CanvasRenderer,
    UniversalTransition,
  ]);
};
