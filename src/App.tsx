import type { FC } from "react";
import "./App.css";
import Canvas from "./components/Canvas/Canvas";
import Panels from "./components/Panels/Panels";
import Topbar from "./components/Topbar/Topbar";

const App: FC = () => {
  return (
    <>
      <Topbar />
      <Panels />
      <Canvas />
    </>
  );
};

export default App;
