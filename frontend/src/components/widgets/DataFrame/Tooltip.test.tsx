import React from "react"

import { screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { waitFor } from "@testing-library/react"

import "@testing-library/jest-dom"

import { render } from "src/lib/test_util"

import Tooltip, { TooltipProps } from "./Tooltip"

describe("Dataframe Tooltip", () => {
  const defaultProps: TooltipProps = {
    top: 100,
    left: 100,
    content: "**This is a tooltip.**",
    clearTooltip: jest.fn(),
  }

  test("renders the tooltip with provided content", () => {
    render(<Tooltip {...defaultProps} />)

    const tooltipContent = screen.getByText("This is a tooltip.")
    expect(tooltipContent).toBeInTheDocument()
    // Uses markdown to render the content:
    expect(tooltipContent).toHaveStyle("font-weight: bold")
  })

  test("calls the clearTooltip callback when escape key is pressed", async () => {
    const user = userEvent.setup()
    const clearTooltipMock = jest.fn()
    const propsWithMockedClearTooltip: TooltipProps = {
      ...defaultProps,
      clearTooltip: clearTooltipMock,
    }

    render(<Tooltip {...propsWithMockedClearTooltip} />)

    const tooltipContent = screen.getByText("This is a tooltip.")
    expect(tooltipContent).toBeInTheDocument()

    user.keyboard("{Escape}")
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" })
    fireEvent.keyDown(tooltipContent, { key: "Escape", code: "Escape" })
    fireEvent.keyDown(window, { key: "Escape", code: "Escape" })
    fireEvent.mouseDown(document.body)
    user.click(document.body)

    // Wait for the event handler to process the keydown event
    await waitFor(() => {
      expect(clearTooltipMock).toHaveBeenCalledTimes(1)
    })
  })

  test("renders the tooltip at the correct position", () => {
    const customPositionProps: TooltipProps = {
      top: 200,
      left: 300,
      content: "Positioned tooltip.",
      clearTooltip: jest.fn(),
    }

    render(<Tooltip {...customPositionProps} />)

    const tooltipContent = screen.getByText("Positioned tooltip.")
    expect(tooltipContent).toBeInTheDocument()

    const invisibleDiv = document.querySelector(
      ".stTooltipTarget"
    ) as HTMLElement

    if (invisibleDiv) {
      expect(invisibleDiv).toHaveStyle("position: fixed")
      expect(invisibleDiv).toHaveStyle("top: 200px")
      expect(invisibleDiv).toHaveStyle("left: 300px")
    } else {
      fail("Invisible div not found")
    }
  })
})
