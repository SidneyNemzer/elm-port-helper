export const emptyPortListener = name => data =>
  console.warn(`The empty port "${name}" sent data to JavaScript:`, data)

export const tagFunction = args => ({
  tag: args[0],
  rest: args.slice(1)
})
