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

import React, { PureComponent, ReactElement, ReactNode } from "react"
import { ChevronRight, Close } from "@emotion-icons/material-outlined"
import { withTheme } from "@emotion/react"
import { Resizable } from "re-resizable"

import Icon from "src/components/shared/Icon"
import Button, { Kind } from "src/components/shared/Button"
import { IAppPage, PageConfig } from "src/autogen/proto"
import { Theme } from "src/theme"
import { localStorageAvailable } from "src/lib/storageUtils"

import {
  StyledSidebar,
  StyledSidebarCloseButton,
  StyledSidebarContent,
  StyledSidebarCollapsedControl,
  StyledSidebarUserContent,
  StyledResizeHandle,
} from "./styled-components"
import IsSidebarContext from "./IsSidebarContext"
import SidebarNav from "./SidebarNav"

export interface SidebarProps {
  chevronDownshift: number
  children?: ReactElement
  initialSidebarState?: PageConfig.SidebarState
  theme: Theme
  hasElements: boolean
  appPages: IAppPage[]
  onPageChange: (pageName: string) => void
  currentPageScriptHash: string
  hideSidebarNav: boolean
  pageLinkBaseUrl: string
}

interface State {
  collapsedSidebar: boolean
  collapsedSidebarNav: boolean
  sidebarWidth: string
  lastInnerWidth: number

  // When hovering the nav
  hideScrollbar: boolean
}

class Sidebar extends PureComponent<SidebarProps, State> {
  private mediumBreakpointPx: number

  static readonly minWidth = "336"

  public static calculateMaxBreakpoint(value: string): number {
    // We subtract a margin of 0.02 to use as a max-width
    return parseInt(value, 10) - 0.02
  }

  public static getSidebarNavPreference(): boolean {
    const value = localStorageAvailable()
      ? localStorage.getItem("navExpanded")
      : undefined

    // Should expand by default
    if (value && value === "true") {
      return true
    }

    // Should collapse by default
    return false
  }

  private sidebarRef = React.createRef<HTMLDivElement>()

  constructor(props: SidebarProps) {
    super(props)
    this.mediumBreakpointPx = Sidebar.calculateMaxBreakpoint(
      props.theme.breakpoints.md
    )

    const cachedSidebarWidth = localStorageAvailable()
      ? localStorage.getItem("sidebarWidth")
      : undefined

    const cachedSidebarNavExpandedPreference =
      Sidebar.getSidebarNavPreference()

    this.state = {
      collapsedSidebar: Sidebar.shouldCollapse(props, this.mediumBreakpointPx),
      collapsedSidebarNav: Sidebar.shouldNavCollapse(
        props.appPages.length,
        props.hasElements,
        cachedSidebarNavExpandedPreference
      ),
      sidebarWidth: cachedSidebarWidth || Sidebar.minWidth,
      lastInnerWidth: window ? window.innerWidth : Infinity,
      hideScrollbar: false,
    }
  }

  componentDidUpdate(prevProps: any): void {
    this.mediumBreakpointPx = Sidebar.calculateMaxBreakpoint(
      this.props.theme.breakpoints.md
    )

    const cachedSidebarNavExpandedPreference =
      Sidebar.getSidebarNavPreference()

    // Immediately expand/collapse sidebar when initialSidebarState changes.
    if (this.props.initialSidebarState !== prevProps.initialSidebarState) {
      this.setState({
        collapsedSidebar: Sidebar.shouldCollapse(
          this.props,
          this.mediumBreakpointPx
        ),
      })
    }

    // Change collapse/expand preference if there are widgets on the page
    if (this.props.hasElements !== prevProps.hasElements) {
      this.setState({
        collapsedSidebarNav: Sidebar.shouldNavCollapse(
          this.props.appPages.length,
          this.props.hasElements,
          cachedSidebarNavExpandedPreference
        ),
      })
    }
  }

  static shouldCollapse(
    props: SidebarProps,
    mediumBreakpointPx: number
  ): boolean {
    switch (props.initialSidebarState) {
      case PageConfig.SidebarState.EXPANDED:
        return false
      case PageConfig.SidebarState.COLLAPSED:
        return true
      case PageConfig.SidebarState.AUTO:
      default: {
        // Expand sidebar only if browser width > MEDIUM_BREAKPOINT_PX
        const { innerWidth } = window || {}
        return innerWidth ? innerWidth <= mediumBreakpointPx : false
      }
    }
  }

  static shouldNavCollapse(
    pageQuantity: number,
    hasElements: boolean,
    expandedPreference: boolean
  ): boolean {
    // If we have less than 7 pages, or the current page has no widgets below, it should always be expanded
    if (pageQuantity < 7 || !hasElements) {
      return false
    }
    // If none of the conditions above are met, let's check the user's preference
    if (expandedPreference === true) {
      return false
    }
    // Finally, if none of the above are met, let's collapse the nav
    return true
  }

