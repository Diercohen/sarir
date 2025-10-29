import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@radix-ui/react-menubar";
import { SettingsIcon } from "lucide-react";
import type { FC } from "react";

const GeneralSettings: FC = () => {
  return (
    <>
      <Dialog>
        <DialogTrigger>
          <Button variant="ghost" size="sm" aria-label="Submit">
            <SettingsIcon className="size-4" />
            <span className="text-sm">Settings</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>General Settings</DialogTitle>
            <DialogDescription>
              General settings for the application.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Label>Theme</Label>
              <ModeToggle />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GeneralSettings;
