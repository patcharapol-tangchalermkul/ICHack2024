import React from "react";
import { Button, Flex } from "antd";
import "./LevelPage.css";
import "./Home.css";
import { LeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

function LevelPage(props) {
  const navigate = useNavigate();

  function handleClick_back() {
    navigate("/");
  }

  return (
    <div className="login-background" style={{ width: "100%", height: "100%" }}>
      <div className="center-container">
        <div className="login-container">
          {/* Vertical level buttons */}
          <div style={{ marginBottom: "10px" }}>
            <Button
              onClick={handleClick_back}
              type="primary"
              shape="circle"
              icon={<LeftOutlined />}
            ></Button>
          </div>
          <Flex gap="small" align="flex-start" vertical>
            {Array.from({ length: props.levelCount }, (v, i) => i + 1).map(
              (level) => {
                return (
                  <Button
                    onClick={() => navigate(`/level/${level}`)}
                    style={{
                      width: "100%",
                      borderColor: "#d3d3d3",
                      borderRadius: "20px",
                    }}
                  >
                    Level {level}
                  </Button>
                );
              }
            )}
          </Flex>
        </div>
      </div>
    </div>
  );
}

export default LevelPage;
