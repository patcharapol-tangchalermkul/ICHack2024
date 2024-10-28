import React, {
  forwardRef,
  useRef,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";
import "./Map.css";
import { useSpring, animated } from "@react-spring/web";

const Map = forwardRef((props, ref) => {
  const cellWidth = 65;
  const [state, setState] = useState(props);

  useEffect(() => {
    setState(props);
  }, [props]);

  useImperativeHandle(ref, () => ({
    saveMapToJson(model) {
      // Map the numbers to block categories (letters)
      let mapInfo = state.mapInfo.map((x) => {
        return colorIndexMap[x];
      });

      const json = {
        map: mapInfo,
        model: model,
      };

      props.addNewLevel((s) => {
        return [...s, json];
      });
    },
  }));

  // let currGrid = props.mapInfo
  const mapDim = Math.sqrt(props.mapInfo.length);

  // Convert a list of grid coordinates into a list of coordinates
  const convertToCoordinates = (instructions) => {
    let current_orientation = 0;

    const coordinates = [];
    let left_offset = 0;
    let top_offset = 0;
    for (let i = 0; i < instructions.length; i++) {
      if (instructions[i] === "R") {
        current_orientation = (current_orientation + 1) % 4;
      } else if (instructions[i] === "B") {
        current_orientation = (current_orientation + 2) % 4;
      } else if (instructions[i] === "L") {
        current_orientation = (current_orientation + 3) % 4;
      }
      let result = moveForward(left_offset, top_offset, current_orientation);
      coordinates.push(result);

      left_offset = result.x;
      top_offset = result.y;
    }
    return coordinates;
  };

  function moveForward(current_x, current_y, current_orientation) {
    if (current_orientation === 0) {
      current_y += cellWidth;
    } else if (current_orientation === 1) {
      current_x += cellWidth;
    } else if (current_orientation === 2) {
      current_y -= cellWidth;
    } else if (current_orientation === 3) {
      current_x -= cellWidth;
    }
    return {
      x: current_x,
      y: current_y,
      facing: current_orientation,
    };
  }

  const springs = useSpring({
    from: { bottom: 0, left: 0, rotate: "0deg" },
    to: async (next, cancel) => {
      if (props.movements) {
        for (const coordinate of convertToCoordinates(props.movements)) {
          await next({ rotate: coordinate.facing * 90 + "deg" });

          await next({ left: coordinate.x });
          await next({ bottom: coordinate.y });
        }
      }
    },
    loop: false,
  });

  const boxStyle = {
    position: "absolute",
    justifySelf: "center",
    bottom: "0",
    left: "0",
    // width: cellWidth + 'px',
    // height: cellWidth + 'px',
    width: 0,
    height: 0,
    borderLeft: cellWidth / 2 + "px solid transparent",
    borderRight: cellWidth / 2 + "px solid transparent",
    borderBottom: cellWidth / 1 + "px solid #ff6d6d",
    opacity: "1",
    zIndex: "1",
    boxSizing: "border-box",
    // borderRadius: "10px",
    ...springs,
  };

  function onClick(index) {
    let newGrid = props.mapInfo;
    newGrid[index] = (newGrid[index] + 1) % Object.keys(backgroundColor).length;
    setState({ mapInfo: newGrid });
  }

  const colorIndexMap = {
    0: "O",
    1: "X",
    2: "S",
    3: "E",
    4: "Y",
    5: "R",
  };

  const backgroundColor = {
    S: "green",
    O: "white",
    X: "black",
    E: "purple",
    Y: "yellow",
    R: "red",
  };

  return (
    <div className="grid" style={{ position: "relative" }}>
      {(() => {
        const finalGeneration = [];
        for (let i = 0; i < mapDim; i++) {
          finalGeneration.push(
            <div
              key={i}
              className="row"
              style={{
                display: "flex",
                flexDirection: "row",
              }}
            >
              {(() => {
                const gridGeneration = [];
                for (let j = 0; j < mapDim; j++) {
                  gridGeneration.push(
                    <div
                      key={j}
                      className="cell"
                      onClick={
                        props.editor ? () => onClick(i * mapDim + j) : () => {}
                      }
                      style={{
                        backgroundColor: props.editor
                          ? backgroundColor[
                              colorIndexMap[state.mapInfo[i * mapDim + j]]
                            ]
                          : backgroundColor[state.mapInfo[i * mapDim + j]],
                        width: cellWidth + "px",
                        height: cellWidth + "px",
                        border: "0.5px solid #d3d3d3",
                        boxSizing: "border-box",
                      }}
                    ></div>
                  );
                }
                return gridGeneration;
              })()}
            </div>
          );
        }
        return <div>{finalGeneration}</div>;
      })()}
      {props.editor ? null : (
        <animated.div className="player" style={boxStyle}></animated.div>
      )}
    </div>
  );
});
export default Map;
