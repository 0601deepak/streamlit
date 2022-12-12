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

import { GridCell, GridCellKind, NumberCell } from "@glideapps/glide-data-grid"
import { sprintf } from "sprintf-js"

import { DataType, Quiver } from "src/lib/Quiver"
import { notNullOrUndefined } from "src/lib/utils"

import {
  BaseColumn,
  BaseColumnProps,
  getErrorCell,
  ColumnCreator,
} from "./BaseColumn"

interface NumberColumnParams {
  readonly precision?: number
  readonly min?: number
  readonly max?: number
  readonly format?: string
}

function NumberColumn(props: BaseColumnProps): BaseColumn {
  const quiverTypeName = Quiver.getTypeName(props.quiverType)

  const parameters = {
    precision:
      quiverTypeName.startsWith("int") ||
      quiverTypeName === "range" ||
      quiverTypeName.startsWith("uint")
        ? 0
        : undefined,
    min: quiverTypeName.startsWith("uint") ? 0 : undefined,
    ...(props.columnTypeMetadata || {}),
  } as NumberColumnParams

  const cellTemplate = {
    kind: GridCellKind.Number,
    data: undefined,
    displayData: "",
    readonly: !props.isEditable,
    allowOverlay: true,
    contentAlign: props.contentAlignment || "right",
    style: props.isIndex ? "faded" : "normal",
  } as NumberCell

  return {
    ...props,
    kind: "number",
    sortMode: "smart",
    getCell(data?: DataType): GridCell {
      let cellData: number | null = null
      let displayData: string = ""

      if (
        !notNullOrUndefined(data) ||
        (typeof data === "string" && data.trim().length === 0)
      ) {
        // Set to value to null if empty string or null/undefined
        cellData = null
      } else {
        if (data instanceof Int32Array) {
          // int values need to be extracted this way:
          // eslint-disable-next-line prefer-destructuring
          cellData = Number(data[0])
        } else {
          cellData = Number(data)
        }

        if (Number.isNaN(cellData)) {
          return getErrorCell(String(data), "Incompatible number value.")
        }

        // Apply precision parameter
        if (notNullOrUndefined(parameters.precision)) {
          // TODO(lukasmasuch): Update the number input to support precision
          // TODO(lukasmasuch): Round instead?
          cellData =
            parameters.precision === 0
              ? Math.trunc(cellData)
              : Math.trunc(cellData * Math.pow(10, parameters.precision)) /
                Math.pow(10, parameters.precision)
        }

        // Apply min parameter
        if (notNullOrUndefined(parameters.min)) {
          cellData = Math.min(cellData, parameters.min)
        }

        // Apply max parameter
        if (notNullOrUndefined(parameters.max)) {
          cellData = Math.max(cellData, parameters.max)
        }

        // If user has specified a format pattern in type metadata
        if (notNullOrUndefined(parameters.format)) {
          try {
            displayData = sprintf(parameters.format, cellData)
          } catch (error) {
            return getErrorCell(
              String(cellData),
              `Format value (${parameters.format}) not sprintf compatible. Error: ${error}`
            )
          }
        }
      }

      return {
        ...cellTemplate,
        data: cellData,
        displayData: notNullOrUndefined(cellData) ? cellData.toString() : "",
      } as NumberCell
    },
    getCellValue(cell: NumberCell): number | null {
      return cell.data === undefined ? null : cell.data
    },
  }
}

NumberColumn.isEditableType = true

export default NumberColumn as ColumnCreator
