const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: "NOT_A_REAL_API_KEY",
  dangerouslyAllowBrowser: true,
});

const retryMessage = `Hey there! Thank you so much for giving it a shot! 
                We truly appreciate your effort. Could you please try again and explain your thoughts with more detail? 
                We want to make sure you have a crystal-clear understanding of the concept.`;

//     const fewShotPrompt = `
//     Map:
//     [ ['X', 'X', 'X', 'X', 'X', 'X'],
//     ['X', 'O', 'O', 'Y', 'E', 'X'],
//     ['X', 'O', 'X', 'O', 'O', 'X'],
//     ['X', 'Y', 'O', 'R', 'O', 'X'],
//     ['X', 'S', 'X', 'X', 'O', 'X'],
//     ['X', 'X', 'X', 'X', 'X', 'X']]
//     Instruction: walk up from the starting point. If you hit and wall, turn right and continue. Stop when you reach the endpoint.
//     Answer: [(4, 1), (3, 1), (2, 1), (1, 1), (1, 2), (1, 3), (1, 4)]

//     Map:
//     [ ['X', 'X', 'X', 'X', 'X', 'X'],
//     ['X', 'O', 'O', 'Y', 'E', 'X'],
//     ['X', 'O', 'X', 'O', 'O', 'X'],
//     ['X', 'Y', 'O', 'R', 'O', 'X'],
//     ['X', 'S', 'X', 'X', 'O', 'X'],
//     ['X', 'X', 'X', 'X', 'X', 'X']]
//     Instruction: walk randomly until you reach the endpoint.
//     Answer: FALSE the instruction to walk randomly is too ambiguous.

async function getGPTResponse(messages) {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: messages,
    temperature: 0.5,
    // tools: tools? tools : [],
    // tool_choice: "auto"
  });
  return completion;
}

async function getInitialGPTResult(messages, query_msg) {
  const gameIntroPrompt =
    "I will send you a map, a 2D array of characters. 'O' represents an empty space, 'X' represents a wall, 'S' represents the starting point," +
    "and 'E' represents the ending point, 'Y' represents a yellow box and 'R' represents a red box. " +
    "Then, I will also send you an instruction. Give me a list of coordinates that you would follow based on the " +
    "instruction to traverse the map, with the goal of reaching the endpoint from the starting point. " +
    "The x and y coordinates of the map follows the following reasoning: Moving up decreases x, moving down increases x, moving right increases y, moving left decreases y." +
    "Follow the instructions strictly. Show every step taken, including any backtracks, and carefully explain your thought process. " +
    "If the instruction is clear and executable, and the path ends at the endpoint, return the list of coordinates traversed. " +
    "Otherwise, if there is something unclear about the instruction, or if you stepped on a wall coordinate or go out of boundaries " +
    "or if the path does not end at the endpoint, say FALSE and give a short description of what went wrong.";
  messages.push({ role: "user", content: gameIntroPrompt });
  messages.push({
    role: "user",
    content: query_msg + "Let's think step by step.",
  });
  var completion = await getGPTResponse(messages);
  console.log(completion.choices[0]["message"]["content"]);
  messages.push({
    role: "assistant",
    content: completion.choices[0]["message"]["content"],
  });
  return messages;
}

async function getResponseJson(messages) {
  try {
    let response = await summariseAndParseOutput(messages);
    console.log("Successfully obtained response:", response);
    return response;
  } catch (error) {
    try {
      let response = await summariseAndParseOutput(messages);
      return response;
    } catch (error) {
      console.log("there is an error in the response" + error.message);
      return { status: false, reason: "gpt", result: retryMessage };
    }
  } finally {
    console.log("finally");
  }
}

async function naturalLanguageFeedback(messages, modelResponse, instruction) {
  let naturalLanguageFeedbackPrompt = `Based on the following Requirement, provide feedback on whether the solution satisfies the Requirement.
    Requirement: ${modelResponse}
    Solution: ${instruction}
    Decide whether the solution whether the solution satisfies the Requirement. 
    If it does, say "YES". Otherwise, state your reasoning.`;
  var messages = [
    { role: "system", content: "you are a helpful assistant." },
    { role: "user", content: naturalLanguageFeedbackPrompt },
  ];
  let completion = await getGPTResponse(messages);

  // push the content of the last message to the new response
  let response = completion.choices[0]["message"]["content"];
  console.log(response);
  messages.push({ role: "assistant", content: response });
  return [
    messages,
    response,
    response.includes("yes") ||
      response.includes("YES") ||
      response.includes("Yes"),
  ];
}

