let genetic = require('genetic')
let _ = require('lodash')

const solutionSize = 11

const checkValues = [
  { mults: [0, 2, 1, 1.5, 5, 0, 0, 1, 1, 0, 1], result: 21000}, //COMISIONES
  { mults: [1, 2, 0, 0, 4, 2, 1 ,2 ,0 ,0 ,0], result: 22000}, //reyournal
  { mults: [3, 2, 0, 0, 3, 1, 1, 1, 1, 0, 0], result: 24000}, //PAGO
  { mults: [3, 2, 0, 0, 0, 4, 4, 2, 0, 0, 1], result: 36000}, //NOFIRM
  { mults: [2, 3, 0, 0, 4, 0, 1, 2, 4, 0, 1], result: 39000}, //GENTE
  { mults: [1, 1 ,2, 3, 3, 1, 1, 1 ,2, 0, 0], result: 40000} //sofia
];

const controlValue =  { mults: [0, 1, 1, 0, 5, 3, 4, 3, 0, 2 ,1],result: 28000} //WIDEVENTS

const getRandomSolution = (callback) => {
  let solution = {
    slopes: _.times(solutionSize, () => [Math.random()*1000, Math.random()*500, Math.random()*40,  Math.random()*10] ),
    gMultipliers: _.times(solutionSize, () => Math.random()*0.2 + 1),
  };

  callback(solution)
}


const getSolutionValue = (value, solution) => {
  let baseValue = Math.floor(_.reduce(
    value.mults,
    function(res, val, ix){
      res += _.reduce(
        solution.slopes[ix],
        (acum, solIx, pow) => {
          acum += solIx*Math.pow(val, pow);
          return acum;
        },
        0
      );
      return res;
    },
    0
  ));

  let multValue = _.reduce(
    value.mults,
    function(res,val, ix){
      if(val > 0)
        res *= (solution.gMultipliers[ix]*val);

      return res;
    },
    baseValue
  );

  return multValue - value.result;
}

const percentDeviation = (value, solution) => {
  const total = getSolutionValue(value, solution)
  const res = 1 - (total/value.result);
  return res;
}


const fitness = (solution, callback) => {
  const total = _.reduce(
    checkValues,
    function(tot, value){
      return tot + percentDeviation(value, solution);
    },
    0
  );

  const res = total/checkValues.length;
  callback(res);
}

const mutate = (solution, cb) => {
  let mutated = solution.slopes.slice();
  let mutatedMults = solution.gMultipliers.slice();

  const randPos = _.random(0, mutated.length - 1);
  mutated[randPos] = _.map(
    mutated[randPos],
    pos => _.random(pos - pos/10, pos + pos/10)
  );

  mutatedMults = _.map(
    solution.gMultipliers,
    val =>  _.random(val - val/10, val + val/10)
  );

  solution.slopes = mutated;
  solution.gMultipliers = mutatedMults;

  cb(solution);
}

const crossover = (s1, s2, cb) => {
  const parentsSlopes = [s1.slopes,s2.slopes];
  const parentsMulipliers = [s1.gMultipliers,s2.gMultipliers];

  const newSol = {
    slopes: _.times(
      solutionSize,
      function(ix){
        return parentsSlopes[_.random(0,parentsSlopes.length - 1)][ix]
      }
    ),

    gMultipliers:_.times(
      solutionSize,
      function(ix){
        return parentsMulipliers[_.random(0,parentsMulipliers.length - 1)][ix]
      }
    ),

  };

  cb(newSol);
}

const getStopCriteria = () => {
  return function(){
    return this.generation == 2000 || (this.statistics && this.statistics.maxScore > 0.90);
  }
}

const options = {
  getRandomSolution,
  popSize: 1000,
  stopCriteria: getStopCriteria(),
  fitness,
  mutateProbability: 0.2,
  mutate,
  crossoverProbability: 0.3,
  crossover
}


const task = new genetic.Task(options)

task.on('statistics', function (statistics) {
  console.log('Score',statistics.maxScore)
})

task.run( function(stats){
  console.log('Results', stats.maxScore, stats.max)

  _.each(checkValues, function(value){
    console.log(value.result, getSolutionValue(value, stats.max));
  });

  console.log("Control value",controlValue.result, getSolutionValue(controlValue, stats.max));
});
