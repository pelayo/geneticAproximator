let genetic = require('genetic')
let _ = require('lodash')

const solutionSize = 10
const checkValues = [
  { mults: [0, 2, 4, 1, 0, 3, 3, 2, 5, 6], result: 15000},
  { mults: [1, 6, 5, 2, 1, 1, 2, 5, 7, 6],result: 20000},
  { mults: [1, 6, 5, 2, 2, 1, 2, 5, 7, 6],result: 21000},
  { mults: [1, 6, 5, 2, 2, 3, 2, 5, 7, 6],result: 25000},
  { mults: [1, 6, 5, 2, 2, 3, 2, 7, 7, 6],result: 30000},
  { mults: [2, 5, 6, 3, 3, 2, 4, 9, 8, 5], result: 45000}
];

const getRandomSolution = (callback) => {
  let solution = {
    slopes: _.times(solutionSize, () => [  Math.random()*100, Math.random()*100, Math.random()*1000,  Math.random()*1000] )
  };
  callback(solution)
}


const getSolutionValue = (value, solution) => {
  return Math.floor(_.reduce(
    value.mults,
    function(res, val, ix){
      res += solution[ix][0]*Math.pow(val,3) + solution[ix][1]*Math.pow(val,2) + solution[ix][2]*val + solution[ix][3];
      return res;
    },
    -1 * value.result
  ));
}

const percentDeviation = (value, solution) => {
  const total = getSolutionValue(value, solution)
  const res = 1 - (Math.abs(total) / value.result);
  return res > 0 ? res : 0;
}


const fitness = (solution, callback) => {
  const total = _.reduce(
    checkValues,
    function(tot, value){
      return tot + percentDeviation(value, solution.slopes);
    },
    0
  );

  const res = total/checkValues.length;
  callback(res);
}

const mutate = (solution, callback) => {
  let mutated = solution.slopes.slice();

  const randPos = _.random(0, mutated.length - 1);
  mutated[randPos] = _.map(
    mutated[randPos], pos => {
      return _.random(-2*pos, pos*10)
    }
  );


  callback(solution);
}


const crossover = (s1, s2, cb) => {
  const parents = [s1.slopes,s2.slopes];
  cb({
    slopes: _.times(
      solutionSize,
      function(ix){
        return parents[_.random(0,parents.length - 1)][ix]
      }
    )
  });
}


const stopCriteria = function(){
  return this.generation == 1000 || (this.statistics && this.statistics.maxScore > 0.95);
}

let options = {
  getRandomSolution,
  popSize: 1000,
  stopCriteria,
  fitness,
  mutateProbability: 0.3,
  mutate,
  crossoverProbability: 0.4,
  crossover
}


let task = new genetic.Task(options)

task.on('statistics', function (statistics) {
  console.log('Score',statistics.maxScore)
})

task.run( function(stats){
  console.log('Results', stats.maxScore, stats.max.slopes)
  _.each(checkValues, function(value){
    console.log(value.result, getSolutionValue(value, stats.max.slopes));
  });
});
