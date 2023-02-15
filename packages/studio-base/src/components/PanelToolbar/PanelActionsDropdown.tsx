// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2018-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import {
  Delete as DeleteIcon,
  FullScreenMaximize as FullScreenMaximizeIcon,
  ShapeSubtract as ShapeSubtractIcon,
  SplitHorizontal as SplitHorizontalIcon,
  SplitVertical as SplitVerticalIcon,
} from "@emotion-icons/fluentui-system-regular";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Divider, Menu, MenuItem } from "@mui/material";
import { MouseEvent, useCallback, useContext, useMemo, useRef, useState } from "react";
import { MosaicContext, MosaicNode, MosaicWindowContext } from "react-mosaic-component";
import { makeStyles } from "tss-react/mui";

import PanelContext from "@foxglove/studio-base/components/PanelContext";
import ChangePanelMenu from "@foxglove/studio-base/components/PanelToolbar/ChangePanelMenu";
import ToolbarIconButton from "@foxglove/studio-base/components/PanelToolbar/ToolbarIconButton";
import { getPanelTypeFromMosaic } from "@foxglove/studio-base/components/PanelToolbar/utils";
import { useCurrentLayoutActions } from "@foxglove/studio-base/context/CurrentLayoutContext";

type Props = {
  isUnknownPanel: boolean;
};

const useStyles = makeStyles()((theme) => ({
  error: {
    color: theme.palette.error.main,
  },
  chevronRight: {
    marginRight: theme.spacing(-1),
  },
  icon: {
    height: 18,
    width: 18,
  },
  deleteIcon: {
    height: 22,
    width: 22,
    margin: -2,
  },
  menuItem: {
    display: "flex",
    gap: theme.spacing(1),
    alignItems: "center",

    ".root-span": {
      display: "flex",
      marginLeft: theme.spacing(-0.25),
    },
    "&.Mui-selected": {
      backgroundColor: theme.palette.action.hover,

      "&:hover": {
        backgroundColor: theme.palette.action.hover,
      },
    },
  },
}));

