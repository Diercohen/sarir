import type { FC } from "react";
import "./App.css";
import CanvasBoard from "./components/CanvasBoard/CanvasBoard";
import { CommandBar } from "./components/CommandBar";
import Panels from "./components/Panels/Panels";
import Topbar from "./components/Topbar/Topbar";

const App: FC = () => {
  return (
    <>
      <Topbar />
      <CommandBar />
      <Panels />
      <CanvasBoard />
    </>
  );
};

export default App;
