/**
 * Copyright (c) Streamlit Inc. (2018-2022) Snowflake Inc. (2022)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { ReactElement } from "react"
import { useTheme } from "@emotion/react"
import { hasLightBackgroundColor, Theme } from "src/theme"
import {
  Figure as FigureProto,
  PlotlyChart as PlotlyChartProto,
} from "src/autogen/proto"
import withFullScreenWrapper from "src/hocs/withFullScreenWrapper"
import Plot from "react-plotly.js"
import { assign } from "lodash"
import {
  applyStreamlitThemeData,
  applyStreamlitThemeLayout,
} from "./CustomTheme"

export interface PlotlyChartProps {
  width: number
  element: PlotlyChartProto
  height: number | undefined
}

export const DEFAULT_HEIGHT = 450

export function PlotlyChart({
  width: propWidth,
  element,
  height: propHeight,
}: PlotlyChartProps): ReactElement {
  const renderIFrame = (url: string): ReactElement => {
    const height = propHeight || DEFAULT_HEIGHT
    const width = propWidth
    return <iframe title="Plotly" src={url} style={{ width, height }} />
  }

  const isFullScreen = (): boolean => !!propHeight

  const theme: Theme = useTheme()
  const categoryColors = hasLightBackgroundColor(theme)
    ? [
        "#0068C9",
        "#83C9FF",
        "#FF2B2B",
        "#FFABAB",
        "#29B09D",
        "#7DEFA1",
        "#FF8700",
        "#FFD16A",
        "#6D3FC0",
        "#D5DAE5",
      ]
    : [
        "#83C9FF",
        "#0068C9",
        "#FFABAB",
        "#FF2B2B",
        "#7DEFA1",
        "#29B09D",
        "#FFD16A",
        "#FF8700",
        "#6D3FC0",
        "#D5DAE5",
      ]

  const generateSpec = (figure: FigureProto): any => {
    const spec = JSON.parse(figure.spec)

    const legendGroupIndexes = new Map<string, number[]>()
    spec.data.forEach((entry: any, index: number) => {
      if (entry.legendgroup === undefined) {
      } else if (legendGroupIndexes.has(entry.legendgroup)) {
        // @ts-ignore
        legendGroupIndexes.set(
          entry.legendgroup,
          legendGroupIndexes.get(entry.legendgroup).concat(index)
        )
      } else {
        legendGroupIndexes.set(entry.legendgroup, [index])
      }
    })
    console.log(legendGroupIndexes)
    let counter = 0
    legendGroupIndexes.forEach((value: number[], key: string) => {
      value.forEach((index: number) => {
        if (typeof spec.data[index].marker.color !== "string") {
          return
        }
        // console.log(console.log(assign({color: categoryColors[counter % categoryColors.length]}, spec.data[index].marker)))
        console.log(categoryColors[counter % categoryColors.length])
        if (spec.data[index].line !== undefined) {
          spec.data[index].line = assign(spec.data[index].line, {
            color: categoryColors[counter % categoryColors.length],
          })
        } else {
          spec.data[index].marker = assign(spec.data[index].marker, {
            color: categoryColors[counter % categoryColors.length],
          })
        }
      })
      counter++
    })

    console.log(spec)

    //   for (const index in spec.data) {
    //     spec.data[index] = assign(
    //       {marker: true
    //   ? [
    //     "#0068C9",
    //     "#83C9FF",
    //     "#FF2B2B",
    //     "#FFABAB",
    //     "#29B09D",
    //     "#7DEFA1",
    //     "#FF8700",
    //     "#FFD16A",
    //     "#6D3FC0",
    //     "#D5DAE5",
    //   ] :
    //   [ "#83C9FF",
    //   "#0068C9",
    //   "#FFABAB",
    //   "#FF2B2B",
    //   "#7DEFA1",
    //   "#29B09D",
    //   "#FFD16A",
    //   "#FF8700",
    //   "#6D3FC0",
    //   "#D5DAE5",
    // ]},
    //       spec.layout.template.data[index][0]
    //     )
    //     // console.log(spec.layout.template.data[index][0])
    //   }

    if (isFullScreen()) {
      spec.layout.width = propWidth
      spec.layout.height = propHeight
    } else if (element.useContainerWidth) {
      spec.layout.width = propWidth
    }

    if (element.theme === "streamlit") {
      // should this be the same name as applyStreamlitTheme because there are duplicates?
      spec.layout.template.layout = applyStreamlitThemeLayout(
        spec.layout.template.layout,
        theme
      )
      spec.layout = assign(
        {
          colorway: true
            ? [
                "#0068C9",
                "#83C9FF",
                "#FF2B2B",
                "#FFABAB",
                "#29B09D",
                "#7DEFA1",
                "#FF8700",
                "#FFD16A",
                "#6D3FC0",
                "#D5DAE5",
              ]
            : [
                "#83C9FF",
                "#0068C9",
                "#FFABAB",
                "#FF2B2B",
                "#7DEFA1",
                "#29B09D",
                "#FFD16A",
                "#FF8700",
                "#6D3FC0",
                "#D5DAE5",
              ],
        },
        spec.layout
      )
      // if ("title" in spec.layout) {
      //   spec.layout.title = assign({text: `<b>${spec.layout.title.text}</b>`})
      // }
      // console.log(spec.layout)
    } else {
      // Apply minor theming improvements to work better with Streamlit
      spec.layout = layoutWithThemeDefaults(spec.layout, theme)
    }
    // console.log(spec)

    return spec
  }

  const renderFigure = (figure: FigureProto): ReactElement => {
    const config = JSON.parse(figure.config)
    // console.log(config)
    const { data, layout, frames } = generateSpec(figure)

    return (
      <Plot
        key={isFullScreen() ? "fullscreen" : "original"}
        className="stPlotlyChart"
        data={data}
        layout={layout}
        config={config}
        frames={frames}
      />
    )
  }

  switch (element.chart) {
    case "url":
      return renderIFrame(element.url as string)
    case "figure":
      return renderFigure(element.figure as FigureProto)
    default:
      throw new Error(`Unrecognized PlotlyChart type: ${element.chart}`)
  }
}

function layoutWithThemeDefaults(layout: any, theme: Theme): any {
  const { colors, genericFonts } = theme

  const themeDefaults = {
    font: {
      color: colors.bodyText,
      family: genericFonts.bodyFont,
    },
    paper_bgcolor: colors.bgColor,
    plot_bgcolor: colors.secondaryBg,
  }

  // Fill in theme defaults where the user didn't specify layout options.
  return {
    ...layout,
    font: {
      ...themeDefaults.font,
      ...layout.font,
    },
    paper_bgcolor: layout.paper_bgcolor || themeDefaults.paper_bgcolor,
    plot_bgcolor: layout.plot_bgcolor || themeDefaults.plot_bgcolor,
  }
}

export default withFullScreenWrapper(PlotlyChart)