export function PanelActionsDropdown({ isUnknownPanel }: Props): JSX.Element {
  const { classes, cx } = useStyles();
  const [menuAnchorEl, setMenuAnchorEl] = useState<undefined | HTMLElement>(undefined);
  const [subMenuAnchorEl, setSubmenuAnchorEl] = useState<undefined | HTMLElement>(undefined);

  const menuOpen = Boolean(menuAnchorEl);
  const submenuOpen = Boolean(subMenuAnchorEl);

  const panelContext = useContext(PanelContext);
  const tabId = panelContext?.tabId;
  const { mosaicActions } = useContext(MosaicContext);
  const { mosaicWindowActions } = useContext(MosaicWindowContext);
  const {
    getCurrentLayoutState: getCurrentLayout,
    closePanel,
    splitPanel,
  } = useCurrentLayoutActions();
  const getPanelType = useCallback(
    () => getPanelTypeFromMosaic(mosaicWindowActions, mosaicActions),
    [mosaicActions, mosaicWindowActions],
  );

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSubmenuAnchorEl(undefined);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setSubmenuAnchorEl(undefined);
    setMenuAnchorEl(undefined);
  };

  const handleSubmenuClick = (event: MouseEvent<HTMLElement>) => {
    if (subMenuAnchorEl !== event.currentTarget) {
      setSubmenuAnchorEl(event.currentTarget);
    }
    setMenuAnchorEl(undefined);
  };

  const handleSubmenuClose = useCallback(() => {
    setSubmenuAnchorEl(undefined);
  }, []);

  const handleSubmenuMouseEnter = (event: MouseEvent<HTMLElement>) => {
    setSubmenuAnchorEl(event.currentTarget);
  };

  const close = useCallback(() => {
    closePanel({
      tabId,
      root: mosaicActions.getRoot() as MosaicNode<string>,
      path: mosaicWindowActions.getPath(),
    });
    handleMenuClose();
  }, [closePanel, mosaicActions, mosaicWindowActions, tabId]);

  const split = useCallback(
    (id: string | undefined, direction: "row" | "column") => {
      const type = getPanelType();
      if (id == undefined || type == undefined) {
        throw new Error("Trying to split unknown panel!");
      }

      const config = getCurrentLayout().selectedLayout?.data?.configById[id] ?? {};
      splitPanel({
        id,
        tabId,
        direction,
        root: mosaicActions.getRoot() as MosaicNode<string>,
        path: mosaicWindowActions.getPath(),
        config,
      });
      handleMenuClose();
    },
    [getCurrentLayout, getPanelType, mosaicActions, mosaicWindowActions, splitPanel, tabId],
  );

  const enterFullscreen = useCallback(() => {
    panelContext?.enterFullscreen();
    handleMenuClose();
  }, [panelContext]);

  const menuItems = useMemo(() => {
    const items = [];

    if (!isUnknownPanel) {
      items.push(
        {
          key: "hsplit",
          text: "Split horizontal",
          icon: <SplitHorizontalIcon className={classes.icon} />,
          onClick: () => split(panelContext?.id, "column"),
        },
        {
          key: "vsplit",
          text: "Split vertical",
          icon: <SplitVerticalIcon className={classes.icon} />,
          onClick: () => split(panelContext?.id, "row"),
        },
      );
    }

    if (panelContext?.isFullscreen !== true) {
      items.push({
        key: "enter-fullscreen",
        text: "Fullscreen",
        icon: <FullScreenMaximizeIcon className={classes.icon} />,
        onClick: enterFullscreen,
        "data-testid": "panel-menu-fullscreen",
      });
    }

    items.push({ key: "divider", type: "divider" });

    items.push({
      key: "remove",
      text: "Remove panel",
      icon: <DeleteIcon className={classes.deleteIcon} />,
      onClick: close,
      "data-testid": "panel-menu-remove",
      className: classes.error,
    });

    return items;
  }, [
    classes.deleteIcon,
    classes.error,
    classes.icon,
    close,
    enterFullscreen,
    isUnknownPanel,
    panelContext?.id,
    panelContext?.isFullscreen,
    split,
  ]);

  const buttonRef = useRef<HTMLDivElement>(ReactNull);
  const type = getPanelType();

  if (type == undefined) {
    return <></>;
  }

  return (
    <div ref={buttonRef}>
      <ToolbarIconButton
        id="panel-menu-button"
        aria-controls={menuOpen ? "panel-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={menuOpen ? "true" : undefined}
        onClick={handleMenuClick}
        data-testid="panel-menu"
        title="More"
      >
        <MoreVertIcon />
      </ToolbarIconButton>
      <Menu
        id="panel-menu"
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        MenuListProps={{
          "aria-labelledby": "panel-menu-button",
          dense: true,
        }}
      >
        <MenuItem
          className={classes.menuItem}
          selected={submenuOpen}
          id="change-panel-button"
          aria-controls={submenuOpen ? "change-panel-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={submenuOpen ? "true" : undefined}
          onClick={handleSubmenuClick}
          onMouseEnter={handleSubmenuMouseEnter}
        >
          <ShapeSubtractIcon className={classes.icon} />
          Change panel
          <ChevronRightIcon className={classes.chevronRight} fontSize="small" />
        </MenuItem>
        <ChangePanelMenu anchorEl={subMenuAnchorEl} onClose={handleSubmenuClose} tabId={tabId} />
        <Divider variant="middle" />
        {menuItems.map((item, idx) =>
          item.type === "divider" ? (
            <Divider key={`divider-${idx}`} variant="middle" />
          ) : (
            <MenuItem
              key={item.key}
              onClick={(event) => {
                event.stopPropagation();
                item.onClick?.();
              }}
              onMouseEnter={() => setSubmenuAnchorEl(undefined)}
              className={cx(classes.menuItem, item.className)}
              data-testid={item["data-testid"]}
            >
              {item.icon}
              {item.text}
            </MenuItem>
          ),
        )}
      </Menu>
    </div>
  );
}
