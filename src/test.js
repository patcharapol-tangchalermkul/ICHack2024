const {evaluateUserInput} = require('./gpt');

async function test() {

    let map = [['X', 'X', 'X', 'X', 'X', 'X'],
                ['X', 'O', 'X', 'Y', 'E', 'X'],
                ['X', 'O', 'X', 'O', 'O', 'X'],
                ['X', 'Y', 'O', 'R', 'O', 'X'],
                ['X', 'S', 'X', 'X', 'O', 'X'],
                ['X', 'X', 'X', 'X', 'X', 'X']]
    // let map = [ ['X', 'X', 'X', 'X', 'X', 'X'],
    //             ['X', 'O', 'O', 'Y', 'E', 'X'],
    //             ['X', 'O', 'X', 'O', 'O', 'X'],
    //             ['X', 'Y', 'O', 'R', 'O', 'X'],
    //             ['X', 'S', 'X', 'X', 'O', 'X'],
    //             ['X', 'X', 'X', 'X', 'X', 'X']]
    let instr = "walk up from the starting point. If you are on a yellow box, turn right. If you are on a red box, turn left. If you are at the end point. Stop."
    // let badInstr = "Walk up 4 squares and turn right"
    // let instr = "walk up from the starting point. If you hit and wall, turn right and continue. Stop when you reach the endpoint."
    let modelResponse = "The solution should be elegant, and should impose a condition to turn right upon reaching a yellow box and turn left upon reaching a red box."
    let result = await evaluateUserInput(map, instr, modelResponse)
    console.log(result)
}
test()