  componentDidMount(): void {
    window.addEventListener("resize", this.checkMobileOnResize)
    document.addEventListener("mousedown", this.handleClickOutside)
  }

  componentWillUnmount(): void {
    window.removeEventListener("resize", this.checkMobileOnResize)
    document.removeEventListener("mousedown", this.handleClickOutside)
  }

  handleClickOutside = (event: any): void => {
    if (this.sidebarRef && window) {
      const { current } = this.sidebarRef
      const { innerWidth } = window

      if (
        current &&
        !current.contains(event.target) &&
        innerWidth <= this.mediumBreakpointPx
      ) {
        this.setState({ collapsedSidebar: true })
      }
    }
  }

  setSidebarWidth = (width: number): void => {
    const newWidth = width.toString()

    this.setState({ sidebarWidth: newWidth })

    if (localStorageAvailable()) {
      window.localStorage.setItem("sidebarWidth", newWidth)
    }
  }

  resetSidebarWidth = (event: any): void => {
    // Double clicking on the resize handle resets sidebar to default width
    if (event.detail === 2) {
      this.setState({ sidebarWidth: Sidebar.minWidth })
      if (localStorageAvailable()) {
        window.localStorage.setItem("sidebarWidth", Sidebar.minWidth)
      }
    }
  }

  checkMobileOnResize = (): boolean => {
    if (!window) return false

    const { innerWidth } = window

    // Collapse the sidebar if the window was narrowed and is now mobile-sized
    if (
      innerWidth < this.state.lastInnerWidth &&
      innerWidth <= this.mediumBreakpointPx
    ) {
      this.setState({ collapsedSidebar: true })
    }
    this.setState({ lastInnerWidth: innerWidth })

    return true
  }

  toggleCollapse = (): void => {
    const { collapsedSidebar } = this.state

    this.setState({ collapsedSidebar: !collapsedSidebar })
  }

  hideScrollbar = (newValue: boolean): void => {
    this.setState({ hideScrollbar: newValue })
  }

  public render(): ReactNode {
    const {
      collapsedSidebar,
      sidebarWidth,
      hideScrollbar,
      collapsedSidebarNav,
    } = this.state
    const {
      appPages,
      chevronDownshift,
      children,
      hasElements,
      onPageChange,
      currentPageScriptHash,
      hideSidebarNav,
      pageLinkBaseUrl,
    } = this.props

    const hasPageNavAbove = appPages.length > 1 && !hideSidebarNav

    // The tabindex is required to support scrolling by arrow keys.
    return (
      <>
        {collapsedSidebar && (
          <StyledSidebarCollapsedControl
            chevronDownshift={chevronDownshift}
            isCollapsed={collapsedSidebar}
            data-testid="collapsedControl"
          >
            <Button kind={Kind.HEADER_BUTTON} onClick={this.toggleCollapse}>
              <Icon content={ChevronRight} size="lg" />
            </Button>
          </StyledSidebarCollapsedControl>
        )}
        <Resizable
          data-testid="stSidebar"
          aria-expanded={!collapsedSidebar}
          enable={{
            top: false,
            right: true,
            bottom: false,
            left: false,
          }}
          handleStyles={{ right: { width: "8px", right: "-6px" } }}
          handleComponent={{
            right: <StyledResizeHandle onClick={this.resetSidebarWidth} />,
          }}
          size={{ width: sidebarWidth, height: "100%" }}
          as={StyledSidebar}
          onResizeStop={(e, direction, ref, d) => {
            const newWidth = parseInt(sidebarWidth, 10) + d.width
            this.setSidebarWidth(newWidth)
          }}
          // Props part of StyledSidebar, but not Resizable component
          // @ts-ignore
          isCollapsed={collapsedSidebar}
          sidebarWidth={sidebarWidth}
        >
          <StyledSidebarContent
            hideScrollbar={hideScrollbar}
            ref={this.sidebarRef}
          >
            <StyledSidebarCloseButton>
              <Button kind={Kind.HEADER_BUTTON} onClick={this.toggleCollapse}>
                <Icon content={Close} size="lg" />
              </Button>
            </StyledSidebarCloseButton>
            {hasPageNavAbove && (
              <SidebarNav
                appPages={appPages}
                collapseSidebar={this.toggleCollapse}
                collapseNav={collapsedSidebarNav}
                currentPageScriptHash={currentPageScriptHash}
                hasSidebarElements={hasElements}
                hideParentScrollbar={this.hideScrollbar}
                onPageChange={onPageChange}
                pageLinkBaseUrl={pageLinkBaseUrl}
              />
            )}
            <StyledSidebarUserContent hasPageNavAbove={hasPageNavAbove}>
              {children}
            </StyledSidebarUserContent>
          </StyledSidebarContent>
        </Resizable>
      </>
    )
  }
}

function SidebarWithProvider(props: SidebarProps): ReactElement {
  return (
    <IsSidebarContext.Provider value={true}>
      <Sidebar {...props} />
    </IsSidebarContext.Provider>
  )
}

export default withTheme(SidebarWithProvider)