async function evaluateUserInput(map, instruction, model) {
  // let tools = await createTools()
  let modelResponseFeedback = await naturalLanguageFeedback(
    [],
    model,
    instruction
  );
  let modelResponseMessages = modelResponseFeedback[0];
  let modelResponse = modelResponseFeedback[1];
  let responseSimilarity = modelResponseFeedback[2];
  if (!responseSimilarity) {
    return { status: false, reason: "teacher", result: modelResponse };
  }
  let query_msg = await parseMapAndFormQuerySentence(map, instruction);
  console.log(query_msg);
  let init_messages = await getInitialGPTResult(
    modelResponseMessages,
    query_msg
  );
  let messages = await generateAdditionalResponse(init_messages);
  messages = await generateAdditionalResponse(messages);
  messages = await judgeResponses(messages);
  let responseJson = await getResponseJson(messages);
  if (responseJson.status === false) {
    return responseJson;
  }
  // check validity of coordinates
  let coordinates = responseJson.result;
  let size = map.length;
  let validCoordinates = checkCoordinatesValidity(coordinates, size);
  if (!validCoordinates) {
    return { status: false, reason: "coord-invalid", result: retryMessage };
  }
  // convert coordinates to directions
  let directions = coordinatesToDirections(coordinates, size);
  console.log(directions);
  if (!directions.status) {
    return {
      status: true,
      reason: "coord-valid",
      result: directions.directions,
    };
  }
  return { status: true, reason: null, result: directions.directions };
}

async function generateAdditionalResponse(messages) {
  let criticismPrompt =
    "Review your previous response. Independently answer the question again. Let's think step by step.";
  messages.push({ role: "user", content: criticismPrompt });
  let completion = await getGPTResponse(messages);
  console.log(completion.choices[0]["message"]["content"]);
  // push the content of the last message to the new response
  messages.push({
    role: "assistant",
    content: completion.choices[0]["message"]["content"],
  });
  return messages;
}

async function judgeResponses(messages) {
  // summarize the previous responses
  let summarizePrompt =
    "You are now the judge. Based on the reasoning in the previous responses, independently summarize the majority response.";
  messages.push({ role: "user", content: summarizePrompt });
  let completion = await getGPTResponse(messages);
  console.log(completion.choices[0]["message"]["content"]);
  // push the content of the last message to the new response
  messages.push({
    role: "assistant",
    content: completion.choices[0]["message"]["content"],
  });
  return messages;
}

async function criticiseLastMessage(messages) {
  // let criticismPrompt = "Cautiously review your previous response to ensure if it is correct. If it is correct, repeat it word by word. Otherwise, give an updated response. Let's think step by step."
  // let new_messages = [...messages, {"role": "user", "content": criticismPrompt}]
  let criticismPrompt =
    "Ignore your previous response. Independently answer the question again. Let's think step by step";
  messages.push({ role: "user", content: criticismPrompt });
  let completion = await getGPTResponse(messages);
  console.log(completion.choices[0]["message"]["content"]);
  // push the content of the last message to the new response
  messages.push({
    role: "assistant",
    content: completion.choices[0]["message"]["content"],
  });

  // summarize the two responses
  let summarizePrompt =
    "You are now the judge. Based on the reasoning in the previous responses, independently decide which one is correct, and repeat the correct response word by word. Let's carefully think step by step.";
  messages.push({ role: "user", content: summarizePrompt });
  let completion2 = await getGPTResponse(messages);
  console.log(completion2.choices[0]["message"]["content"]);
  // push the content of the last message to the new response
  messages.push({
    role: "assistant",
    content: completion2.choices[0]["message"]["content"],
  });
  return messages;
}

// async function createTools() {
//     let tools = [
//         {
//             "type": "function",
//             "function": {
//                 "name": "get_current_character_from_map",
//                 "description": "Indexes the map which is a 2D array to get the character at the current coordinate.",
//                 "parameters": {
//                     "type": "object",
//                     "properties": {
//                         "map": {
//                             "type": "array",
//                             "description": "The input map in the form of a 2D array of characters. Moving up decreases x, moving down increases x, moving right increases y, moving left decreases y.",
//                         },
//                         "current_coordinate_x": {
//                             "type": "integer",
//                             "description": "The x coordinate of the current coordinate on the map in the form (x, y). ",
//                         },
//                         "current_coordinate_y": {
//                             "type": "integer",
//                             "description": "The y coordinate of the current coordinate on the map in the form (x, y). ",
//                         },
//                     },
//                     "required": ["map", "current_coordinate_x","current_coordinate_y"],
//                 },
//             }
//         },
//     ]
//     return tools
// }

