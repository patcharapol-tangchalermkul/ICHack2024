import React, { useState } from "react";
import Home from "./Home";
import LevelPage from "./LevelPage";
import Level from "./Level";
import Generate from "./Generate";
import { Route, Routes } from "react-router-dom";
import "./App.css";

function App() {
  // Store user levels in state
  const [userLevels, setUserLevels] = React.useState([]);
  const setLevels = 1;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/levels"
          element={<LevelPage levelCount={setLevels + userLevels.length} />}
        />
        <Route
          path="/level/1"
          element={
            <Level
              mapInfo={[
                "O", "O", "O", "O", "E",
                "O", "X", "X", "X", "O",
                "O", "X", "O", "X", "O",
                "O", "X", "O", "O", "O", 
                "S", "X", "X", "X", "X"
              ]}
              model="The solution can be anything."
            />
          }
        />
        {userLevels.map((level, index) => {
          return (
            <Route
              path={`/level/${index + 1 + setLevels}`}
              element={<Level mapInfo={level.map} model={level.model} />}
            />
          );
        })}
        <Route
          path="/teacher"
          element={
            <Generate
              addNewLevel={(s) => {
                setUserLevels(s);
              }}
            />
          }
        />
      </Routes>
    </div>
  );
}

export default App;
