export const rawCheckArgType = (expectedType, value, name, index) => {
  if (typeof value !== expectedType) {
    throw new TypeError(`Argument ${index} "${name}" should be ${expectedType} but it's ${typeof value}`)
  }
}

export const checkArgType = (expectedType, value, name, index) => {
  rawCheckArgType('string', expectedType, 'expectedType', 1)
  rawCheckArgType('string', name, 'name', 3)
  rawCheckArgType('number', index, 'index', 4)

  rawCheckArgType(expectedType, value, name, index)
}
