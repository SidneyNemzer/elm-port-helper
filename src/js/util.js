export const checkArgType = (expectedType, value, name, index) => {
  checkArgType('string', expectedType, 'expectedType', 1)
  checkArgType('string', name, 'name', 3)
  checkArgType('number', index, 'index', 4)

  /* eslint-disable valid-typeof */
  if (typeof value !== expectedType) {
    throw new TypeError(`Argument ${index} "${name}" should be ${expectedType} but it's ${typeof value}`)
  }
}
