import React from "react";
import { Button, Input, Alert, Spin, Tooltip } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import "./Level.css";
import Map from "./Map";
import { evaluateUserInput } from "./gpt.js";

const { TextArea } = Input;

function Level({ mapInfo, model }) {
  const [userInput, setUserInput] = React.useState("");
  const [lastResult, setLastResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const handleChange = (e) => {
    e.preventDefault();
    setUserInput((s) => e.target.value);
  };

  // Convert a list of movement instructions into a list of coordinates
  // Also pad the map to be surrounded by Xs
  const convertTo2DAndPad = (mapInfo) => {
    let map = [];
    let row = [];

    // Convert to 2D
    for (let i = 0; i < mapInfo.length; i++) {
      if (i % Math.sqrt(mapInfo.length) === 0 && i !== 0) {
        map.push(row);
        row = [];
      }
      row.push(mapInfo[i]);
    }
    map.push(row);

    // Pad the map
    let paddedMap = [];
    for (let i = 0; i < map.length + 2; i++) {
      if (i === 0 || i === map.length + 1) {
        paddedMap.push(Array(map[0].length + 2).fill("X"));
      } else {
        paddedMap.push(["X", ...map[i - 1], "X"]);
      }
    }
    return paddedMap;
  };

  // Submit the user inputs by sending them as a POST request to the server
  const submitUserInputs = () => {
    setLoading(true);
    evaluateUserInput(convertTo2DAndPad(mapInfo), userInput, model)
      .then((response) => {
        /* Reasons:
            false, "gpt": "No output to process - try again" (nice retry)
            false, "teacher": result -> Teacher vs student string
            false, "coord-invalid": result -> nice retry
            true, "coord-valid": result -> msg
            "Your response is not entirely correct. Please try again. Feel free to reach out to your teacher for help!"
        */

        if (response.status) {
          // Parse directions - top left is (1, 1)
          const coords = response.result;
          if (response.reason == null) {
            // Correct
            setLastResult({ type: "success", message: null, coords: coords });
          } else {
            // Wrong
            setLastResult({
              type: "error",
              message:
                "Your instructions didn't reach the goal - please try again!",
              coords: coords,
            });
          }
        } else if (
          response.reason === "gpt" ||
          response.reason === "coord-invalid"
        ) {
          // Nice retry
          setLastResult({
            type: "error",
            message: response.result,
            coords: null,
          });
        } else if (response.reason === "teacher") {
          // Teacher vs student string
          setLastResult({
            type: "error",
            message: response.result,
            coords: null,
          });
        } else {
          // Not meant to be here
          console.log("?????");
          setLastResult({
            type: "error",
            message: "Unexpected error - please try again.",
            coords: null,
          });
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  return (
    <div
      className="Level"
      style={{
        position: "relative",
        padding: "5%",
        display: "flex",
        flexDirection: "row",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "50%",
          paddingTop: "4%",
        }}
      >
        <TextArea
          placeholder="Type step-by-step instructions."
          onChange={handleChange}
          autoSize={{ minRows: 3, maxRows: 6 }}
          value={userInput}
          // id={i}
          size="40"
          style={{
            margin: "1%",
            width: "80%",
            // padding: '5%',
          }}
        />
        <Button
          onClick={submitUserInputs}
          disabled={loading}
          style={{
            marginTop: "3%",
            width: "50%",
            borderColor: "#d3d3d3",
            borderRadius: "20px",
            backgroundColor: "black",
            color: "white",
          }}
        >
          {loading ? <Spin size="small" /> : "Submit"}
        </Button>
        {!lastResult ? (
          <Alert
            style={{ textAlign: "left", margin: "5%", width: "80%" }}
            message="The AI marker does not handle complex instructions well."
            description="Make sure your instructions are broken down into small, specific steps. Speak to your teacher if you believe it has made a mistake."
            type="info"
            showIcon
          />
        ) : lastResult.type == "success" ? (
          <Alert
            style={{ textAlign: "left", margin: "5%", width: "80%" }}
            message="Correct!"
            type="success"
            showIcon
          />
        ) : (
          <Alert
            style={{ textAlign: "left", margin: "5%", width: "80%" }}
            message="Sorry, something's not quite right."
            description={
              lastResult.message +
              "\nPlease speak with your teacher if you believe the AI marker has made a mistake."
            }
            type="error"
            showIcon
          />
        )}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyItems: "center",
          alignItems: "center",
          width: "50%",
          height: "fit-content",
        }}
      >
        <div style={{ margin: "5%" }}>
          <Map
            mapInfo={mapInfo}
            editor={false}
            movements={lastResult ? lastResult.coords : null}
          />
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "0",
            right: "0",
            marginLeft: "0%",
            marginRight: "5%",
            marginTop: "0%",
            marginBottom: "-7%",
          }}
        >
          <Tooltip
            title="Provide steps for the triangle to reach the goal. 'Move forward' will cause the triangle to move in the direction it is pointing towards."
            trigger="click"
            defaultOpen
          >
            <Button shape="circle" icon={<QuestionCircleOutlined />} />
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

export default Level;
