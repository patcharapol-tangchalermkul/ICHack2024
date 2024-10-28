import React, { useEffect, useRef } from "react";
import { Button, Col, Input, InputNumber, Row, Slider, Space } from "antd";
import Map from "./Map";
const { TextArea } = Input;

function Generate(props) {
  const childRef = useRef();
  const modelInputRef = useRef("");

  const [gridDimensions, setGridDimensions] = React.useState(5);
  const [model, setModel] = React.useState(null);

  const onChange = (newValue) => {
    setGridDimensions(newValue);
  };

  function makeGrid(dim) {
    let grid = [];
    for (let i = 0; i < dim * dim; i++) {
      grid.push(0);
    }
    return grid;
  }

  const handleChange = (e) => {
    e.preventDefault();
    setModel((s) => e.target.value);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      <div>
        <Map
          mapInfo={makeGrid(gridDimensions)}
          editor={true}
          addNewLevel={props.addNewLevel}
          ref={childRef}
        />
      </div>
      <div style={{ width: "35%" }}>
        <Row>
          <Col span={10}>
            <h3>Grid Dimensions</h3>
          </Col>
          <Col style={{ paddingTop: "2%" }} span={12}>
            <Slider
              min={5}
              max={7}
              onChange={onChange}
              value={gridDimensions}
            />
          </Col>
        </Row>
      </div>
      <TextArea
        placeholder="Provide some guidance for the AI marker. Be as specific as possible."
        // onChange={handleChange}
        autoSize={{ minRows: 3, maxRows: 6 }}
        ref={modelInputRef}
        size="40"
        style={{
          margin: "1%",
          width: "43%",
          // paddingBottom: '5%',
        }}
      />
      <Button
        style={{
          width: "23%",
          borderColor: "#d3d3d3",
          borderRadius: "20px",
          backgroundColor: "black",
          color: "white",
        }}
        onClick={() => {
          const fieldValue =
            modelInputRef.current.resizableTextArea.textArea.value;
          if (fieldValue && fieldValue.length > 0) {
            console.log("Saving map with specific guidance.")
            childRef.current.saveMapToJson(fieldValue);
          } else {
            console.log("Saving map with default guidance.");
            childRef.current.saveMapToJson("The solution can be anything.");
          }
        }}
      >
        Submit
      </Button>
    </div>
    // <div className="App" style={{
    //     padding: '5%',
    //     display: 'flex',
    //     flexDirection: 'row',
    // }}>
    // <div style={{
    //     display: 'flex',
    //     flexDirection: 'column',
    //     alignItems: 'center',
    //     justifyContent: 'center',
    //     // height: '80%',
    //     width: '50%',
    //     border: '1px solid black',
    //     // maxHeight: "400pt",
    //     // overflowY: "scroll",
    // }}>
    // {userInputs.map((item, i) => {
    //     return (
    //         <Input
    //         placeholder='Type an instruction...'
    //         onChange={handleChange}
    //         value={item.value}
    //         id={i}
    //         type={item.type}
    //         size="40"
    //         style={{
    //             margin: '1%',
    //             width: '60%',
    //             // padding: '5%',
    //         }}
    //         />
    //         );
    //     })}
    //     <Button onClick={addNewUserInput} shape='circle' icon={<PlusOutlined />}/>
    //     </div>
    //     <div style={{
    //         border: '1px solid red',
    //         width: '50%',
    //         height: 'fit-content',
    //     }}>
    //     <div style={{border: '1px solid blue'}}>
    //     <Map />
    //     </div>
    //     <Button onClick={submitUserInputs} type='primary'>Submit</Button>
    //     </div>
    //     </div>
  );
}

export default Generate;
