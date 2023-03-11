const operatorMap = {
  ">": "$gt",
  ">=": "$gte",
  "<": "$lt",
  "<=": "$lte",
  "=": "$eq",
  "<>": "$ne",
}

const convertOperator = (operator) => operatorMap[operator]
export default convertOperator
