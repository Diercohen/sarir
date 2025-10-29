import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import type { FC } from "react";
import GeneralSettings from "./GeneralSettings";

const Topbar: FC = () => {
  return (
    <Menubar className="border-0 text-white shadow-none px-2 fixed top-0 left-0 right-0 z-50 bg-neutral-700 rounded-none">
      <div className=" w-full flex justify-between items-center">
        <div>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                New Tab <MenubarShortcut>⌘T</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>New Window</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Share</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Print</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </div>
        <GeneralSettings />
      </div>
    </Menubar>
  );
};

export default Topbar;
