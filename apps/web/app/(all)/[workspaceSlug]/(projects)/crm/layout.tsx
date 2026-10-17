/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { CrmHeader } from "./header";

export default function WorkspaceCrmLayout() {
  return (
    <>
      <AppHeader header={<CrmHeader />} />
      <div className="relative h-full w-full overflow-hidden">
        <Outlet />
      </div>
    </>
  );
}
