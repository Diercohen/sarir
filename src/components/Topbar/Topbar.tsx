import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { SettingsIcon } from "lucide-react";
import type { FC } from "react";
import { Button } from "../ui/button";

const Topbar: FC = () => {
  return (
    <Menubar className="border-0 shadow-none mx-2 fixed top-0 left-0 right-0 z-50">
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
        <Button variant="ghost" size="sm" aria-label="Submit">
          <SettingsIcon className="size-4" />
          <span className="text-sm">Settings</span>
        </Button>
      </div>
    </Menubar>
  );
};

export default Topbar;