async function summariseAndParseOutput(messages) {
  console.log(messages);
  let message = messages[messages.length - 1].content;
  console.log(message, message.includes("FALSE"));
  if (message.includes("FALSE")) {
    const summarize_prompt = `Based on your last response, return me a short explanation of why the instruction is unclear. Do not output anything else.`;
    messages.push({ role: "user", content: summarize_prompt });
    let completion = await getGPTResponse(messages);
    let output = completion.choices[0]["message"]["content"];
    // get the last coordinates
    // const output_prompt = `Based on your last response, return me a list of coordinates only. Do not output anything else.`
    // messages.push({"role": "user", "content": summarize_prompt})
    // let completion2 = await getGPTResponse(messages)
    // let coords = completion2.choices[0]['message']['content']
    // console.log(output2)
    return { status: false, reason: "gpt", result: retryMessage };
  } else {
    const getOutputPrompt = `Based on your last response, return me a list of coordinates only. Do not output anything else.`;
    messages.push({ role: "user", content: getOutputPrompt });
    let completion = await getGPTResponse(messages);
    let output = completion.choices[0]["message"]["content"];
    console.log(output);
    try {
      output = output.replace(/\(/g, "[").replace(/\)/g, "]");
      let outputArray = JSON.parse(output);
      console.log(outputArray);
      return { status: true, reason: null, result: outputArray };
    } catch (error) {
      throw new Error("Failed to parse output to JSON");
    }
  }
}

async function parseMapAndFormQuerySentence(map, instruction) {
  let mapStr = "[" + map.map((row) => JSON.stringify(row)).join("\n") + "]";
  console.log(mapStr);
  return "Map:\n" + mapStr + "\nInstruction: " + instruction;
}

function processDirection(orientation, directions, nextDirection) {
  directions.push(nextDirection);
  switch (nextDirection) {
    case "R":
      return (orientation + 1) % 4;
    case "L":
      return (orientation - 1) % 4;
    case "B":
      return (orientation + 2) % 4;
    default:
      return orientation;
  }
}

function coordinatesToDirections(coordinates, size) {
  const givenDirections = ["L", "R", "F", "B"];
  let directions = [];
  let orientation = 0;
  let stat = true;
  const ending_x = 1;
  const ending_y = size - 2;
  if (
    coordinates[coordinates.length - 1][0] !== ending_x ||
    coordinates[coordinates.length - 1][1] !== ending_y
  ) {
    stat = false;
  }
  for (let i = 0; i < coordinates.length - 1; i++) {
    let current = coordinates[i];
    let next = coordinates[i + 1];
    console.log(current, next, orientation, directions);
    if (orientation === 0) {
      if (current[0] === next[0]) {
        if (current[1] < next[1]) {
          orientation = processDirection(orientation, directions, "R");
        } else {
          orientation = processDirection(orientation, directions, "L");
        }
      } else {
        if (current[0] < next[0]) {
          orientation = processDirection(orientation, directions, "B");
        } else {
          orientation = processDirection(orientation, directions, "F");
        }
      }
    } else if (orientation === 1) {
      if (current[1] === next[1]) {
        if (current[0] < next[0]) {
          orientation = processDirection(orientation, directions, "R");
        } else {
          orientation = processDirection(orientation, directions, "L");
        }
      } else {
        if (current[1] < next[1]) {
          orientation = processDirection(orientation, directions, "F");
        } else {
          orientation = processDirection(orientation, directions, "B");
        }
      }
    } else if (orientation === 2) {
      if (current[0] === next[0]) {
        if (current[1] < next[1]) {
          orientation = processDirection(orientation, directions, "L");
        } else {
          orientation = processDirection(orientation, directions, "R");
        }
      } else {
        if (current[0] < next[0]) {
          orientation = processDirection(orientation, directions, "F");
        } else {
          orientation = processDirection(orientation, directions, "B");
        }
      }
    } else if (orientation === 3) {
      if (current[1] === next[1]) {
        if (current[0] < next[0]) {
          orientation = processDirection(orientation, directions, "L");
        } else {
          orientation = processDirection(orientation, directions, "R");
        }
      } else {
        if (current[1] < next[1]) {
          orientation = processDirection(orientation, directions, "B");
        } else {
          orientation = processDirection(orientation, directions, "F");
        }
      }
    }
  }
  return { status: stat, directions: directions };
}

function checkCoordinatesValidity(coordinates, size) {
  const starting_x = size - 2;
  const starting_y = 1;
  if (coordinates[0][0] !== starting_x || coordinates[0][1] !== starting_y) {
    console.log("not starting at starting point");
    return false;
  }
  for (let i = 0; i < coordinates.length; i++) {
    if (
      coordinates[i][0] < 0 ||
      coordinates[i][0] > size - 1 ||
      coordinates[i][1] < 0 ||
      coordinates[i][1] > size - 1
    ) {
      console.log("out of bounds");
      return false;
    }
  }
  // check that coordinates only move in one direction at a time and one step at a time
  for (let i = 0; i < coordinates.length - 1; i++) {
    if (
      coordinates[i][0] !== coordinates[i + 1][0] &&
      coordinates[i][1] !== coordinates[i + 1][1]
    ) {
      console.log("more than one direction");
      return false;
    }
    if (
      Math.abs(coordinates[i][0] - coordinates[i + 1][0]) > 1 ||
      Math.abs(coordinates[i][1] - coordinates[i + 1][1]) > 1
    ) {
      console.log("more than one step");
      return false;
    }
  }
  return true;
}

module.exports = { evaluateUserInput };
