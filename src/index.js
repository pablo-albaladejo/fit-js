
import * as fitjs from './lib'

const filePath = './src/examples/WeightScaleSingleUser/WeightScaleSingleUser.fit'
const inputFitFile = fitjs.parseFile(filePath)

console.log(inputFitFile)