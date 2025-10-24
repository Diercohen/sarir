import type { FC } from "react";
import "./App.css";
import Canvas from "./components/Canvas/Canvas";
import { CommandBar } from "./components/CommandBar";
import Panels from "./components/Panels/Panels";
import Topbar from "./components/Topbar/Topbar";

const App: FC = () => {
  return (
    <>
      <Topbar />
      <CommandBar />
      <Panels />
      <Canvas />
    </>
  );
};

export default App;
