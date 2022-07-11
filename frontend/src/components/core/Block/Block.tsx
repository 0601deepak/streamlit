/**
 * @license
 * Copyright 2018-2022 Streamlit Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Block as BlockProto } from "src/autogen/proto"

import React, { ReactElement } from "react"
import { AutoSizer } from "react-virtualized"
import { BlockNode, AppNode, ElementNode } from "src/lib/AppNode"
import { getElementWidgetID } from "src/lib/utils"
import withExpandable from "src/hocs/withExpandable"
import { Form } from "src/components/widgets/Form"

import {
  BaseBlockProps,
  isComponentStale,
  shouldComponentBeEnabled,
} from "./utils"
import ElementNodeRenderer, { TestElementNodeRenderer } from "./ElementNodeRenderer"

import {
  StyledColumn,
  StyledHorizontalBlock,
  styledHorizontalBlockWrapperStyles,
  StyledHorizontalTestBlock,
  StyledVerticalBlock,
  styledVerticalBlockWrapperStyles,
} from "./styled-components"

const ExpandableLayoutBlock = withExpandable(TestLayoutBlock)

interface BlockPropsWithoutWidth extends BaseBlockProps {
  node: BlockNode
}

interface BlockPropsWithWidth extends BaseBlockProps {
  node: BlockNode
  width: number
}

// Render BlockNodes (i.e. container nodes).
const BlockNodeRenderer = (props: BlockPropsWithWidth): ReactElement => {
  const { node } = props

  // Allow columns to create the specified space regardless of empty state
  if (node.isEmpty && !node.deltaBlock.column) {
    return <></>
  }

  const enable = shouldComponentBeEnabled("", props.scriptRunState)
  const isStale = isComponentStale(
    enable,
    node,
    props.scriptRunState,
    props.scriptRunId
  )

  const optionalProps = node.deltaBlock.expandable
    ? {
        empty: node.isEmpty,
        isStale,
        ...node.deltaBlock.expandable,
      }
    : {}

  const childProps = { ...props, ...optionalProps, ...{ node } }

  const child = node.deltaBlock.expandable ? (
    <ExpandableLayoutBlock {...childProps} />
  ) : (
    <TestLayoutBlock {...childProps} />
  )

  if (node.deltaBlock.type === "form") {
    const { formId, clearOnSubmit } = node.deltaBlock.form as BlockProto.Form
    const submitButtonCount = props.formsData.submitButtonCount.get(formId)
    const hasSubmitButton =
      submitButtonCount !== undefined && submitButtonCount > 0
    return (
      <Form
        formId={formId}
        clearOnSubmit={clearOnSubmit}
        width={props.width}
        hasSubmitButton={hasSubmitButton}
        scriptRunState={props.scriptRunState}
        widgetMgr={props.widgetMgr}
      >
        {child}
      </Form>
    )
  }

  if (node.deltaBlock.column) {
    return (
      <StyledColumn
        weight={node.deltaBlock.column.weight ?? 0}
        data-testid="column"
      >
        {child}
      </StyledColumn>
    )
  }

  return child
}

// Render BlockNodes (i.e. container nodes).
const TestBlockNodeRenderer = (props: BlockPropsWithoutWidth): ReactElement => {
  const { node } = props

  // Allow columns to create the specified space regardless of empty state
  if (node.isEmpty && !node.deltaBlock.column) {
    return <></>
  }

  const enable = shouldComponentBeEnabled("", props.scriptRunState)
  const isStale = isComponentStale(
    enable,
    node,
    props.scriptRunState,
    props.scriptRunId
  )

  const optionalProps = node.deltaBlock.expandable
    ? {
        empty: node.isEmpty,
        isStale,
        ...node.deltaBlock.expandable,
      }
    : {}

  const childProps = { ...props, ...optionalProps, ...{ node } }

  const child = node.deltaBlock.expandable ? (
    <ExpandableLayoutBlock {...childProps} />
  ) : (
    <TestLayoutBlock {...childProps} />
  )

  if (node.deltaBlock.type === "form") {
    const { formId, clearOnSubmit } = node.deltaBlock.form as BlockProto.Form
    const submitButtonCount = props.formsData.submitButtonCount.get(formId)
    const hasSubmitButton =
      submitButtonCount !== undefined && submitButtonCount > 0
    return (
      <Form
        formId={formId}
        clearOnSubmit={clearOnSubmit}
        width={"100%"}
        hasSubmitButton={hasSubmitButton}
        scriptRunState={props.scriptRunState}
        widgetMgr={props.widgetMgr}
      >
        {child}
      </Form>
    )
  }

  if (node.deltaBlock.column) {
    return (
      <StyledColumn
        weight={node.deltaBlock.column.weight ?? 0}
        data-testid="column"
      >
        {child}
      </StyledColumn>
    )
  }

  return child
}

const ChildRenderer = (props: BlockPropsWithWidth): ReactElement => {
  return (
    <>
      {props.node.children.map(
        (node: AppNode, index: number): ReactElement => {
          // Base case: render a leaf node.
          if (node instanceof ElementNode) {
            // Put node in childProps instead of passing as a node={node} prop in React to
            // guarantee it doesn't get overwritten by {...childProps}.
            const childProps = { ...props, ...{ node: node as ElementNode } }

            const key = getElementWidgetID(node.element) || index
            return <ElementNodeRenderer key={key} {...childProps} />
          }

          // Recursive case: render a block, which can contain other blocks
          // and elements.
          if (node instanceof BlockNode) {
            // Put node in childProps instead of passing as a node={node} prop in React to
            // guarantee it doesn't get overwritten by {...childProps}.
            const childProps = { ...props, ...{ node: node as BlockNode } }

            return <TestBlockNodeRenderer key={index} {...childProps} />
          }

          // We don't have any other node types!
          throw new Error(`Unrecognized AppNode: ${node}`)
        }
      )}
    </>
  )
}

const TestChildRenderer = (props: BlockPropsWithoutWidth): ReactElement => {
  return (
    <>
      {props.node.children.map(
        (node: AppNode, index: number): ReactElement => {
          // Base case: render a leaf node.
          if (node instanceof ElementNode) {
            // Put node in childProps instead of passing as a node={node} prop in React to
            // guarantee it doesn't get overwritten by {...childProps}.
            const childProps = { ...props, ...{ node: node as ElementNode } }

            const key = getElementWidgetID(node.element) || index
            return <TestElementNodeRenderer key={key} {...childProps} />
          }

          // Recursive case: render a block, which can contain other blocks
          // and elements.
          if (node instanceof BlockNode) {
            // Put node in childProps instead of passing as a node={node} prop in React to
            // guarantee it doesn't get overwritten by {...childProps}.
            const childProps = { ...props, ...{ node: node as BlockNode } }

            return <TestBlockNodeRenderer key={index} {...childProps} />
          }

          // We don't have any other node types!
          throw new Error(`Unrecognized AppNode: ${node}`)
        }
      )}
    </>
  )
}

// Currently, only VerticalBlocks will ever contain leaf elements. But this is only enforced on the
// Python side.
const VerticalBlock = (props: BlockPropsWithoutWidth): ReactElement => {
  // Widths of children autosizes to container width (and therefore window width).
  // StyledVerticalBlocks are the only things that calculate their own widths. They should never use
  // the width value coming from the parent via props.
  return (
    <AutoSizer disableHeight={true} style={styledVerticalBlockWrapperStyles}>
      {({ width }) => {
        const propsWithNewWidth = { ...props, ...{ width:160 } }

        return (
          <StyledVerticalBlock width={width} data-testid="stVerticalBlock">
            <TestChildRenderer {...props} />
          </StyledVerticalBlock>
        )
      }}
    </AutoSizer>
  )
}

const HorizontalBlock = (props: BlockPropsWithWidth): ReactElement => {
  // Create a horizontal block as the parent for columns.
  // The children are always columns, but this is not checked. We just trust the Python side to
  // do the right thing, then we ask ChildRenderer to handle it.
  return (
    <StyledHorizontalBlock data-testid="stHorizontalBlock">
      <TestChildRenderer {...props} />
    </StyledHorizontalBlock>
  )
}

const TestHorizontalBlock = (props: BlockPropsWithoutWidth): ReactElement => {
  // Create a horizontal block as the parent for columns.
  // The children are always columns, but this is not checked. We just trust the Python side to
  // do the right thing, then we ask ChildRenderer to handle it.
  console.log(props)
  const propsWithNewWidth = { ...props}
  return (
          <StyledHorizontalTestBlock data-testid="stHorizontalTestBlock">
            <TestChildRenderer {...propsWithNewWidth} />
          </StyledHorizontalTestBlock>
  )
}

// A container block with one of two types of layouts: vertical and horizontal.
function LayoutBlock(props: BlockPropsWithWidth): ReactElement {
  if (props.node.deltaBlock.row) {
    return <TestHorizontalBlock {...props} />
  }
  if (props.node.deltaBlock.horizontal) {
    return <HorizontalBlock {...props} />
  }

  return <VerticalBlock {...props} />
}

// A container block with one of two types of layouts: vertical and horizontal.
function TestLayoutBlock(props: BlockPropsWithoutWidth): ReactElement {
  if (props.node.deltaBlock.row) {
    return <TestHorizontalBlock {...props} />
  }

  return <TestHorizontalBlock {...props} />
}

export default VerticalBlock
